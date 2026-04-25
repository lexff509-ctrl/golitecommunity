import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq, desc, and, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

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
        sql`(${payments.firstName} ILIKE ${"%" + search + "%"} OR ${payments.lastName} ILIKE ${"%" + search + "%"} OR ${payments.transactionId} ILIKE ${"%" + search + "%"})`
      );
    }

    const whereClause =
      whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const result = await db
      .select({
        id: payments.id,
        transactionId: payments.transactionId,
        userId: payments.userId,
        firstName: payments.firstName,
        lastName: payments.lastName,
        amountUSD: payments.amountUSD,
        amountHTG: payments.amountHTG,
        currency: payments.currency,
        method: payments.method,
        status: payments.status,
        paymentProof: payments.paymentProof,
        paymentProofFilename: payments.paymentProofFilename,
        receptionPlatform: payments.receptionPlatform,
        receptionDetails: payments.receptionDetails,
        rejectionReason: payments.rejectionReason,
        adminNotes: payments.adminNotes,
        createdAt: payments.createdAt,
        updatedAt: payments.updatedAt,
        validatedAt: payments.validatedAt,
        paidAt: payments.paidAt,
        rejectedAt: payments.rejectedAt,
        userEmail: users.email,
      })
      .from(payments)
      .innerJoin(users, eq(payments.userId, users.id))
      .where(whereClause)
      .orderBy(desc(payments.createdAt))
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
        totalAmount: sql<number>`coalesce(sum(${payments.amountUSD})::numeric, 0)`,
      })
      .from(payments);

    const totalFiltered = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(payments)
      .innerJoin(users, eq(payments.userId, users.id))
      .where(whereClause);

    return NextResponse.json({
      payments: result,
      stats: {
        total: stats.total,
        pending: stats.pending,
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
