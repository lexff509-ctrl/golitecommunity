import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { onboardingSteps } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq, asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET - all onboarding steps
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const result = await db
      .select()
      .from(onboardingSteps)
      .orderBy(asc(onboardingSteps.step_number));
    return NextResponse.json({ steps: result });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "Unauthorized" || msg === "Forbidden") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - create step
export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const { step_number, title, description, video_url, link_url, link_label, icon, active } = body;

    if (!step_number || !title) {
      return NextResponse.json(
        { error: "Numéro et titre obligatoires" },
        { status: 400 }
      );
    }

    const [step] = await db
      .insert(onboardingSteps)
      .values({
        step_number,
        title,
        description: description || "",
        video_url: video_url || null,
        link_url: link_url || null,
        link_label: link_label || null,
        icon: icon || null,
        active: active !== undefined ? active : true,
      })
      .returning();

    return NextResponse.json({ step }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "Unauthorized" || msg === "Forbidden") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT - update step
export async function PUT(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const { id, step_number, title, description, video_url, link_url, link_label, icon, active } = body;

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    await db
      .update(onboardingSteps)
      .set({
        ...(step_number !== undefined && { step_number }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(video_url !== undefined && { video_url }),
        ...(link_url !== undefined && { link_url }),
        ...(link_label !== undefined && { link_label }),
        ...(icon !== undefined && { icon }),
        ...(active !== undefined && { active }),
        updated_at: new Date(),
      })
      .where(eq(onboardingSteps.id, id));

    return NextResponse.json({ message: "Étape mise à jour" });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "Unauthorized" || msg === "Forbidden") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - delete step
export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    await db.delete(onboardingSteps).where(eq(onboardingSteps.id, id));
    return NextResponse.json({ message: "Étape supprimée" });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "Unauthorized" || msg === "Forbidden") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
