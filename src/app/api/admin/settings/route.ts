import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { settings, adminLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/settings - Get all settings
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const allSettings = await db.select().from(settings);

    // Convert to key-value object
    const settingsObj: Record<string, string> = {};
    allSettings.forEach(s => {
      settingsObj[s.key] = s.value;
    });

    return NextResponse.json(settingsObj);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: message === "Unauthorized" ? 401 : 403 }
      );
    }
    console.error("Admin settings error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH /api/admin/settings - Update settings
export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAdmin(req);

    const body = await req.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: "Clé et valeur requises" },
        { status: 400 }
      );
    }

    // Update or insert setting
    const updatedSetting = await db
      .insert(settings)
      .values({
        key,
        value: String(value),
        updated_at: new Date(),
      })
      .onConflictDoUpdate({
        target: settings.key,
        set: {
          value: String(value),
          updated_at: new Date(),
        },
      })
      .returning();

        // Log action
    await db.insert(adminLogs).values({
      admin_id: session.id,
      action: "update_setting",
      target_type: "setting",
      target_id: updatedSetting[0].id,
      details: { key, value },
    });

    return NextResponse.json({
      setting: updatedSetting[0],
      message: "Paramètre mis à jour avec succès"
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: message === "Unauthorized" ? 401 : 403 }
      );
    }
    console.error("Admin settings update error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}