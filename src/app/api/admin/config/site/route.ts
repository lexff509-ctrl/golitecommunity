import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { siteConfig } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET - all config
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const result = await db.select().from(siteConfig);
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
        .from(siteConfig)
        .where(eq(siteConfig.key, item.key))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(siteConfig)
          .set({ value: item.value, updatedAt: new Date() })
          .where(eq(siteConfig.key, item.key));
      } else {
        await db.insert(siteConfig).values({
          key: item.key,
          value: item.value,
          category: "general",
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
