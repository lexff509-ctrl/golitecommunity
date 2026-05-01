import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import {
  appendReceptionMethod,
  getReceptionMethodsForPayment,
} from "@/lib/reception-methods";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;

    const [payment] = await db
      .select({ id: payments.id })
      .from(payments)
      .where(and(eq(payments.id, id), eq(payments.user_id, user.id)))
      .limit(1);

    if (!payment) {
      return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });
    }

    const methods = await getReceptionMethodsForPayment(id);
    return NextResponse.json({ receptionMethods: methods });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;
    const body = await req.json();
    const { receptionPlatform, receptionDetails } = body;

    if (!receptionPlatform) {
      return NextResponse.json(
        { error: "Plateforme de réception requise" },
        { status: 400 }
      );
    }

    const [payment] = await db
      .select({ id: payments.id })
      .from(payments)
      .where(and(eq(payments.id, id), eq(payments.user_id, user.id)))
      .limit(1);

    if (!payment) {
      return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });
    }

    const methods = await appendReceptionMethod(
      id,
      String(receptionPlatform),
      (receptionDetails || {}) as Record<string, string>
    );

    return NextResponse.json({
      message: "Moyen de réception ajouté avec succès",
      receptionMethods: methods,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
