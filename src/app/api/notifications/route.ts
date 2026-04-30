import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, desc, sql, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET - list notifications
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const result = await db
      .select()
      .from(notifications)
      .where(eq(notifications.user_id, user.id))
      .orderBy(desc(notifications.created_at))
      .limit(50);

    const [unreadCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(
        and(
          eq(notifications.user_id, user.id),
          eq(notifications.read, false)
        )
      );

    return NextResponse.json({
      notifications: result,
      unreadCount: unreadCount.count,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erreur inconnue";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH - mark notification as read
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const { notificationId, markAll } = body;

    if (markAll) {
      await db
        .update(notifications)
        .set({ read: true })
        .where(
          and(
            eq(notifications.user_id, user.id),
            eq(notifications.read, false)
          )
        );
    } else if (notificationId) {
      await db
        .update(notifications)
        .set({ read: true })
        .where(
          and(
            eq(notifications.id, notificationId),
            eq(notifications.user_id, user.id)
          )
        );
    }

    return NextResponse.json({ message: "Mis à jour" });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erreur inconnue";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
