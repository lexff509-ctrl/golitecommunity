import { NextRequest, NextResponse } from "next/server";
import { deleteSession, getSessionCookieName } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Get token from header or cookie
    const headerToken = req.headers.get("x-session-token");
    const cookieToken = req.cookies.get(getSessionCookieName())?.value;
    const token = headerToken || cookieToken;

    if (token) {
      await deleteSession(token);
    }

    const response = NextResponse.json({ message: "Déconnexion réussie" });

    response.cookies.set(getSessionCookieName(), "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la déconnexion" },
      { status: 500 }
    );
  }
}
