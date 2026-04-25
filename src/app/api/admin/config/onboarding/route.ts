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
      .orderBy(asc(onboardingSteps.stepNumber));
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
    const { stepNumber, title, description, videoUrl, linkUrl, linkLabel, icon, active } = body;

    if (!stepNumber || !title) {
      return NextResponse.json(
        { error: "Numéro et titre obligatoires" },
        { status: 400 }
      );
    }

    const [step] = await db
      .insert(onboardingSteps)
      .values({
        stepNumber,
        title,
        description: description || "",
        videoUrl: videoUrl || null,
        linkUrl: linkUrl || null,
        linkLabel: linkLabel || null,
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
    const { id, stepNumber, title, description, videoUrl, linkUrl, linkLabel, icon, active } = body;

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    await db
      .update(onboardingSteps)
      .set({
        ...(stepNumber !== undefined && { stepNumber }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(videoUrl !== undefined && { videoUrl }),
        ...(linkUrl !== undefined && { linkUrl }),
        ...(linkLabel !== undefined && { linkLabel }),
        ...(icon !== undefined && { icon }),
        ...(active !== undefined && { active }),
        updatedAt: new Date(),
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
