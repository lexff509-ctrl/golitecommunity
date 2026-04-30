"use client";

import { useState } from "react";
import Link from "next/link";
import { getStoredUser } from "@/lib/api-client";
import { usePublicConfig } from "@/lib/use-public-config";
import Countdown from "@/components/Countdown";

export default function HomePage() {
  const [checking, setChecking] = useState(false);
  const { data } = usePublicConfig();

  const handleGoToDashboard = () => {
    setChecking(true);
    const stored = getStoredUser();
    if (stored) {
      if (stored.role === "admin") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/dashboard";
      }
    } else {
      window.location.href = "/login";
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">GL</span>
              </div>
              <span className="font-bold text-xl text-slate-800">
                GoLite
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Connexion
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-blue-600 rounded-lg hover:opacity-90 transition-opacity"
              >
                S&apos;inscrire
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-blue-50 to-white" />
          <div className="absolute top-20 left-10 w-72 h-72 bg-green-200/30 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
            <div className="text-center max-w-4xl mx-auto animate-fade-in">
              <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm font-medium px-4 py-1.5 rounded-full mb-8">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse-soft" />
                Plateforme sécurisée et fiable
              </div>

              <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
                Investissez avec{" "}
                <span className="gradient-text">confiance</span>
                <br />
                dans votre communauté
              </h1>

              <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto mb-10">
                GoLite Community Support vous offre une plateforme moderne,
                transparente et sécurisée pour gérer vos investissements et
                paiements en toute sérénité.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={handleGoToDashboard}
                  disabled={checking}
                  className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-green-500 to-blue-600 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-green-200 disabled:opacity-50"
                >
                  {checking
                    ? "Chargement..."
                    : "Accéder au tableau de bord"}
                </button>
                <Link
                  href="/register"
                  className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Créer un compte
                </Link>
              </div>

              {/* Countdown */}
              {data?.countdown && (
                <div className="mt-12 max-w-2xl mx-auto animate-fade-in">
                  <Countdown
                    targetDate={data.countdown.targetDate}
                    title={data.countdown.title}
                    message={data.countdown.message}
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Active Projects */}
        {data?.projects && data.projects.length > 0 && (
          <section className="py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">
                  📁 Projets en cours
                </h2>
                <p className="text-slate-500 max-w-xl mx-auto">
                  Découvrez nos projets et participez activement
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children max-w-5xl mx-auto">
                {data.projects.map((p) => {
                 const collected = Number(p.collectedAmount ?? 0);
                 const target = Number(p.targetAmount ?? 0);
                 const remaining = Math.max(0, target - collected);
                 const pct =
                 target > 0
                 ? Math.min(100, (collected / target) * 100)
                 : 0;
                  return (
                    <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-6 card-hover">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">🎯</span>
                        <h3 className="font-bold text-slate-900">{p.name}</h3>
                      </div>
                      {p.description && (
                        <p className="text-sm text-slate-500 mb-4 line-clamp-3">{p.description}</p>
                      )}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-semibold text-green-600">${collected.toLocaleString()}</span>
                          <span className="text-slate-500">${target.toLocaleString()}</span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="flex justify-between text-xs text-slate-400 mt-1">
                          <span>{pct.toFixed(1)}%</span>
                          <span>Reste: ${remaining.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="text-xs text-slate-400">
                        📅 {new Date(p.startDate).toLocaleDateString("fr-FR")} → {new Date(p.endDate).toLocaleDateString("fr-FR")}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Features */}
        <section className="py-20 bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Pourquoi choisir GoLite ?
              </h2>
              <p className="text-slate-500 max-w-xl mx-auto">
                Une solution complète pensée pour votre tranquillité
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 stagger-children">
              {[
                {
                  icon: "🔒",
                  title: "Sécurité maximale",
                  desc: "Authentification sécurisée, données chiffrées et protection complète de vos informations.",
                },
                {
                  icon: "⚡",
                  title: "Traitement rapide",
                  desc: "Suivi en temps réel de vos paiements avec un tableau de bord intuitif et clair.",
                },
                {
                  icon: "🌍",
                  title: "Multi-devises",
                  desc: "Conversion automatique USD → HTG et support de multiples méthodes de paiement.",
                },
                {
                  icon: "📊",
                  title: "Transparence totale",
                  desc: "Historique complet, notifications en direct et traçabilité de chaque transaction.",
                },
                {
                  icon: "💳",
                  title: "Plusieurs méthodes",
                  desc: "MonCash, NatCash, Binance, Crypto, Zelle — choisissez celle qui vous convient.",
                },
                {
                  icon: "🎯",
                  title: "Interface moderne",
                  desc: "Design professionnel et responsive, utilisable sur mobile, tablette et desktop.",
                },
              ].map((f, i) => (
                <div
                  key={i}
                  className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl p-8 card-hover"
                >
                  <div className="text-4xl mb-4">{f.icon}</div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {f.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="bg-gradient-to-br from-green-500 to-blue-600 rounded-3xl p-12 sm:p-16 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
              <div className="relative">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                  Prêt à commencer ?
                </h2>
                <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
                  Rejoignez la communauté GoLite et accédez à une expérience
                  d&apos;investissement modernisée.
                </p>
                <Link
                  href="/register"
                  className="inline-block px-8 py-3.5 text-base font-semibold text-green-600 bg-white rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Créer mon compte gratuit
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-400 text-sm">
            © {new Date().getFullYear()} GoLite Community Support. Tous droits
            réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}
