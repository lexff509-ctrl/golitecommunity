import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { cryptoTransactions } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";
import {
  CRYPTO_BUY_RATE,
  CRYPTO_SELL_RATE,
  getCryptoMetaMap,
  saveCryptoMeta,
} from "@/lib/crypto-meta";

export const dynamic = "force-dynamic";

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

    const metaMap = await getCryptoMetaMap(userCrypto.map((c) => c.id));

    return NextResponse.json(
      userCrypto.map((txn) => ({
        ...txn,
        amountHtg: String(txn.amountHtg ?? "0"),
        amountUsd: String(txn.amountUsd ?? "0"),
        mode: metaMap[txn.id]?.mode ?? "buy",
        paymentMethod: metaMap[txn.id]?.paymentMethod ?? null,
        paymentProof: metaMap[txn.id]?.paymentProof ?? null,
        receptionPlatform: metaMap[txn.id]?.receptionPlatform ?? null,
        receptionDetails: metaMap[txn.id]?.receptionDetails ?? null,
        rate: metaMap[txn.id]?.rate ?? CRYPTO_BUY_RATE,
      }))
    );
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
    const {
      mode,
      amountUsd,
      cryptoType,
      network,
      walletAddress,
      paymentMethod,
      paymentProof,
      receptionPlatform,
      receptionDetails,
    } = body;
    const normalizedMode = mode === "sell" ? "sell" : "buy";

    // Validate required fields
    if (!amountUsd || !cryptoType || !network) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants" },
        { status: 400 }
      );
    }
    if (normalizedMode === "buy" && (!walletAddress || !paymentMethod || !paymentProof)) {
      return NextResponse.json(
        {
          error:
            "Pour achat crypto: wallet, méthode de paiement et preuve sont obligatoires",
        },
        { status: 400 }
      );
    }
    if (normalizedMode === "sell" && (!receptionPlatform || !paymentProof || !walletAddress)) {
      return NextResponse.json(
        {
          error:
            "Pour vente crypto: wallet de destination, preuve de transaction et méthode de réception sont obligatoires",
        },
        { status: 400 }
      );
    }

    const amountUsdNum = Number(amountUsd);
    if (isNaN(amountUsdNum) || amountUsdNum <= 0) {
      return NextResponse.json(
        { error: "Montant USD invalide" },
        { status: 400 }
      );
    }

    const rate = normalizedMode === "buy" ? CRYPTO_BUY_RATE : CRYPTO_SELL_RATE;
    const sellFeeFixedUsd = receptionPlatform === "Meru" ? 5 : 0;
    const sellFeePct = 0.02;

    const amountHtgNum =
      normalizedMode === "buy"
        ? amountUsdNum * CRYPTO_BUY_RATE
        : (() => {
            const afterFixed = Math.max(0, amountUsdNum - sellFeeFixedUsd);
            const netUsd = Math.max(0, afterFixed - afterFixed * sellFeePct);
            if (receptionPlatform === "Zelle") return 0;
            return netUsd * CRYPTO_SELL_RATE;
          })();

    // Validate crypto type and network
    const validCryptoTypes = ["USDT", "BTC", "TRX", "BNB"];
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
      amount_usd: amountUsdNum.toString(),
      crypto_type: cryptoType,
      network: network,
      wallet_address:
        walletAddress,
      status: "pending",
    }).returning();

    await saveCryptoMeta(newCrypto[0].id, {
      mode: normalizedMode,
      paymentMethod: paymentMethod || null,
      paymentProof: paymentProof || null,
      receptionPlatform: receptionPlatform || null,
      receptionDetails: (receptionDetails || null) as Record<string, string> | null,
      rate,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      cryptoTransaction: {
        ...newCrypto[0],
        mode: normalizedMode,
        paymentMethod: paymentMethod || null,
        paymentProof: paymentProof || null,
        receptionPlatform: receptionPlatform || null,
        receptionDetails: receptionDetails || null,
        rate,
      },
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