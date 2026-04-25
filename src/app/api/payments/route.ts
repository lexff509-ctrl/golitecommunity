import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments, notifications, users } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

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
      .where(eq(payments.userId, user.id))
      .orderBy(desc(payments.createdAt));

    return NextResponse.json({ payments: result });
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

    const [payment] = await db
      .insert(payments)
      .values({
        transactionId,
        userId: user.id,
        projectId: projectId || null,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        amountUSD: amount.toString(),
        amountHTG: amountHTG ? amountHTG.toString() : null,
        currency,
        method,
        status: "pending",
        paymentProof,
        paymentProofFilename: paymentProofFilename || null,
        receptionPlatform: receptionPlatform || null,
        receptionDetails: receptionDetails || null,
      })
      .returning();

    // Notify all admins
    const admins = await db
      .select()
      .from(users)
      .where(eq(users.role, "admin"));

    for (const admin of admins) {
      await db.insert(notifications).values({
        userId: admin.id,
        title: "Nouveau paiement reçu",
        message: `${firstName} ${lastName} a soumis un paiement de ${amount} ${currency === "HTG" ? `(${amountHTG} HTG)` : "USD"} via ${method}.`,
        type: "info",
        link: "/admin",
      });
    }

    // Notify client
    await db.insert(notifications).values({
      userId: user.id,
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
