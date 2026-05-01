import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

export const CRYPTO_META_KEY_PREFIX = "crypto_meta:";
export const CRYPTO_BUY_RATE = 150;
export const CRYPTO_SELL_RATE = 136;

export type CryptoMeta = {
  mode: "buy" | "sell";
  paymentMethod: string | null;
  paymentProof: string | null;
  receptionPlatform: string | null;
  receptionDetails: Record<string, string> | null;
  rate: number;
  createdAt: string;
};

export async function saveCryptoMeta(
  cryptoId: string,
  meta: CryptoMeta
): Promise<void> {
  const key = `${CRYPTO_META_KEY_PREFIX}${cryptoId}`;
  await db
    .insert(settings)
    .values({
      key,
      value: JSON.stringify(meta),
    })
    .onConflictDoUpdate({
      target: settings.key,
      set: {
        value: JSON.stringify(meta),
      },
    });
}

export async function getCryptoMetaMap(
  cryptoIds: string[]
): Promise<Record<string, CryptoMeta | null>> {
  if (cryptoIds.length === 0) return {};
  const rows = await db
    .select({
      key: settings.key,
      value: settings.value,
    })
    .from(settings)
    .where(
      inArray(
        settings.key,
        cryptoIds.map((id) => `${CRYPTO_META_KEY_PREFIX}${id}`)
      )
    );

  const map: Record<string, CryptoMeta | null> = {};
  for (const id of cryptoIds) map[id] = null;

  for (const row of rows) {
    const id = row.key.replace(CRYPTO_META_KEY_PREFIX, "");
    try {
      map[id] = JSON.parse(row.value) as CryptoMeta;
    } catch {
      map[id] = null;
    }
  }

  return map;
}

export async function getCryptoMeta(cryptoId: string): Promise<CryptoMeta | null> {
  const key = `${CRYPTO_META_KEY_PREFIX}${cryptoId}`;
  const rows = await db
    .select({ value: settings.value })
    .from(settings)
    .where(eq(settings.key, key))
    .limit(1);
  if (rows.length === 0) return null;
  try {
    return JSON.parse(rows[0].value) as CryptoMeta;
  } catch {
    return null;
  }
}
