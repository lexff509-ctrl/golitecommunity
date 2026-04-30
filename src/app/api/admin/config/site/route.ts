import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET - all config
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const result = await db.select().from(settings);
    return NextResponse.json({ config: result });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "Unauthorized" || msg === "Forbidden") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT - update config values
export async function PUT(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const { items } = body as { items: { key: string; value: string }[] };

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: "Format invalide" }, { status: 400 });
    }

    for (const item of items) {
      const existing = await db
        .select()
        .from(settings)
        .where(eq(settings.key, item.key))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(settings)
          .set({ value: item.value, updated_at: new Date() })
          .where(eq(settings.key, item.key));
      } else {
        await db.insert(settings).values({
          key: item.key,
          value: item.value,
        });
      }
    }

    return NextResponse.json({ message: "Configuration mise à jour" });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "Unauthorized" || msg === "Forbidden") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
