"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";

type Payment = {
  id: string;
  transactionId: string;
  userId: string;
  firstName: string;
  lastName: string;
  amountUSD: string;
  amountHTG: string | null;
  currency: string;
  method: string;
  status: string;
  receptionPlatform: string | null;
  userEmail: string;
  createdAt: string;
};

type Stats = {
  total: number;
  pending: number;
  validated: number;
  paid: number;
  rejected: number;
  totalAmount: number;
};

type AdminUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: string;
};

type CryptoLog = {
  id: string;
  userId: string;
  userEmail: string;
  amountHtg: string;
  amountUsd: string;
  cryptoType: string;
  network: string;
  status: string;
  createdAt: string;
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

export default function AdminDashboardPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [cryptoLogs, setCryptoLogs] = useState<CryptoLog[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    validated: 0,
    paid: 0,
    rejected: 0,
    totalAmount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchPayments = async () => {
    try {
      const [paymentsRes, usersRes, cryptoRes] = await Promise.all([
        apiFetch("/api/admin/payments?status=all"),
        apiFetch("/api/admin/users?page=1"),
        apiFetch("/api/admin/crypto?page=1"),
      ]);
      const [paymentsData, usersData, cryptoData] = await Promise.all([
        paymentsRes.json(),
        usersRes.json(),
        cryptoRes.json(),
      ]);
      setPayments(paymentsData.payments || []);
      setUsers(usersData.users || []);
      setCryptoLogs(cryptoData.cryptoTransactions || []);
      if (paymentsData.stats) setStats(paymentsData.stats);
    } catch {
      // silent
    }
    setLoading(false);
  };

  useEffect(() => {
    queueMicrotask(() => {
      void fetchPayments();
    });
  }, []);

  const handleAction = async (
    id: string,
    action: string,
    reason?: string
  ) => {
    setActionLoading(id);
    try {
      const res = await apiFetch(`/api/admin/payments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          rejectionReason: reason || undefined,
        }),
      });
      if (res.ok) {
        fetchPayments();
      } else {
        const data = await res.json();
        alert(data.error || "Erreur lors de l'action");
      }
    } catch {
      alert("Erreur de connexion");
    }
    setActionLoading(null);
    setRejectModal(null);
    setRejectReason("");
  };

  // Only show active (pending + validated) transactions
  const activePayments = payments.filter(
    (p) => p.status === "pending" || p.status === "validated"
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          📊 Tableau de bord Admin
        </h1>
        <p className="text-slate-500 mt-1">
          Vue d&apos;ensemble des transactions
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">
              👥 Utilisateurs récents
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-slate-500 uppercase bg-slate-50">
                  <th className="px-6 py-3">Nom</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Rôle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.slice(0, 8).map((u) => (
                  <tr key={u.id}>
                    <td className="px-6 py-3 text-sm text-slate-900">
                      {u.firstName} {u.lastName}
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600">{u.email}</td>
                    <td className="px-6 py-3 text-sm">
                      <span className="inline-flex px-2 py-0.5 rounded-full border text-xs bg-slate-100 text-slate-700 border-slate-200">
                        {u.role}
                      </span>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-slate-400">
                      Aucun utilisateur trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">
              🧾 Logs crypto
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-slate-500 uppercase bg-slate-50">
                  <th className="px-6 py-3">Utilisateur</th>
                  <th className="px-6 py-3">Montant</th>
                  <th className="px-6 py-3">Crypto</th>
                  <th className="px-6 py-3">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cryptoLogs.slice(0, 8).map((c) => (
                  <tr key={c.id}>
                    <td className="px-6 py-3 text-sm text-slate-600">{c.userEmail}</td>
                    <td className="px-6 py-3 text-sm text-slate-900">
                      {c.amountUsd} USD
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600">
                      {c.cryptoType} ({c.network})
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <span className="inline-flex px-2 py-0.5 rounded-full border text-xs bg-slate-100 text-slate-700 border-slate-200">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {cryptoLogs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                      Aucun log crypto
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 stagger-children">
        {[
          {
            label: "Total",
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
          {
            label: "Total USD",
            value: `$${Number(stats.totalAmount || 0).toLocaleString()}`,
            icon: "💵",
            color: "from-green-50 to-blue-50",
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

      {/* Active Transactions */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">
            🔥 Transactions en cours ({activePayments.length})
          </h2>
          <Link
            href="/admin/transactions"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Tout voir →
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : activePayments.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">✨</p>
            <p className="text-slate-500">
              Aucune transaction en cours
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-slate-500 uppercase bg-slate-50">
                  <th className="px-6 py-3">Client</th>
                  <th className="px-6 py-3">Transaction</th>
                  <th className="px-6 py-3">Montant</th>
                  <th className="px-6 py-3">Méthode</th>
                  <th className="px-6 py-3">Réception</th>
                  <th className="px-6 py-3">Statut</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activePayments.map((p) => {
                  const s =
                    STATUS_MAP[p.status] || STATUS_MAP.pending;
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-sm text-slate-900">
                            {p.firstName} {p.lastName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {p.userEmail}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-medium text-slate-900">
                          {p.transactionId}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-sm text-slate-900">
                          {p.amountUSD} USD
                        </span>
                        {p.amountHTG && (
                          <span className="block text-xs text-slate-500">
                            {p.amountHTG} HTG
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">
                          {p.method}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">
                          {p.receptionPlatform || "N/A"}
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
                        <div className="flex items-center gap-2">
                          {p.status === "pending" && (
                            <>
                              <button
                                onClick={() =>
                                  handleAction(p.id, "validate")
                                }
                                disabled={actionLoading === p.id}
                                className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                                title="Valider"
                              >
                                ✔ Valider
                              </button>
                              <button
                                onClick={() => setRejectModal(p.id)}
                                disabled={actionLoading === p.id}
                                className="px-3 py-1.5 text-xs font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                                title="Rejeter"
                              >
                                ❌ Rejeter
                              </button>
                            </>
                          )}
                          {p.status === "validated" && (
                            <button
                              onClick={() => handleAction(p.id, "pay")}
                              disabled={actionLoading === p.id}
                              className="px-3 py-1.5 text-xs font-semibold text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                              title="Marquer comme payé"
                            >
                              💰 Payé
                            </button>
                          )}
                          <button
                            onClick={() =>
                              window.location.href = `/admin/transactions?id=${p.id}`
                            }
                            className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                            title="Détails"
                          >
                            👁
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent completed */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="font-bold text-slate-900">
            📁 Transactions récentes terminées
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-slate-500 uppercase bg-slate-50">
                <th className="px-6 py-3">Client</th>
                <th className="px-6 py-3">Transaction</th>
                <th className="px-6 py-3">Montant</th>
                <th className="px-6 py-3">Méthode</th>
                <th className="px-6 py-3">Statut</th>
                <th className="px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments
                .filter(
                  (p) =>
                    p.status === "paid" || p.status === "rejected"
                )
                .slice(0, 10)
                .map((p) => {
                  const s =
                    STATUS_MAP[p.status] || STATUS_MAP.pending;
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-sm text-slate-900">
                          {p.firstName} {p.lastName}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-medium text-slate-900">
                          {p.transactionId}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-sm text-slate-900">
                          {p.amountUSD} USD
                        </span>
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
                          {new Date(p.createdAt).toLocaleDateString(
                            "fr-FR"
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              {payments.filter(
                (p) => p.status === "paid" || p.status === "rejected"
              ).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    Aucune transaction terminée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setRejectModal(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-md w-full animate-scale-in">
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              ❌ Rejeter la transaction
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              La raison du rejet est obligatoire et sera envoyée au client.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm resize-none"
              rows={3}
              placeholder="Indiquez la raison du rejet..."
            />
            <div className="flex items-center justify-end gap-3 mt-4">
              <button
                onClick={() => setRejectModal(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  if (rejectReason.trim()) {
                    handleAction(
                      rejectModal,
                      "reject",
                      rejectReason.trim()
                    );
                  }
                }}
                disabled={!rejectReason.trim()}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
