import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { faqs } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq, asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET - all FAQs
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const result = await db.select().from(faqs).orderBy(asc(faqs.order));
    return NextResponse.json({ faqs: result });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "Unauthorized" || msg === "Forbidden") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - create FAQ
export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const { question, answer, category, order, active } = body;

    if (!question || !answer) {
      return NextResponse.json(
        { error: "Question et réponse obligatoires" },
        { status: 400 }
      );
    }

    const [faq] = await db
      .insert(faqs)
      .values({
        question,
        answer,
        category: category || "general",
        order: order || 0,
        active: active !== undefined ? active : true,
      })
      .returning();

    return NextResponse.json({ faq }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "Unauthorized" || msg === "Forbidden") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT - update FAQ
export async function PUT(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const { id, question, answer, category, order, active } = body;

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    await db
      .update(faqs)
      .set({
        ...(question !== undefined && { question }),
        ...(answer !== undefined && { answer }),
        ...(category !== undefined && { category }),
        ...(order !== undefined && { order }),
        ...(active !== undefined && { active }),
        updated_at: new Date(),
      })
      .where(eq(faqs.id, id));

    return NextResponse.json({ message: "FAQ mise à jour" });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "Unauthorized" || msg === "Forbidden") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - delete FAQ
export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    await db.delete(faqs).where(eq(faqs.id, id));
    return NextResponse.json({ message: "FAQ supprimée" });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "Unauthorized" || msg === "Forbidden") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
