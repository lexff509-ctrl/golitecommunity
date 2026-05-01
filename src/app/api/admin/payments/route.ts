import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments, users, adminLogs, investments, cryptoTransactions } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq, desc, and, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

function toIso(value: unknown): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

// GET - list all payments for admin
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const method = searchParams.get("method");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 20;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    if (status && status !== "all") {
      whereConditions.push(eq(payments.status, status));
    }
    if (method && method !== "all") {
      whereConditions.push(eq(payments.method, method));
    }
    if (search) {
      whereConditions.push(
        sql`(${users.email} ILIKE ${"%" + search + "%"} OR ${payments.reference_code} ILIKE ${"%" + search + "%"})`
      );
    }

    const whereClause =
      whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const result = await db
      .select({
        id: payments.id,
        transactionId: payments.transaction_id,
        referenceCode: payments.reference_code,
        userId: payments.user_id,
        firstName: payments.first_name,
        lastName: payments.last_name,
        amountUSD: payments.amount_usd,
        amountHTG: payments.amount_htg,
        amount: payments.amount,
        method: payments.method,
        status: payments.status,
        type: payments.type,
        relatedId: payments.related_id,
        paymentProof: payments.proof_url,
        ipAddress: payments.ip_address,
        createdAt: payments.created_at,
        updatedAt: payments.updated_at,
        userEmail: users.email,
      })
      .from(payments)
      .innerJoin(users, eq(payments.user_id, users.id))
      .where(whereClause)
      .orderBy(desc(payments.created_at))
      .limit(limit)
      .offset(offset);

    // Get stats
    const [stats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        pending: sql<number>`count(*) filter (where ${payments.status} = 'pending')::int`,
        validated: sql<number>`count(*) filter (where ${payments.status} = 'validated')::int`,
        paid: sql<number>`count(*) filter (where ${payments.status} = 'paid')::int`,
        rejected: sql<number>`count(*) filter (where ${payments.status} = 'rejected')::int`,
        totalAmount: sql<number>`coalesce(sum(${payments.amount})::numeric, 0)`,
      })
      .from(payments);

    const totalFiltered = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(payments)
      .innerJoin(users, eq(payments.user_id, users.id))
      .where(whereClause);

    return NextResponse.json({
      payments: result.map((payment) => ({
        ...payment,
        amountUSD: String(payment.amountUSD ?? "0"),
        amountHTG: payment.amountHTG ? String(payment.amountHTG) : null,
        amount: String(payment.amount ?? "0"),
        createdAt: toIso(payment.createdAt),
        updatedAt: toIso(payment.updatedAt),
        validatedAt: null,
        paidAt: null,
        rejectedAt: null,
        rejectionReason: null,
        adminNotes: null,
        paymentProofFilename: null,
        receptionPlatform: null,
        receptionDetails: null,
      })),
      stats: {
        total: stats.total,
        pending: stats.pending,
        approved: stats.validated,
        validated: stats.validated,
        paid: stats.paid,
        rejected: stats.rejected,
        totalAmount: stats.totalAmount,
      },
      pagination: {
        page,
        limit,
        total: totalFiltered[0].count,
        totalPages: Math.ceil(totalFiltered[0].count / limit),
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erreur inconnue";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: message === "Unauthorized" ? 401 : 403 }
      );
    }
    console.error("Admin payments error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// PATCH - validate or reject payment
export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAdmin(req);

    const body = await req.json();
    const { id, status, rejectionReason } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: "ID et status requis" },
        { status: 400 }
      );
    }

    // Validate status
    if (!["validated", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Status invalide. Utilisez 'validated' ou 'rejected'." },
        { status: 400 }
      );
    }

    // Get current payment
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, id))
      .limit(1);

    if (!payment) {
      return NextResponse.json(
        { error: "Paiement introuvable" },
        { status: 404 }
      );
    }

    // Check if payment is still pending
    if (payment.status !== "pending") {
      return NextResponse.json(
        { error: "Impossible de modifier un paiement qui n'est plus en attente" },
        { status: 400 }
      );
    }

    // Update payment status
    const updatedPayment = await db.update(payments)
      .set({
        status,
        updated_at: new Date(),
      })
      .where(eq(payments.id, id))
      .returning();

    // Sync related entity status
    if (payment.related_id) {
      if (status === "validated") {
        if (payment.type === "investment") {
          await db.update(investments)
            .set({ status: "validated", updated_at: new Date() })
            .where(eq(investments.id, payment.related_id));
        } else if (payment.type === "crypto") {
          await db.update(cryptoTransactions)
            .set({ status: "validated", updated_at: new Date() })
            .where(eq(cryptoTransactions.id, payment.related_id));
        }
      } else if (status === "rejected") {
        if (payment.type === "investment") {
          await db.update(investments)
            .set({ status: "rejected", updated_at: new Date() })
            .where(eq(investments.id, payment.related_id));
        } else if (payment.type === "crypto") {
          await db.update(cryptoTransactions)
            .set({ status: "rejected", updated_at: new Date() })
            .where(eq(cryptoTransactions.id, payment.related_id));
        }
      }
    }

    // Log action
    await db.insert(adminLogs).values({
      admin_id: session.id,
      action: status === "validated" ? "validate_payment" : "reject_payment",
      target_type: "payment",
      target_id: id,
      details: { status, rejectionReason },
    });

    return NextResponse.json({
      payment: updatedPayment[0],
      message: `Paiement ${status === "validated" ? "validé" : "rejeté"} avec succès`
    });

  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erreur inconnue";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: message === "Unauthorized" ? 401 : 403 }
      );
    }
    console.error("Admin payment update error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
