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
    const { name, description, goalAmount, status, imageUrl } = body;

    if (!name || !goalAmount) {
      return NextResponse.json(
        { error: "Nom et montant cible obligatoires" },
        { status: 400 }
      );
    }

    const [project] = await db
      .insert(projects)
      .values({
        name,
        description: description || "",
        goal_amount: String(goalAmount),
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
