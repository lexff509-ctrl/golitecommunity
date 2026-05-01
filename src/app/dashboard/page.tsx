"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { usePublicConfig } from "@/lib/use-public-config";
import Countdown from "@/components/Countdown";

type Payment = {
  id: string;
  transactionId: string;
  amountUSD: string;
  amountHTG: string | null;
  currency: string;
  method: string;
  status: string;
  createdAt: string;
};

const toSafeNumber = (value: unknown): number => {
  const num = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
};

const formatSafeDate = (value: unknown): string => {
  if (!value) return "";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("fr-FR");
};

export default function DashboardPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: config } = usePublicConfig();

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await apiFetch("/api/payments");
        const data = await res.json();
        setPayments(data.payments || []);
      } catch {
        // silent
      }
      setLoading(false);
    };
    fetchPayments();
  }, []);

  const stats = {
    total: payments.length,
    pending: payments.filter((p) => p.status === "pending").length,
    validated: payments.filter((p) => p.status === "validated").length,
    paid: payments.filter((p) => p.status === "paid").length,
    rejected: payments.filter((p) => p.status === "rejected").length,
  };

  const STATUS_MAP: Record<string, { label: string; cls: string }> = {
    pending: { label: "En attente", cls: "bg-amber-100 text-amber-700 border-amber-200" },
    validated: { label: "Validé", cls: "bg-blue-100 text-blue-700 border-blue-200" },
    paid: { label: "Payé", cls: "bg-green-100 text-green-700 border-green-200" },
    rejected: { label: "Rejeté", cls: "bg-red-100 text-red-700 border-red-200" },
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Bonjour! 👋
        </h1>
        <p className="text-slate-500 mt-1">
          Voici un aperçu de vos investissements
        </p>
      </div>

      {/* Countdown */}
      {config?.countdown && (
        <Countdown
          targetDate={config.countdown.targetDate}
          title={config.countdown.title}
          message={config.countdown.message}
          compact
        />
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 stagger-children">
        {[
          { href: "/dashboard/onboarding", label: "🚀 Start Here", desc: "Onboarding" },
          { href: config?.config?.pocket_option_link || "#", label: "📈 Pocket Option", desc: "Trading", external: true },
          { href: "/dashboard/payment", label: "💰 Paiement", desc: "Envoyer" },
          { href: "/dashboard/crypto", label: "🪙 Crypto", desc: "Achat/Vente" },
          { href: "/dashboard/faq", label: "❓ FAQ", desc: "Aide" },
        ].map((link, i) =>
          link.external ? (
            <a
              key={i}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white border border-slate-200 rounded-2xl p-4 card-hover text-center"
            >
              <div className="text-xl mb-1">{link.label.split(" ")[0]}</div>
              <p className="text-sm font-semibold text-slate-900">{link.label.split(" ").slice(1).join(" ")}</p>
              <p className="text-xs text-slate-500">{link.desc}</p>
            </a>
          ) : (
            <Link
              key={i}
              href={link.href}
              className="bg-white border border-slate-200 rounded-2xl p-4 card-hover text-center"
            >
              <div className="text-xl mb-1">{link.label.split(" ")[0]}</div>
              <p className="text-sm font-semibold text-slate-900">{link.label.split(" ").slice(1).join(" ")}</p>
              <p className="text-xs text-slate-500">{link.desc}</p>
            </Link>
          )
        )}
      </div>

      {/* Active Projects */}
      {config?.projects && config.projects.length > 0 && (
        <div>
          <h2 className="font-bold text-slate-900 mb-4">📁 Projets actifs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
            {config.projects.map((p) => {
              const collected = toSafeNumber(p.collectedAmount);
              const target = toSafeNumber(p.targetAmount);
              const remaining = Math.max(0, target - collected);
              const pct = target > 0 ? Math.min(100, (collected / target) * 100) : 0;
              return (
                <div key={p.id} className="bg-white border border-green-200 rounded-2xl p-5 card-hover">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🎯</span>
                    <h3 className="font-bold text-slate-900">{p.name}</h3>
                    {p.status === "active" && <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">Actif</span>}
                  </div>
                  {p.description && <p className="text-sm text-slate-500 mb-3 line-clamp-2">{p.description}</p>}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-semibold text-green-600">${collected.toLocaleString()}</span>
                      <span className="text-slate-500">${target.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{pct.toFixed(1)}% — Reste: ${remaining.toLocaleString()}</p>
                  </div>
                  <Link href="/dashboard/payment" className="inline-flex items-center gap-1 text-sm font-semibold text-green-600 hover:text-green-700">
                    Investir →
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 stagger-children">
        {[
          {
            label: "Total paiements",
            value: stats.total,
            icon: "📊",
            color: "from-slate-50 to-slate-100",
          },
          {
            label: "En attente",
            value: stats.pending,
            icon: "⏳",
            color: "from-amber-50 to-amber-100",
          },
          {
            label: "Validés",
            value: stats.validated,
            icon: "✔️",
            color: "from-blue-50 to-blue-100",
          },
          {
            label: "Payés",
            value: stats.paid,
            icon: "💰",
            color: "from-green-50 to-green-100",
          },
          {
            label: "Rejetés",
            value: stats.rejected,
            icon: "❌",
            color: "from-red-50 to-red-100",
          },
        ].map((s, i) => (
          <div
            key={i}
            className={`bg-gradient-to-br ${s.color} border border-slate-200 rounded-2xl p-5 card-hover`}
          >
            <div className="text-2xl mb-2">{s.icon}</div>
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-sm text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
        <Link
          href="/dashboard/crypto"
          className="bg-white border border-slate-200 rounded-2xl p-6 card-hover group"
        >
          <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">
            📖
          </div>
          <h3 className="font-bold text-slate-900 mb-1">Comment investir</h3>
          <p className="text-sm text-slate-500">
            Découvrez les étapes pour commencer
          </p>
        </Link>

        <Link
          href="/dashboard/payment"
          className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-2xl p-6 card-hover group"
        >
          <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">
            💰
          </div>
          <h3 className="font-bold text-slate-900 mb-1">
            Nouveau paiement
          </h3>
          <p className="text-sm text-slate-500">
            Soumettre un nouveau paiement
          </p>
        </Link>

        <Link
          href="/dashboard/history"
          className="bg-white border border-slate-200 rounded-2xl p-6 card-hover group"
        >
          <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">
            📋
          </div>
          <h3 className="font-bold text-slate-900 mb-1">
            Historique
          </h3>
          <p className="text-sm text-slate-500">
            Consultez vos transactions
          </p>
        </Link>
      </div>

      {/* Recent Payments */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">
            Derniers paiements
          </h2>
          <Link
            href="/dashboard/history"
            className="text-sm text-green-600 hover:text-green-700 font-medium"
          >
            Tout voir →
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-slate-500">
              Aucun paiement pour le moment
            </p>
            <Link
              href="/dashboard/payment"
              className="inline-block mt-4 px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-green-500 to-blue-600 rounded-xl hover:opacity-90"
            >
              Faire un paiement
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-slate-500 uppercase bg-slate-50">
                  <th className="px-6 py-3">Transaction</th>
                  <th className="px-6 py-3">Montant</th>
                  <th className="px-6 py-3">Méthode</th>
                  <th className="px-6 py-3">Statut</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.slice(0, 5).map((p) => {
                  const s = STATUS_MAP[p.status] || STATUS_MAP.pending;
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-medium text-slate-900">
                          {p.transactionId}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-900">
                          {p.amountUSD} USD
                        </span>
                        {p.amountHTG && (
                          <span className="block text-xs text-slate-500">
                            ({p.amountHTG} HTG)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">
                          {p.method}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${s.cls}`}
                        >
                          {s.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-500">
                          {formatSafeDate(p.createdAt) || "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
