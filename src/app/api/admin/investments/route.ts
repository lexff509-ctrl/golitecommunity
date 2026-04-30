import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { investments, programs, users, adminLogs } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq, desc, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET - list all investments for admin
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 20;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    if (status && status !== "all") {
      whereConditions.push(eq(investments.status, status));
    }

    const whereClause = whereConditions.length > 0 
      ? eq(investments.status, status as string)
      : undefined;

    const result = await db
      .select({
        id: investments.id,
        userId: investments.user_id,
        programId: investments.program_id,
        amount: investments.amount,
        gain: investments.gain,
        expectedReturn: investments.expected_return,
        status: investments.status,
        createdAt: investments.created_at,
        updatedAt: investments.updated_at,
        userEmail: users.email,
        programName: programs.name,
      })
      .from(investments)
      .innerJoin(users, eq(investments.user_id, users.id))
      .innerJoin(programs, eq(investments.program_id, programs.id))
      .where(whereClause)
      .orderBy(desc(investments.created_at))
      .limit(limit)
      .offset(offset);

    // Get stats
    const [stats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        pending: sql<number>`count(*) filter (where ${investments.status} = 'pending')::int`,
        validated: sql<number>`count(*) filter (where ${investments.status} = 'validated')::int`,
        rejected: sql<number>`count(*) filter (where ${investments.status} = 'rejected')::int`,
        totalInvested: sql<number>`coalesce(sum(${investments.amount})::numeric, 0)`,
        totalGains: sql<number>`coalesce(sum(${investments.gain})::numeric, 0)`,
      })
      .from(investments);

    return NextResponse.json({
      investments: result,
      stats: {
        total: stats.total,
        pending: stats.pending,
        validated: stats.validated,
        rejected: stats.rejected,
        totalInvested: stats.totalInvested,
        totalGains: stats.totalGains,
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
    console.error("Admin investments error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}