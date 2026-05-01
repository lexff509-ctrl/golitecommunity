import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments, notifications, adminLogs, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

function toIso(value: unknown): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function mapPayment(row: typeof payments.$inferSelect & { userEmail?: string }) {
  return {
    id: row.id,
    transactionId: row.transaction_id,
    referenceCode: row.reference_code,
    userId: row.user_id,
    firstName: row.first_name,
    lastName: row.last_name,
    amountUSD: String(row.amount_usd ?? "0"),
    amountHTG: row.amount_htg ? String(row.amount_htg) : null,
    amount: String(row.amount ?? "0"),
    method: row.method,
    status: row.status,
    type: row.type,
    paymentProof: row.proof_url,
    paymentProofFilename: null,
    receptionPlatform: null,
    receptionDetails: null,
    rejectionReason: null,
    adminNotes: null,
    createdAt: toIso(row.created_at),
    validatedAt: null,
    paidAt: null,
    rejectedAt: null,
    updatedAt: toIso(row.updated_at),
    userEmail: row.userEmail || null,
  };
}

// GET - get single payment detail
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(req);
    const { id } = await params;

    const result = await db
      .select({
        id: payments.id,
        transaction_id: payments.transaction_id,
        reference_code: payments.reference_code,
        user_id: payments.user_id,
        project_id: payments.project_id,
        first_name: payments.first_name,
        last_name: payments.last_name,
        method: payments.method,
        amount_usd: payments.amount_usd,
        amount_htg: payments.amount_htg,
        amount: payments.amount,
        proof_url: payments.proof_url,
        status: payments.status,
        type: payments.type,
        related_id: payments.related_id,
        ip_address: payments.ip_address,
        created_at: payments.created_at,
        updated_at: payments.updated_at,
        userEmail: users.email,
      })
      .from(payments)
      .innerJoin(users, eq(payments.user_id, users.id))
      .where(eq(payments.id, id))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Transaction non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json({ payment: mapPayment(result[0]) });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erreur inconnue";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: message === "Unauthorized" ? 401 : 403 }
      );
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
    let updateStatus: "validated" | "rejected" | "paid";
    let notificationTitle = "";
    let notificationMessage = "";
    let logAction = "";

    switch (action) {
      case "validate":
        updateStatus = "validated";
        notificationTitle = "Paiement validé";
        notificationMessage = `Votre paiement ${payment.reference_code} a été validé par l'administrateur.`;
        logAction = "VALIDATED";
        break;

      case "reject":
        if (!rejectionReason) {
          return NextResponse.json(
            { error: "La raison du rejet est obligatoire" },
            { status: 400 }
          );
        }
        updateStatus = "rejected";
        notificationTitle = "Paiement rejeté";
        notificationMessage = `Votre paiement ${payment.reference_code} a été rejeté. Raison: ${rejectionReason}`;
        logAction = "REJECTED";
        break;

      case "pay":
        updateStatus = "paid";
        notificationTitle = "Paiement effectué";
        notificationMessage = `Votre paiement ${payment.reference_code} a été marqué comme payé.`;
        logAction = "MARKED_AS_PAID";
        break;

      default:
        return NextResponse.json(
          { error: "Action invalide" },
          { status: 400 }
        );
    }

    await db
      .update(payments)
      .set({
        status: updateStatus,
        updated_at: new Date(),
      })
      .where(eq(payments.id, id));

    // Notify client
    await db.insert(notifications).values({
      user_id: payment.user_id,
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
      admin_id: admin.id,
      target_type: "payment",
      target_id: id,
      action: logAction,
      details: {
        rejectionReason: rejectionReason || null,
        adminNotes: adminNotes || null,
      },
    });

    const [updated] = await db
      .select({
        id: payments.id,
        transaction_id: payments.transaction_id,
        reference_code: payments.reference_code,
        user_id: payments.user_id,
        project_id: payments.project_id,
        first_name: payments.first_name,
        last_name: payments.last_name,
        method: payments.method,
        amount_usd: payments.amount_usd,
        amount_htg: payments.amount_htg,
        amount: payments.amount,
        proof_url: payments.proof_url,
        status: payments.status,
        type: payments.type,
        related_id: payments.related_id,
        ip_address: payments.ip_address,
        created_at: payments.created_at,
        updated_at: payments.updated_at,
        userEmail: users.email,
      })
      .from(payments)
      .innerJoin(users, eq(payments.user_id, users.id))
      .where(eq(payments.id, id))
      .limit(1);

    return NextResponse.json({
      message: "Statut mis à jour avec succès",
      payment: updated ? mapPayment(updated) : null,
    });
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
