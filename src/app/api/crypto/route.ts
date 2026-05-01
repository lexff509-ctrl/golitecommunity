import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { cryptoTransactions } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const EXCHANGE_RATE = 150; // 1 USD = 150 HTG

// GET /api/crypto - List user's crypto transactions
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userCrypto = await db
      .select({
        id: cryptoTransactions.id,
        amountHtg: cryptoTransactions.amount_htg,
        amountUsd: cryptoTransactions.amount_usd,
        cryptoType: cryptoTransactions.crypto_type,
        network: cryptoTransactions.network,
        walletAddress: cryptoTransactions.wallet_address,
        status: cryptoTransactions.status,
        createdAt: cryptoTransactions.created_at,
      })
      .from(cryptoTransactions)
      .where(eq(cryptoTransactions.user_id, session.id))
      .orderBy(desc(cryptoTransactions.created_at));

    return NextResponse.json(userCrypto);
  } catch (error) {
    console.error("Error fetching crypto transactions:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des transactions crypto" },
      { status: 500 }
    );
  }
}

// POST /api/crypto - Create new crypto transaction
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { amountHtg, cryptoType, network, walletAddress } = body;

    // Validate required fields
    if (!amountHtg || !cryptoType || !network || !walletAddress) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants" },
        { status: 400 }
      );
    }

    const amountHtgNum = Number(amountHtg);
    if (isNaN(amountHtgNum) || amountHtgNum <= 0) {
      return NextResponse.json(
        { error: "Montant HTG invalide" },
        { status: 400 }
      );
    }

    // Convert HTG to USD
    const amountUsd = amountHtgNum / EXCHANGE_RATE;

    // Validate crypto type and network
    const validCryptoTypes = ["USDT", "USDC"];
    const validNetworks = ["TRC20", "ERC20", "BEP20"];

    if (!validCryptoTypes.includes(cryptoType)) {
      return NextResponse.json(
        { error: "Type de crypto invalide" },
        { status: 400 }
      );
    }

    if (!validNetworks.includes(network)) {
      return NextResponse.json(
        { error: "Réseau invalide" },
        { status: 400 }
      );
    }

        // Create crypto transaction
    const newCrypto = await db.insert(cryptoTransactions).values({
      user_id: session.id,
      amount_htg: amountHtgNum.toString(),
      amount_usd: amountUsd.toString(),
      crypto_type: cryptoType,
      network: network,
      wallet_address: walletAddress,
      status: "pending",
    }).returning();

    return NextResponse.json({
      cryptoTransaction: newCrypto[0],
      message: "Transaction crypto créée avec succès"
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating crypto transaction:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la transaction crypto" },
      { status: 500 }
    );
  }
}