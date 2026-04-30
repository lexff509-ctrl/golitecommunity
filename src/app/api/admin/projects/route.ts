import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects, payments } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq, desc, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

function toSafeNumber(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

// GET - admin list all projects with stats
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

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
        paymentCount: sql<number>`count(${payments.id})::int`,
      })
      .from(projects)
      .leftJoin(payments, eq(projects.id, payments.project_id))
      .groupBy(
        projects.id,
        projects.name,
        projects.description,
        projects.goal_amount,
        projects.current_amount,
        projects.status,
        projects.active,
        projects.image_url,
        projects.created_at,
      )
      .orderBy(desc(projects.created_at));

    const normalized = result.map((project) => {
      const goal = toSafeNumber(project.goalAmount);
      const current = toSafeNumber(project.currentAmount);
      const collected = toSafeNumber(project.collectedAmount);
      const createdAt =
        project.createdAt instanceof Date
          ? project.createdAt.toISOString()
          : String(project.createdAt);

      return {
        ...project,
        goalAmount: goal.toString(),
        currentAmount: current.toString(),
        collectedAmount: collected.toString(),
        targetAmount: goal.toString(),
        startDate: createdAt,
        endDate: createdAt,
        countdownId: null,
        createdAt,
        paymentCount: toSafeNumber(project.paymentCount),
      };
    });

    return NextResponse.json({ projects: normalized });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "Unauthorized" || msg === "Forbidden") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - create project
export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const { name, description, goalAmount, targetAmount, status, imageUrl } = body;
    const resolvedGoalAmount = goalAmount ?? targetAmount;

    if (!name || resolvedGoalAmount === undefined || resolvedGoalAmount === null) {
      return NextResponse.json(
        { error: "Nom et montant cible obligatoires" },
        { status: 400 }
      );
    }

    const goal = toSafeNumber(resolvedGoalAmount);
    if (goal <= 0) {
      return NextResponse.json(
        { error: "Le montant cible doit être un nombre positif" },
        { status: 400 }
      );
    }

    const [project] = await db
      .insert(projects)
      .values({
        name,
        description: description || "",
        goal_amount: goal.toString(),
        current_amount: "0",
        status: status || "active",
        image_url: imageUrl || null,
        active: true,
      })
      .returning();

    return NextResponse.json({ project }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "Unauthorized" || msg === "Forbidden") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
