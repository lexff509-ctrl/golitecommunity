import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { countdowns } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET - get current countdown
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const result = await db
      .select()
      .from(countdowns)
      .orderBy(desc(countdowns.createdAt))
      .limit(1);
    return NextResponse.json({ countdown: result[0] || null });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "Unauthorized" || msg === "Forbidden") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT - update countdown
export async function PUT(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const { title, targetDate, active, message } = body;

    // Get existing
    const existing = await db
      .select()
      .from(countdowns)
      .orderBy(desc(countdowns.createdAt))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(countdowns)
        .set({
          ...(title !== undefined && { title }),
          ...(targetDate !== undefined && { targetDate: new Date(targetDate) }),
          ...(active !== undefined && { active }),
          ...(message !== undefined && { message }),
          updatedAt: new Date(),
        })
        .where(eq(countdowns.id, existing[0].id));
    } else {
      await db.insert(countdowns).values({
        title: title || "Lancement du programme",
        targetDate: targetDate ? new Date(targetDate) : new Date("2026-05-01T00:00:00Z"),
        active: active !== undefined ? active : true,
        message: message || "",
      });
    }

    return NextResponse.json({ message: "Countdown mis à jour" });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "Unauthorized" || msg === "Forbidden") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
