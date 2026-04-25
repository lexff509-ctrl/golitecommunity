import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects, payments } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

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
        targetAmount: projects.targetAmount,
        startDate: projects.startDate,
        endDate: projects.endDate,
        status: projects.status,
        active: projects.active,
        countdownId: projects.countdownId,
        createdAt: projects.createdAt,
        collectedAmount: sql<string>`coalesce(sum(
          case when ${payments.status} in ('validated', 'paid')
          then ${payments.amountUSD}::numeric else 0 end
        ), 0)::text`,
        paymentCount: sql<number>`count(${payments.id})::int`,
      })
      .from(projects)
      .leftJoin(payments, eq(projects.id, payments.projectId))
      .where(eq(projects.id, id))
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
        projects.createdAt,
      )
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Projet non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({ project: result[0] });
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
    const { name, description, targetAmount, startDate, endDate, status, active, countdownId } = body;

    await db
      .update(projects)
      .set({
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(targetAmount !== undefined && { targetAmount: String(targetAmount) }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: new Date(endDate) }),
        ...(status !== undefined && { status }),
        ...(active !== undefined && { active }),
        ...(countdownId !== undefined && { countdownId: countdownId || null }),
        updatedAt: new Date(),
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
      .where(eq(payments.projectId, id));

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
