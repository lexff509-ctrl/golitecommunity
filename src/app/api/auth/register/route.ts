import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, createSession, getSessionCookieName } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, password } = body;

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: "Tous les champs sont obligatoires" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 6 caractères" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Adresse email invalide" },
        { status: 400 }
      );
    }

    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    // Some legacy DBs also have a NOT NULL `users.password` column (plain-text era).
    // To avoid breaking existing production DBs, we insert both `password_hash` and `password`.
    // `password` is set to the bcrypt hash as a safe fallback (login uses password_hash).
    const emailNorm = email.toLowerCase().trim();
    const firstNorm = firstName.trim();
    const lastNorm = lastName.trim();

    const inserted = await db.execute<{
      id: string;
    }>(sql`
      insert into "users" ("first_name", "last_name", "email", "password_hash", "password", "role")
      values (${firstNorm}, ${lastNorm}, ${emailNorm}, ${hashedPassword}, ${hashedPassword}, 'client')
      returning "id"
    `);

    const newUserId = (inserted.rows?.[0] as { id?: string } | undefined)?.id;
    if (!newUserId) {
      return NextResponse.json(
        { error: "Erreur serveur lors de l'inscription" },
        { status: 500 }
      );
    }

    const token = await createSession(newUserId);
    const SESSION_MAX_AGE = 72 * 60 * 60;

    const response = NextResponse.json(
      {
        message: "Inscription réussie",
        token,
        user: {
          id: newUserId,
          firstName: firstNorm,
          lastName: lastNorm,
          email: emailNorm,
          role: "client",
        },
      },
      { status: 201 }
    );

    response.cookies.set(getSessionCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de l'inscription" },
      { status: 500 }
    );
  }
}
