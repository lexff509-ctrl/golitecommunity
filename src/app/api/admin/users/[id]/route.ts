import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, investments, payments, cryptoTransactions } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET /api/admin/users/:id - Get user details with their activities
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(req);
    const { id: userId } = await params;

    if (!userId) {
      return NextResponse.json({ error: "ID utilisateur requis" }, { status: 400 });
    }

    // Get user
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    // Get user's investments
    const userInvestments = await db
      .select({
        id: investments.id,
        amount: investments.amount,
        gain: investments.gain,
        status: investments.status,
        createdAt: investments.created_at,
      })
      .from(investments)
      .where(eq(investments.user_id, userId));

    // Get user's payments
    const userPayments = await db
      .select({
        id: payments.id,
        amount: payments.amount,
        method: payments.method,
        status: payments.status,
        type: payments.type,
        createdAt: payments.created_at,
      })
      .from(payments)
      .where(eq(payments.user_id, userId));

    // Get user's crypto transactions
    const userCrypto = await db
      .select({
        id: cryptoTransactions.id,
        amountHtg: cryptoTransactions.amount_htg,
        amountUsd: cryptoTransactions.amount_usd,
        cryptoType: cryptoTransactions.crypto_type,
        status: cryptoTransactions.status,
        createdAt: cryptoTransactions.created_at,
      })
      .from(cryptoTransactions)
      .where(eq(cryptoTransactions.user_id, userId));

    // Calculate totals
    const totalInvested = userInvestments
      .filter(i => i.status === "validated")
      .reduce((sum, i) => sum + Number(i.amount), 0);
    
    const totalGains = userInvestments
      .filter(i => i.status === "validated")
      .reduce((sum, i) => sum + Number(i.gain), 0);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
      },
      investments: userInvestments,
      payments: userPayments,
      crypto: userCrypto,
      totals: {
        totalInvested,
        totalGains,
        investmentCount: userInvestments.length,
        paymentCount: userPayments.length,
        cryptoCount: userCrypto.length,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: message === "Unauthorized" ? 401 : 403 }
      );
    }
    console.error("Admin user details error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}