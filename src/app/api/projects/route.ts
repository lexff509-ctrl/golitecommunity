import { NextResponse } from "next/server";
import { db } from "@/db";
import { projects, payments } from "@/db/schema";
import { eq, sql, asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

function toSafeNumber(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

// GET - public list of active projects with computed amounts
export async function GET() {
  try {
    const result = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        goalAmount: projects.goal_amount,
        currentAmount: projects.current_amount,
        status: projects.status,
        active: projects.active,
        imageUrl: projects.image_url,
        createdAt: projects.created_at,
        collectedAmount: sql<string>`coalesce(sum(
          case when ${payments.status} in ('validated', 'paid')
          then ${payments.amount_usd}::numeric else 0 end
        ), 0)::text`,
      })
      .from(projects)
      .leftJoin(payments, eq(projects.id, payments.project_id))
      .where(eq(projects.active, true))
      .groupBy(
        projects.id,
        projects.name,
        projects.description,
        projects.goal_amount,
        projects.current_amount,
        projects.status,
        projects.active,
        projects.image_url,
        projects.created_at
      )
      .orderBy(asc(projects.created_at));

    const normalized = result.map((p) => {
      const goal = toSafeNumber(p.goalAmount);
      const collected = toSafeNumber(p.collectedAmount);
      const createdAt = p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt);
      return {
        ...p,
        goalAmount: goal.toString(),
        currentAmount: toSafeNumber(p.currentAmount).toString(),
        collectedAmount: collected.toString(),
        targetAmount: goal.toString(),
        startDate: createdAt,
        endDate: createdAt,
        countdownId: null,
        createdAt,
      };
    });

    return NextResponse.json({ projects: normalized });
  } catch (error) {
    console.error("Get projects error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
