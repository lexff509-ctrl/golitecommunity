import { NextResponse } from "next/server";
import { db } from "@/db";
import { projects, payments } from "@/db/schema";
import { eq, sql, asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET - public list of active projects with computed amounts
export async function GET() {
  try {
    const result = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        targetAmount: projects.targetAmount,
        startDate: projects.startDate,
        endDate: projects.endDate,
        status: projects.status,
        active: projects.active,
        countdownId: projects.countdownId,
        // Computed: sum of validated + paid payments
        collectedAmount: sql<string>`coalesce(sum(
          case when ${payments.status} in ('validated', 'paid')
          then ${payments.amountUSD}::numeric else 0 end
        ), 0)::text`,
      })
      .from(projects)
      .leftJoin(payments, eq(projects.id, payments.projectId))
      .where(eq(projects.active, true))
      .groupBy(
        projects.id,
        projects.name,
        projects.description,
        projects.targetAmount,
        projects.startDate,
        projects.endDate,
        projects.status,
        projects.active,
        projects.countdownId,
      )
      .orderBy(asc(projects.startDate));

    return NextResponse.json({ projects: result });
  } catch (error) {
    console.error("Get projects error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
