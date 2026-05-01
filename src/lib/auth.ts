import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { db } from "@/db";
import { users, sessions } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const COOKIE_NAME = "golite_session";
const SESSION_DURATION_HOURS = 72;

export type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
};

export function getSessionCookieName(): string {
  return COOKIE_NAME;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  // Backward compatibility: some legacy users may still have plain-text passwords.
  // Keep login working, then accounts can be upgraded to bcrypt on successful login.
  if (!hash) return false;
  const isBcryptHash = /^\$2[aby]\$\d{2}\$/.test(hash);
  if (!isBcryptHash) {
    return password === hash;
  }
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string): Promise<string> {
  const token = uuidv4();
  const expiresAt = new Date(
    Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000
  );
  await db.insert(sessions).values({ user_id: userId, token, expires_at: expiresAt });
  return token;
}

/**
 * Extract session token from request.
 * Priority: x-session-token header > cookie
 */
async function extractToken(req?: NextRequest): Promise<string | null> {
  // 1. Header (sent by apiFetch)
  if (req) {
    const headerToken = req.headers.get("x-session-token");
    if (headerToken) return headerToken;
  }
  // 2. Cookie (set by server or by JavaScript)
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(COOKIE_NAME)?.value;
  if (cookieToken) return cookieToken;
  return null;
}

async function validateToken(token: string): Promise<AuthUser | null> {
  const now = new Date();
  const results = await db
    .select({
      id: users.id,
      firstName: users.first_name,
      lastName: users.last_name,
      email: users.email,
      role: users.role,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.user_id, users.id))
    .where(and(eq(sessions.token, token), gt(sessions.expires_at, now)))
    .limit(1);
  if (results.length === 0) return null;
  const r = results[0];
  return {
    id: r.id,
    firstName: r.firstName,
    lastName: r.lastName,
    email: r.email,
    role: r.role,
  };
}

export async function getSessionUser(req?: NextRequest): Promise<AuthUser | null> {
  const token = await extractToken(req);
  if (!token) return null;
  return validateToken(token);
}

export async function requireAuth(req?: NextRequest): Promise<AuthUser> {
  const user = await getSessionUser(req);
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function requireAdmin(req?: NextRequest): Promise<AuthUser> {
  const user = await requireAuth(req);
  if (user.role !== "admin") throw new Error("Forbidden");
  return user;
}

export async function deleteSession(token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.token, token));
}
