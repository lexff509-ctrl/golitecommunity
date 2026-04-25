import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects, payments } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq, desc, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET - admin list all projects with stats
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

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
      .orderBy(desc(projects.createdAt));

    return NextResponse.json({ projects: result });
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
    const { name, description, targetAmount, startDate, endDate, status, countdownId } = body;

    if (!name || !targetAmount || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Nom, montant cible, dates obligatoires" },
        { status: 400 }
      );
    }

    const [project] = await db
      .insert(projects)
      .values({
        name,
        description: description || "",
        targetAmount: String(targetAmount),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: status || "upcoming",
        countdownId: countdownId || null,
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
