"use client";

import { useState } from "react";
import Link from "next/link";
import { saveAuth } from "@/lib/api-client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Use plain fetch to avoid any wrapper issues
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "same-origin",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur de connexion");
        setLoading(false);
        return;
      }

      if (!data.token || !data.user) {
        setError("Réponse du serveur invalide");
        setLoading(false);
        return;
      }

      // Save to localStorage AND set cookie
      saveAuth(data.token, data.user);

      // Small delay to ensure cookie is written before navigation
      await new Promise((r) => setTimeout(r, 200));

      // Force full page reload to the correct dashboard
      const target =
        data.user.role === "admin" ? "/admin" : "/dashboard";
      window.location.href = target;
    } catch (err) {
      console.error("Login error:", err);
      setError("Erreur de connexion au serveur");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-blue-50 to-white -z-10" />
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center">
              <span className="text-white font-bold">GL</span>
            </div>
            <span className="font-bold text-2xl text-slate-800">GoLite</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Connexion</h1>
          <p className="text-slate-500 mt-2">
            Accédez à votre tableau de bord
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm animate-scale-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Adresse email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors text-sm"
                placeholder="votre@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Mot de passe
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors text-sm"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-sm font-semibold text-white bg-gradient-to-r from-green-500 to-blue-600 rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Connexion...
                </span>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Pas encore de compte ?{" "}
              <Link
                href="/register"
                className="font-semibold text-green-600 hover:text-green-700"
              >
                S&apos;inscrire
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
