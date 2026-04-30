import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments, notifications, users } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

function toIso(value: unknown): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function generateTransactionId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "GL-";
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

// GET - list client's payments
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const result = await db
      .select()
      .from(payments)
      .where(eq(payments.user_id, user.id))
      .orderBy(desc(payments.created_at));

    const normalizedPayments = result.map((payment) => ({
      id: payment.id,
      transactionId: payment.transaction_id,
      referenceCode: payment.reference_code,
      userId: payment.user_id,
      projectId: payment.project_id,
      firstName: payment.first_name,
      lastName: payment.last_name,
      method: payment.method,
      amountUSD: String(payment.amount_usd ?? "0"),
      amountHTG: payment.amount_htg ? String(payment.amount_htg) : null,
      amount: String(payment.amount ?? "0"),
      currency: payment.amount_htg ? "HTG" : "USD",
      paymentProof: payment.proof_url,
      status: payment.status,
      type: payment.type,
      relatedId: payment.related_id,
      ipAddress: payment.ip_address,
      createdAt: toIso(payment.created_at),
      updatedAt: toIso(payment.updated_at),
      validatedAt: null,
      paidAt: null,
      rejectedAt: null,
      rejectionReason: null,
      receptionPlatform: null,
    }));

    return NextResponse.json({ payments: normalizedPayments });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erreur inconnue";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    console.error("Get payments error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST - create a new payment
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();

    const {
      firstName,
      lastName,
      amountUSD,
      method,
      paymentProof,
      paymentProofFilename,
      receptionPlatform,
      receptionDetails,
      projectId,
    } = body;

    if (!firstName || !lastName || !amountUSD || !method) {
      return NextResponse.json(
        { error: "Tous les champs obligatoires doivent être remplis" },
        { status: 400 }
      );
    }

    const amount = parseFloat(amountUSD);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Le montant doit être un nombre positif" },
        { status: 400 }
      );
    }

    if (!paymentProof) {
      return NextResponse.json(
        { error: "La preuve de paiement est obligatoire" },
        { status: 400 }
      );
    }

    const validMethods = ["MonCash", "NatCash", "Binance", "Crypto", "Zelle"];
    if (!validMethods.includes(method)) {
      return NextResponse.json(
        { error: "Méthode de paiement invalide" },
        { status: 400 }
      );
    }

    // Conversion: MonCash / NatCash -> 1 USD = 150 HTG
    let amountHTG: number | null = null;
    let currency = "USD";
    if (method === "MonCash" || method === "NatCash") {
      amountHTG = amount * 150;
      currency = "HTG";
    }

    const transactionId = generateTransactionId();

    const referenceCode = `REF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const [payment] = await db
      .insert(payments)
      .values({
        transaction_id: transactionId,
        reference_code: referenceCode,
        user_id: user.id,
        project_id: projectId || null,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        amount_usd: amount.toString(),
        amount_htg: amountHTG ? amountHTG.toString() : null,
        amount: amount.toString(),
        method,
        status: "pending",
        proof_url: paymentProof,
        type: "payment",
        related_id: null,
      })
      .returning();

    // Notify all admins
    const admins = await db
      .select()
      .from(users)
      .where(eq(users.role, "admin"));

    for (const admin of admins) {
      await db.insert(notifications).values({
        user_id: admin.id,
        title: "Nouveau paiement reçu",
        message: `${firstName} ${lastName} a soumis un paiement de ${amount} ${currency === "HTG" ? `(${amountHTG} HTG)` : "USD"} via ${method}.`,
        type: "info",
        link: "/admin",
      });
    }

    // Notify client
    await db.insert(notifications).values({
      user_id: user.id,
      title: "Paiement soumis",
      message: `Votre paiement ${transactionId} a été soumis avec succès. Statut: En attente.`,
      type: "success",
      link: "/dashboard/history",
    });

    return NextResponse.json(
      { message: "Paiement soumis avec succès", payment },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erreur inconnue";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    console.error("Create payment error:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la création du paiement" },
      { status: 500 }
    );
  }
}
