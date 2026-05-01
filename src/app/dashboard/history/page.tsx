"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { apiFetch } from "@/lib/api-client";

type Payment = {
  id: string;
  transactionId: string;
  firstName: string;
  lastName: string;
  amountUSD: string;
  amountHTG: string | null;
  currency: string;
  method: string;
  status: string;
  paymentProof: string | null;
  receptionPlatform: string | null;
  rejectionReason: string | null;
  createdAt: string;
  validatedAt: string | null;
  paidAt: string | null;
  rejectedAt: string | null;
};

const STATUS_MAP: Record<
  string,
  { label: string; cls: string; icon: string }
> = {
  pending: {
    label: "En attente",
    cls: "bg-amber-100 text-amber-700 border-amber-200",
    icon: "⏳",
  },
  validated: {
    label: "Validé",
    cls: "bg-blue-100 text-blue-700 border-blue-200",
    icon: "✔️",
  },
  paid: {
    label: "Payé",
    cls: "bg-green-100 text-green-700 border-green-200",
    icon: "💰",
  },
  rejected: {
    label: "Rejeté",
    cls: "bg-red-100 text-red-700 border-red-200",
    icon: "❌",
  },
};

const formatSafeDate = (value: unknown, withTime = false): string => {
  if (!value) return "—";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "—";
  return withTime ? date.toLocaleString("fr-FR") : date.toLocaleDateString("fr-FR");
};

export default function HistoryPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const filtered =
    filter === "all"
      ? payments
      : payments.filter((p) => p.status === filter);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          📋 Historique des paiements
        </h1>
        <p className="text-slate-500 mt-1">
          Suivez l&apos;état de toutes vos transactions
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "all", label: "Tous" },
          { key: "pending", label: "En attente" },
          { key: "validated", label: "Validés" },
          { key: "paid", label: "Payés" },
          { key: "rejected", label: "Rejetés" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === f.key
                ? "bg-green-500 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-slate-500">
            {filter === "all"
              ? "Aucun paiement pour le moment"
              : "Aucun paiement avec ce statut"}
          </p>
        </div>
      ) : (
        <div className="space-y-4 stagger-children">
          {filtered.map((p) => {
            const s = STATUS_MAP[p.status] || STATUS_MAP.pending;
            const expanded = expandedId === p.id;
            return (
              <div
                key={p.id}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden card-hover"
              >
                <button
                  onClick={() =>
                    setExpandedId(expanded ? null : p.id)
                  }
                  className="w-full px-6 py-4 flex items-center gap-4 text-left"
                >
                  <span className="text-lg">{s.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-bold text-slate-900">
                        {p.transactionId}
                      </span>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${s.cls}`}
                      >
                        {s.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                      <span>{p.method}</span>
                      <span>•</span>
                      <span className="font-semibold text-slate-700">
                        {p.amountUSD} USD
                      </span>
                      {p.amountHTG && (
                        <>
                          <span>•</span>
                          <span>{p.amountHTG} HTG</span>
                        </>
                      )}
                      <span>•</span>
                      <span>
                        {formatSafeDate(p.createdAt)}
                      </span>
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {expanded && (
                  <div className="px-6 pb-6 border-t border-slate-100 pt-4 animate-fade-in">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-slate-400">Nom</p>
                        <p className="font-medium text-slate-900">
                          {p.firstName} {p.lastName}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400">Montant USD</p>
                        <p className="font-medium text-slate-900">
                          {p.amountUSD} USD
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400">Montant HTG</p>
                        <p className="font-medium text-slate-900">
                          {p.amountHTG
                            ? `${p.amountHTG} HTG`
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400">Méthode</p>
                        <p className="font-medium text-slate-900">
                          {p.method}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400">Plateforme réception</p>
                        <p className="font-medium text-slate-900">
                          {p.receptionPlatform || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400">Créé le</p>
                        <p className="font-medium text-slate-900">
                          {formatSafeDate(p.createdAt, true)}
                        </p>
                      </div>
                    </div>

                    {p.paymentProof && (
                      <div className="mt-4">
                        <p className="text-slate-400 text-sm mb-2">
                          Preuve de paiement
                        </p>
                        <div className="relative w-full max-w-md h-48 rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                          <Image
                            src={p.paymentProof}
                            alt="Preuve"
                            fill
                            className="object-contain"
                            sizes="(max-width: 768px) 100vw, 448px"
                            unoptimized
                          />
                        </div>
                      </div>
                    )}

                    {p.status === "validated" && p.validatedAt && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
                        ✅ Validé le{" "}
                        {formatSafeDate(p.validatedAt, true)}
                      </div>
                    )}

                    {p.status === "paid" && p.paidAt && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
                        💰 Payé le{" "}
                        {formatSafeDate(p.paidAt, true)}
                      </div>
                    )}

                    {p.status === "rejected" && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                        ❌ Rejeté
                        {p.rejectionReason && (
                          <span className="block mt-1">
                            Raison : {p.rejectionReason}
                          </span>
                        )}
                        {p.rejectedAt && (
                          <span className="block text-xs text-red-500 mt-1">
                            Le{" "}
                            {formatSafeDate(p.rejectedAt, true)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
