import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { cryptoTransactions, users, adminLogs } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq, desc, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET - list all crypto transactions for admin
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 20;
    const offset = (page - 1) * limit;

    let whereClause;
    if (status && status !== "all") {
      whereClause = eq(cryptoTransactions.status, status);
    }

    const result = await db
      .select({
        id: cryptoTransactions.id,
        userId: cryptoTransactions.user_id,
        amountHtg: cryptoTransactions.amount_htg,
        amountUsd: cryptoTransactions.amount_usd,
        cryptoType: cryptoTransactions.crypto_type,
        network: cryptoTransactions.network,
        walletAddress: cryptoTransactions.wallet_address,
        status: cryptoTransactions.status,
        createdAt: cryptoTransactions.created_at,
        updatedAt: cryptoTransactions.updated_at,
        userEmail: users.email,
      })
      .from(cryptoTransactions)
      .innerJoin(users, eq(cryptoTransactions.user_id, users.id))
      .where(whereClause)
      .orderBy(desc(cryptoTransactions.created_at))
      .limit(limit)
      .offset(offset);

    // Get stats
    const [stats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        pending: sql<number>`count(*) filter (where ${cryptoTransactions.status} = 'pending')::int`,
        validated: sql<number>`count(*) filter (where ${cryptoTransactions.status} = 'validated')::int`,
        rejected: sql<number>`count(*) filter (where ${cryptoTransactions.status} = 'rejected')::int`,
        totalHtg: sql<number>`coalesce(sum(${cryptoTransactions.amount_htg})::numeric, 0)`,
        totalUsd: sql<number>`coalesce(sum(${cryptoTransactions.amount_usd})::numeric, 0)`,
      })
      .from(cryptoTransactions);

    return NextResponse.json({
      cryptoTransactions: result,
      stats: {
        total: stats.total,
        pending: stats.pending,
        validated: stats.validated,
        rejected: stats.rejected,
        totalHtg: stats.totalHtg,
        totalUsd: stats.totalUsd,
      },
      pagination: {
        page,
        limit,
        total: stats.total,
        totalPages: Math.ceil(Number(stats.total) / limit),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: message === "Unauthorized" ? 401 : 403 }
      );
    }
    console.error("Admin crypto error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}