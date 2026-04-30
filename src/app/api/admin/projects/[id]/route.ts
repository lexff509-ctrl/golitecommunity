import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects, payments } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

function toSafeNumber(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

// GET - single project detail with stats
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(_req);
    const { id } = await params;

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
      .where(eq(projects.id, id))
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
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Projet non trouvé" },
        { status: 404 }
      );
    }

    const project = result[0];
    const goal = toSafeNumber(project.goalAmount);
    const current = toSafeNumber(project.currentAmount);
    const collected = toSafeNumber(project.collectedAmount);
    const createdAt =
      project.createdAt instanceof Date
        ? project.createdAt.toISOString()
        : String(project.createdAt);

    return NextResponse.json({
      project: {
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
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "Unauthorized" || msg === "Forbidden") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT - update project
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(req);
    const { id } = await params;
    const body = await req.json();
    const { name, description, goalAmount, targetAmount, status, active, imageUrl } = body;
    const resolvedGoalAmount = goalAmount ?? targetAmount;

    await db
      .update(projects)
      .set({
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(resolvedGoalAmount !== undefined && {
          goal_amount: toSafeNumber(resolvedGoalAmount).toString(),
        }),
        ...(status !== undefined && { status }),
        ...(active !== undefined && { active }),
        ...(imageUrl !== undefined && { image_url: imageUrl || null }),
        updated_at: new Date(),
      })
      .where(eq(projects.id, id));

    return NextResponse.json({ message: "Projet mis à jour" });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "Unauthorized" || msg === "Forbidden") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - delete project
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(req);
    const { id } = await params;

    // Check if project has payments
    const payCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(payments)
      .where(eq(payments.project_id, id));

    if (payCount[0].count > 0) {
      return NextResponse.json(
        { error: "Impossible de supprimer un projet avec des paiements" },
        { status: 400 }
      );
    }

    await db.delete(projects).where(eq(projects.id, id));
    return NextResponse.json({ message: "Projet supprimé" });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "Unauthorized" || msg === "Forbidden") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
