import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

export const RECEPTION_SINGLE_KEY_PREFIX = "payment_reception:";
export const RECEPTION_LIST_KEY_PREFIX = "payment_receptions:";

export type ReceptionMethod = {
  id: string;
  platform: string;
  details: Record<string, string>;
  createdAt: string;
};

function parseSingleLegacyValue(value: string): ReceptionMethod[] {
  try {
    const parsed = JSON.parse(value) as {
      receptionPlatform?: string | null;
      receptionDetails?: Record<string, string> | null;
    };
    if (!parsed?.receptionPlatform) return [];
    return [
      {
        id: `legacy-${Date.now().toString(36)}`,
        platform: parsed.receptionPlatform,
        details: parsed.receptionDetails ?? {},
        createdAt: new Date().toISOString(),
      },
    ];
  } catch {
    return [];
  }
}

function parseListValue(value: string): ReceptionMethod[] {
  try {
    const parsed = JSON.parse(value) as ReceptionMethod[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => !!item?.platform && !!item?.createdAt);
  } catch {
    return [];
  }
}

function normalizeMethods(methods: ReceptionMethod[]): ReceptionMethod[] {
  const seen = new Set<string>();
  const deduped: ReceptionMethod[] = [];
  for (const method of methods) {
    const key = `${method.platform}:${JSON.stringify(method.details)}:${method.createdAt}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(method);
  }
  return deduped.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getReceptionMethodsMap(
  paymentIds: string[]
): Promise<Record<string, ReceptionMethod[]>> {
  if (paymentIds.length === 0) return {};

  const rows = await db
    .select({
      key: settings.key,
      value: settings.value,
    })
    .from(settings)
    .where(
      inArray(settings.key, [
        ...paymentIds.map((id) => `${RECEPTION_LIST_KEY_PREFIX}${id}`),
        ...paymentIds.map((id) => `${RECEPTION_SINGLE_KEY_PREFIX}${id}`),
      ])
    );

  const map: Record<string, ReceptionMethod[]> = {};
  for (const id of paymentIds) map[id] = [];

  for (const row of rows) {
    if (row.key.startsWith(RECEPTION_LIST_KEY_PREFIX)) {
      const paymentId = row.key.replace(RECEPTION_LIST_KEY_PREFIX, "");
      map[paymentId] = [...(map[paymentId] ?? []), ...parseListValue(row.value)];
    } else if (row.key.startsWith(RECEPTION_SINGLE_KEY_PREFIX)) {
      const paymentId = row.key.replace(RECEPTION_SINGLE_KEY_PREFIX, "");
      map[paymentId] = [...(map[paymentId] ?? []), ...parseSingleLegacyValue(row.value)];
    }
  }

  for (const id of paymentIds) {
    map[id] = normalizeMethods(map[id] ?? []);
  }
  return map;
}

export async function appendReceptionMethod(
  paymentId: string,
  platform: string,
  details: Record<string, string>
): Promise<ReceptionMethod[]> {
  const listKey = `${RECEPTION_LIST_KEY_PREFIX}${paymentId}`;
  const legacyKey = `${RECEPTION_SINGLE_KEY_PREFIX}${paymentId}`;

  const existing = await db
    .select({
      key: settings.key,
      value: settings.value,
    })
    .from(settings)
    .where(inArray(settings.key, [listKey, legacyKey]));

  const existingMethods = normalizeMethods(
    existing.flatMap((row) =>
      row.key === listKey ? parseListValue(row.value) : parseSingleLegacyValue(row.value)
    )
  );

  const newMethod: ReceptionMethod = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    platform,
    details,
    createdAt: new Date().toISOString(),
  };

  const updatedMethods = normalizeMethods([newMethod, ...existingMethods]);

  await db
    .insert(settings)
    .values({
      key: listKey,
      value: JSON.stringify(updatedMethods),
    })
    .onConflictDoUpdate({
      target: settings.key,
      set: {
        value: JSON.stringify(updatedMethods),
      },
    });

  // Keep latest method in legacy key for backward compatibility.
  await db
    .insert(settings)
    .values({
      key: legacyKey,
      value: JSON.stringify({
        receptionPlatform: newMethod.platform,
        receptionDetails: newMethod.details,
      }),
    })
    .onConflictDoUpdate({
      target: settings.key,
      set: {
        value: JSON.stringify({
          receptionPlatform: newMethod.platform,
          receptionDetails: newMethod.details,
        }),
      },
    });

  return updatedMethods;
}

export async function getReceptionMethodsForPayment(
  paymentId: string
): Promise<ReceptionMethod[]> {
  const map = await getReceptionMethodsMap([paymentId]);
  return map[paymentId] ?? [];
}

export async function getLatestReceptionMethod(paymentId: string): Promise<ReceptionMethod | null> {
  const all = await getReceptionMethodsForPayment(paymentId);
  return all[0] ?? null;
}
