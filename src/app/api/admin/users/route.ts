import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, investments, payments, cryptoTransactions } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq, desc, sql, count } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET - list all users for admin
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const role = searchParams.get("role");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 20;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    if (role && role !== "all") {
      whereConditions.push(eq(users.role, role));
    }
    if (search) {
      whereConditions.push(sql`${users.email} ILIKE ${"%" + search + "%"}`);
    }

    const whereClause = whereConditions.length > 0 
      ? sql`${whereConditions.length > 1 ? sql`(${whereConditions[0]}) AND (${whereConditions[1]})` : whereConditions[0]}` 
      : undefined;

    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        createdAt: users.created_at,
      })
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.created_at))
      .limit(limit)
      .offset(offset);

    // Get stats
    const [stats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        admins: sql<number>`count(*) filter (where ${users.role} = 'admin')::int`,
        users: sql<number>`count(*) filter (where ${users.role} = 'user')::int`,
      })
      .from(users);

    return NextResponse.json({
      users: allUsers,
      stats: {
        total: stats.total,
        admins: stats.admins,
        users: stats.users,
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
    console.error("Admin users error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}