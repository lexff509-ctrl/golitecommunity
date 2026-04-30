import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { investments, programs, users, rateLimits } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Allowed payment methods
const ALLOWED_METHODS = ["wave", "moncash", "natcash", "crypto"] as const;
type PaymentMethod = typeof ALLOWED_METHODS[number];

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 10;

/**
 * Check rate limit using persistent database storage
 */
async function checkRateLimit(userId: string, ip: string): Promise<boolean> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS);
  const windowEnd = new Date(now.getTime() + RATE_LIMIT_WINDOW_MS);
  
  const key = `investment:${userId}:${ip}`;
  
  // Try to update existing rate limit
  const updated = await db
    .update(rateLimits)
    .set({
      count: sql`count + 1`,
    })
    .where(
      and(
        eq(rateLimits.key, key),
        eq(rateLimits.window_end, windowEnd)
      )
    )
    .returning();
  
  if (updated.length === 0) {
    // No existing record, check if there's one for current window
    const existing = await db
      .select()
      .from(rateLimits)
      .where(
        and(
          eq(rateLimits.key, key),
          sql`${rateLimits.window_start} <= ${now} AND ${rateLimits.window_end} >= ${now}`
        )
      )
      .limit(1);
    
    if (existing.length > 0) {
      if (existing[0].count >= RATE_LIMIT_MAX_REQUESTS) {
        return false; // Rate limited
      }
      // Increment existing
      await db
        .update(rateLimits)
        .set({ count: existing[0].count + 1 })
        .where(eq(rateLimits.id, existing[0].id));
    } else {
      // Create new rate limit entry
      await db.insert(rateLimits).values({
        key,
        count: 1,
        window_start: windowStart,
        window_end: windowEnd,
      });
    }
  }
  
  return true;
}

/**
 * Validate proof URL - must be a valid URL, not just a filename
 */
function isValidProofUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Only allow http/https
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Generate unique reference code
 */
function generateReferenceCode(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `INV-${timestamp}-${random}`.toUpperCase();
}

// GET /api/investments - List user's investments
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userInvestments = await db
      .select({
        id: investments.id,
        amount: investments.amount,
        gain: investments.gain,
        expectedReturn: investments.expected_return,
        status: investments.status,
        programId: investments.program_id,
        createdAt: investments.created_at,
      })
            .from(investments)
      .innerJoin(programs, eq(programs.id, investments.program_id))
      .where(eq(investments.user_id, session.id))
      .orderBy(investments.created_at);

    return NextResponse.json(userInvestments);
  } catch (error) {
    console.error("Error fetching investments:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des investissements" },
      { status: 500 }
    );
  }
}

// POST /api/investments - Create new investment
export async function POST(req: NextRequest) {
  const client = await db.$client.connect();
  
  try {
    const session = await getSessionUser(req);
    if (!session?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Get client IP for rate limiting
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() 
      || req.headers.get("x-real-ip") 
      || "unknown";

    // Check rate limit
    const allowed = await checkRateLimit(session.id, ip);
    if (!allowed) {
      return NextResponse.json(
        { error: "Trop de requêtes. Veuillez réessayer plus tard." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { programId, amount, paymentId, idempotencyKey, method, proofUrl } = body;

    // Validate required fields
    if (!programId || !amount || !paymentId) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants" },
        { status: 400 }
      );
    }

    // 1. Idempotency check using idempotency_key
    if (idempotencyKey) {
      const existing = await db
        .select()
        .from(investments)
        .where(eq(investments.idempotency_key, idempotencyKey))
        .limit(1);
      
      if (existing.length > 0) {
        return NextResponse.json({
          investment: existing[0],
          message: "Investissement déjà créé (idempotency)",
          duplicate: true
        }, { status: 200 });
      }
    }

    // 2. Validate amount is a valid number
    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json(
        { error: "Montant invalide" },
        { status: 400 }
      );
    }

    // 3. Validate method with whitelist
    if (method && !ALLOWED_METHODS.includes(method as PaymentMethod)) {
      return NextResponse.json(
        { error: "Méthode de paiement non autorisée" },
        { status: 400 }
      );
    }

    // 4. Validate proof URL if provided
    if (proofUrl && !isValidProofUrl(proofUrl)) {
      return NextResponse.json(
        { error: "URL de preuve invalide" },
        { status: 400 }
      );
    }

    // Start transaction
    await client.query("BEGIN");

    try {
      // 4. Lock active program with FOR UPDATE
      const programResult = await client.query(
        `SELECT id, name, min_amount, max_amount, multipliers, active 
         FROM programs 
         WHERE id = $1 AND active = true 
         FOR UPDATE`,
        [programId]
      );

      if (programResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "Programme introuvable ou inactif" },
          { status: 404 }
        );
      }

      const program = programResult.rows[0];

      // Parse multipliers
      const multipliers = typeof program.multipliers === "string" 
        ? JSON.parse(program.multipliers) 
        : program.multipliers;

      const amountStr = String(amountNum);

      // Validate amount against multipliers (only allowed amounts)
      if (!multipliers[amountStr]) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "Montant non autorisé. Utilisez les montants disponibles." },
          { status: 400 }
        );
      }

      // Validate min/max
      if (amountNum < Number(program.min_amount) || amountNum > Number(program.max_amount)) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: `Montant doit être entre ${program.min_amount} et ${program.max_amount}` },
          { status: 400 }
        );
      }

      // Calculate gain
      const gain = multipliers[amountStr];
      const expectedReturn = gain;

      // 3. Create investment first, then payment with related_id
      const referenceCode = generateReferenceCode();
      
            const investmentResult = await client.query(
        `INSERT INTO investments (user_id, program_id, amount, gain, expected_return, status, idempotency_key)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, user_id, program_id, amount, gain, expected_return, status, idempotency_key, created_at`,
        [session.id, programId, amountNum, gain, expectedReturn, "pending", idempotencyKey || null]
      );

      const newInvestment = investmentResult.rows[0];

      // Now create payment with related_id = investment.id
      if (paymentId || method) {
                await client.query(
          `INSERT INTO payments (id, reference_code, transaction_id, user_id, first_name, last_name, method, amount, amount_usd, proof_url, status, type, related_id, ip_address)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [
            paymentId || null,
            referenceCode,
            referenceCode,
            session.id,
            session.firstName || '',
            session.lastName || '',
            method || "wave",
            amountNum,
            amountNum,
            proofUrl || "",
            "pending",
            "investment",
            newInvestment.id,
            ip
          ]
        );
      }

      await client.query("COMMIT");

      return NextResponse.json({
        investment: newInvestment,
        referenceCode,
        message: "Investissement créé avec succès"
      }, { status: 201 });

    } catch (txError) {
      await client.query("ROLLBACK");
      throw txError;
    }

  } catch (error) {
    console.error("Error creating investment:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'investissement" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}