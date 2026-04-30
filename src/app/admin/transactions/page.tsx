"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
  paymentProof: string | null;
  paymentProofFilename: string | null;
  receptionPlatform: string | null;
  receptionDetails: Record<string, string> | null;
  rejectionReason: string | null;
  adminNotes: string | null;
  createdAt: string;
  validatedAt: string | null;
  paidAt: string | null;
  rejectedAt: string | null;
  userEmail: string;
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

function TransactionsContent() {
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("id");

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [detailPayment, setDetailPayment] = useState<Payment | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (methodFilter !== "all") params.set("method", methodFilter);
    if (searchTerm) params.set("search", searchTerm);

    try {
      const res = await apiFetch(`/api/admin/payments?${params.toString()}`);
      const data = await res.json();
      setPayments(data.payments || []);
    } catch {
      // silent
    }
    setLoading(false);
  }, [statusFilter, methodFilter, searchTerm]);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchPayments();
    });
  }, [fetchPayments]);

  useEffect(() => {
    if (selectedId) {
      queueMicrotask(() => {
        setDetailLoading(true);
        apiFetch(`/api/admin/payments/${selectedId}`)
          .then((r) => r.json())
          .then((data) => {
            setDetailPayment(data.payment || null);
            setDetailLoading(false);
          })
          .catch(() => setDetailLoading(false));
      });
    }
  }, [selectedId]);

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
        if (detailPayment?.id === id) {
          const updated = await apiFetch(`/api/admin/payments/${id}`).then((r) =>
            r.json()
          );
          setDetailPayment(updated.payment || null);
        }
      } else {
        const data = await res.json();
        alert(data.error || "Erreur");
      }
    } catch {
      alert("Erreur de connexion");
    }
    setActionLoading(null);
    setRejectModal(null);
    setRejectReason("");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          📋 Transactions
        </h1>
        <p className="text-slate-500 mt-1">
          Gérez et consultez toutes les transactions
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Recherche
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nom, transaction..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Statut
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="validated">Validés</option>
              <option value="paid">Payés</option>
              <option value="rejected">Rejetés</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Méthode
            </label>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
            >
              <option value="all">Toutes les méthodes</option>
              <option value="MonCash">MonCash</option>
              <option value="NatCash">NatCash</option>
              <option value="Binance">Binance</option>
              <option value="Crypto">Crypto</option>
              <option value="Zelle">Zelle</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-slate-500">Aucune transaction trouvée</p>
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
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => {
                  const s = STATUS_MAP[p.status] || STATUS_MAP.pending;
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => setDetailPayment(p)}
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-sm text-slate-900">
                          {p.firstName} {p.lastName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {p.userEmail}
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
                        <span className="text-sm text-slate-500">
                          {new Date(p.createdAt).toLocaleDateString("fr-FR")}
                        </span>
                      </td>
                      <td
                        className="px-6 py-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-1">
                          {p.status === "pending" && (
                            <>
                              <button
                                onClick={() =>
                                  handleAction(p.id, "validate")
                                }
                                disabled={actionLoading === p.id}
                                className="px-2 py-1 text-xs font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                              >
                                ✔
                              </button>
                              <button
                                onClick={() => setRejectModal(p.id)}
                                disabled={actionLoading === p.id}
                                className="px-2 py-1 text-xs font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50"
                              >
                                ❌
                              </button>
                            </>
                          )}
                          {p.status === "validated" && (
                            <button
                              onClick={() => handleAction(p.id, "pay")}
                              disabled={actionLoading === p.id}
                              className="px-2 py-1 text-xs font-semibold text-white bg-green-500 rounded-lg hover:bg-green-600 disabled:opacity-50"
                            >
                              💰
                            </button>
                          )}
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

      {/* Detail Panel */}
      {detailPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setDetailPayment(null)}
          />
          <div className="relative h-full w-full max-w-lg bg-white shadow-2xl overflow-y-auto animate-slide-in">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="font-bold text-slate-900">
                Détail transaction
              </h2>
              <button
                onClick={() => setDetailPayment(null)}
                className="p-2 rounded-lg hover:bg-slate-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              {detailLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <div
                    className={`p-4 rounded-xl border ${STATUS_MAP[detailPayment.status]?.cls || ""}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {STATUS_MAP[detailPayment.status]?.icon}
                      </span>
                      <span className="font-bold">
                        {STATUS_MAP[detailPayment.status]?.label}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {[
                      {
                        label: "Transaction ID",
                        value: detailPayment.transactionId,
                      },
                      {
                        label: "Client",
                        value: `${detailPayment.firstName} ${detailPayment.lastName}`,
                      },
                      { label: "Email", value: detailPayment.userEmail },
                      {
                        label: "Montant USD",
                        value: `${detailPayment.amountUSD} USD`,
                      },
                      {
                        label: "Montant HTG",
                        value: detailPayment.amountHTG
                          ? `${detailPayment.amountHTG} HTG`
                          : "N/A",
                      },
                      { label: "Méthode envoi", value: detailPayment.method },
                      {
                        label: "Plateforme réception",
                        value: detailPayment.receptionPlatform || "N/A",
                      },
                      {
                        label: "Créé le",
                        value: new Date(
                          detailPayment.createdAt
                        ).toLocaleString("fr-FR"),
                      },
                    ].map((item, i) => (
                      <div key={i}>
                        <p className="text-xs text-slate-400 mb-0.5">
                          {item.label}
                        </p>
                        <p className="text-sm font-medium text-slate-900">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {detailPayment.receptionDetails &&
                    Object.keys(detailPayment.receptionDetails).length > 0 && (
                      <div>
                        <h3 className="text-sm font-bold text-slate-700 mb-2">
                          📌 Infos de réception
                        </h3>
                        <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                          {Object.entries(detailPayment.receptionDetails).map(
                            ([key, val]) => (
                              <div
                                key={key}
                                className="flex justify-between text-sm"
                              >
                                <span className="text-slate-500 capitalize">
                                  {key}
                                </span>
                                <span className="font-medium text-slate-900">
                                  {String(val)}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  {detailPayment.paymentProof && (
                    <div>
                      <h3 className="text-sm font-bold text-slate-700 mb-2">
                        📥 Preuve de paiement
                      </h3>
                      <img
                        src={detailPayment.paymentProof}
                        alt="Preuve"
                        className="w-full rounded-xl border border-slate-200 max-h-80 object-contain"
                      />
                      {detailPayment.paymentProofFilename && (
                        <p className="text-xs text-slate-500 mt-1">
                          {detailPayment.paymentProofFilename}
                        </p>
                      )}
                    </div>
                  )}

                  {detailPayment.status === "rejected" &&
                    detailPayment.rejectionReason && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-sm font-bold text-red-700 mb-1">
                          ❌ Raison du rejet
                        </p>
                        <p className="text-sm text-red-600">
                          {detailPayment.rejectionReason}
                        </p>
                      </div>
                    )}

                  {detailPayment.adminNotes && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <p className="text-sm font-bold text-blue-700 mb-1">
                        📝 Notes admin
                      </p>
                      <p className="text-sm text-blue-600">
                        {detailPayment.adminNotes}
                      </p>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-bold text-slate-700 mb-3">
                      ⏱️ Historique
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-3 h-3 rounded-full bg-slate-400" />
                        <div>
                          <p className="font-medium text-slate-900">
                            Paiement créé
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(
                              detailPayment.createdAt
                            ).toLocaleString("fr-FR")}
                          </p>
                        </div>
                      </div>
                      {detailPayment.validatedAt && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                          <div>
                            <p className="font-medium text-slate-900">
                              Validé
                            </p>
                            <p className="text-xs text-slate-500">
                              {new Date(
                                detailPayment.validatedAt
                              ).toLocaleString("fr-FR")}
                            </p>
                          </div>
                        </div>
                      )}
                      {detailPayment.paidAt && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                          <div>
                            <p className="font-medium text-slate-900">
                              Payé
                            </p>
                            <p className="text-xs text-slate-500">
                              {new Date(
                                detailPayment.paidAt
                              ).toLocaleString("fr-FR")}
                            </p>
                          </div>
                        </div>
                      )}
                      {detailPayment.rejectedAt && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-3 h-3 rounded-full bg-red-500" />
                          <div>
                            <p className="font-medium text-slate-900">
                              Rejeté
                            </p>
                            <p className="text-xs text-slate-500">
                              {new Date(
                                detailPayment.rejectedAt
                              ).toLocaleString("fr-FR")}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-200">
                    {detailPayment.status === "pending" && (
                      <>
                        <button
                          onClick={() =>
                            handleAction(detailPayment.id, "validate")
                          }
                          disabled={actionLoading === detailPayment.id}
                          className="px-4 py-2 text-sm font-semibold text-white bg-blue-500 rounded-xl hover:bg-blue-600 disabled:opacity-50"
                        >
                          ✔ Valider
                        </button>
                        <button
                          onClick={() => setRejectModal(detailPayment.id)}
                          disabled={actionLoading === detailPayment.id}
                          className="px-4 py-2 text-sm font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600 disabled:opacity-50"
                        >
                          ❌ Rejeter
                        </button>
                      </>
                    )}
                    {detailPayment.status === "validated" && (
                      <button
                        onClick={() => handleAction(detailPayment.id, "pay")}
                        disabled={actionLoading === detailPayment.id}
                        className="px-4 py-2 text-sm font-semibold text-white bg-green-500 rounded-xl hover:bg-green-600 disabled:opacity-50"
                      >
                        💰 Marquer comme PAYÉ
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setRejectModal(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-md w-full animate-scale-in">
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              ❌ Rejeter la transaction
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              La raison du rejet est obligatoire.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm resize-none"
              rows={3}
              placeholder="Raison du rejet..."
            />
            <div className="flex items-center justify-end gap-3 mt-4">
              <button
                onClick={() => setRejectModal(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  if (rejectReason.trim()) {
                    handleAction(rejectModal, "reject", rejectReason.trim());
                  }
                }}
                disabled={!rejectReason.trim()}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600 disabled:opacity-50"
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

export default function TransactionsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <TransactionsContent />
    </Suspense>
  );
}
