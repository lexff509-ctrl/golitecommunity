import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments, notifications, adminLogs } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET - get single payment detail
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(_req);
    const { id } = await params;

    const result = await db
      .select()
      .from(payments)
      .where(eq(payments.id, id))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Transaction non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json({ payment: result[0] });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erreur inconnue";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH - update payment status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req);
    const { id } = await params;
    const body = await req.json();
    const { action, rejectionReason, adminNotes } = body;

    const result = await db
      .select()
      .from(payments)
      .where(eq(payments.id, id))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Transaction non trouvée" },
        { status: 404 }
      );
    }

    const payment = result[0];
    const now = new Date();

    let updateData: Record<string, unknown> = { updatedAt: now };
    let notificationTitle = "";
    let notificationMessage = "";
    let logAction = "";

    switch (action) {
      case "validate":
        updateData.status = "validated";
        updateData.validatedAt = now;
        notificationTitle = "Paiement validé";
        notificationMessage = `Votre paiement ${payment.transactionId} a été validé par l'administrateur.`;
        logAction = "VALIDATED";
        break;

      case "reject":
        if (!rejectionReason) {
          return NextResponse.json(
            { error: "La raison du rejet est obligatoire" },
            { status: 400 }
          );
        }
        updateData.status = "rejected";
        updateData.rejectedAt = now;
        updateData.rejectionReason = rejectionReason;
        notificationTitle = "Paiement rejeté";
        notificationMessage = `Votre paiement ${payment.transactionId} a été rejeté. Raison: ${rejectionReason}`;
        logAction = "REJECTED";
        break;

      case "pay":
        updateData.status = "paid";
        updateData.paidAt = now;
        notificationTitle = "Paiement effectué";
        notificationMessage = `Votre paiement ${payment.transactionId} a été marqué comme payé.`;
        logAction = "MARKED_AS_PAID";
        break;

      default:
        return NextResponse.json(
          { error: "Action invalide" },
          { status: 400 }
        );
    }

    if (adminNotes) {
      updateData.adminNotes = adminNotes;
    }

    await db
      .update(payments)
      .set(updateData)
      .where(eq(payments.id, id));

    // Notify client
    await db.insert(notifications).values({
      userId: payment.userId,
      title: notificationTitle,
      message: notificationMessage,
      type:
        action === "validate"
          ? "success"
          : action === "reject"
            ? "error"
            : "success",
      link: "/dashboard/history",
    });

    // Log admin action
    await db.insert(adminLogs).values({
      adminId: admin.id,
      paymentId: id,
      action: logAction,
      details: rejectionReason || adminNotes || null,
    });

    return NextResponse.json({ message: "Statut mis à jour avec succès" });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erreur inconnue";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    console.error("Admin update payment error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
