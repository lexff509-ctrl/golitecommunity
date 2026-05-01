"use client";

import { useState } from "react";
import Image from "next/image";
import { apiFetch } from "@/lib/api-client";
import { usePublicConfig, type PublicProject } from "@/lib/use-public-config";
import WalletDisplay from "@/components/WalletDisplay";
import Countdown from "@/components/Countdown";
import {
  PAYMENT_METHODS,
  RECEPTION_PLATFORMS,
  EXCHANGE_RATE,
  BINANCE_INFO,
  MONCASH_INFO,
  CAM_TRANSFER_INFO,
  DEFAULT_TRC20_WALLET,
} from "@/lib/constants";

type FormData = {
  firstName: string;
  lastName: string;
  amountUSD: string;
  method: string;
  paymentProof: string;
  paymentProofFilename: string;
  receptionPlatform: string;
  receptionName: string;
  receptionEmail: string;
  receptionPhone: string;
  receptionNetwork: string;
  receptionWallet: string;
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

export default function NewPaymentPage() {
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { data: pubConfig } = usePublicConfig();
  const [error, setError] = useState("");

  // Project selection
  const [selectedProject, setSelectedProject] = useState<PublicProject | null>(null);

  const [form, setForm] = useState<FormData>({
    firstName: "",
    lastName: "",
    amountUSD: "",
    method: "",
    paymentProof: "",
    paymentProofFilename: "",
    receptionPlatform: "",
    receptionName: "",
    receptionEmail: "",
    receptionPhone: "",
    receptionNetwork: "",
    receptionWallet: "",
  });

  const update = (key: keyof FormData, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const amountNum = parseFloat(form.amountUSD) || 0;
  const needsConversion =
    form.method === "MonCash" || form.method === "NatCash" || form.method === "CamTransfer";
  const convertedAmount = needsConversion ? amountNum * EXCHANGE_RATE : 0;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    if (!allowedTypes.includes(file.type)) {
      setError("Format non supporté. Utilisez JPG, PNG, WebP ou GIF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Le fichier ne doit pas dépasser 5 Mo.");
      return;
    }

    setUploading(true);
    setError("");

    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await apiFetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de l'upload");
        return;
      }
      update("paymentProof", data.url);
      update("paymentProofFilename", data.filename || file.name);
    } catch {
      setError("Erreur lors de l'upload du fichier.");
    }
    setUploading(false);
  };

  const canProceedStep1 = selectedProject !== null;
  const canProceedStep2 =
    form.firstName.trim() && form.lastName.trim() && amountNum > 0;
  const canProceedStep3 = form.method !== "";
  const canProceedStep4 = form.paymentProof !== "";
  const canProceedStep5 =
    form.receptionPlatform !== "" &&
    (form.receptionPlatform === "Zelle"
      ? form.receptionName.trim() && form.receptionEmail.trim()
      : form.receptionPlatform === "MonCash" ||
          form.receptionPlatform === "NatCash"
        ? form.receptionName.trim() && form.receptionPhone.trim()
        : form.receptionPlatform === "Crypto"
          ? form.receptionNetwork.trim() && form.receptionWallet.trim()
          : form.receptionPlatform === "Binance"
            ? form.receptionEmail.trim()
            : true);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");

    const receptionDetails: Record<string, string> = {};
    if (form.receptionPlatform === "Zelle") {
      receptionDetails.name = form.receptionName;
      receptionDetails.email = form.receptionEmail;
    } else if (
      form.receptionPlatform === "MonCash" ||
      form.receptionPlatform === "NatCash"
    ) {
      receptionDetails.name = form.receptionName;
      receptionDetails.phone = form.receptionPhone;
    } else if (form.receptionPlatform === "Crypto") {
      receptionDetails.network = form.receptionNetwork;
      receptionDetails.wallet = form.receptionWallet;
    } else if (form.receptionPlatform === "Binance") {
      receptionDetails.idOrEmail = form.receptionEmail;
      receptionDetails.name = form.receptionName;
    }

    try {
      const res = await apiFetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          amountUSD: amountNum,
          method: form.method,
          paymentProof: form.paymentProof,
          paymentProofFilename: form.paymentProofFilename,
          receptionPlatform: form.receptionPlatform,
          receptionDetails,
          projectId: selectedProject?.id || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de la soumission");
        return;
      }
      window.location.href = "/dashboard/history";
    } catch {
      setError("Erreur de connexion au serveur.");
    }
    setSubmitting(false);
  };

  const methodInfo = PAYMENT_METHODS.find((m) => m.id === form.method);
  const projects = pubConfig?.projects || [];

  // Compute remaining for selected project
  const projCollected = selectedProject
    ? toSafeNumber(selectedProject.collectedAmount)
    : 0;
  const projTarget = selectedProject
    ? toSafeNumber(selectedProject.targetAmount)
    : 0;
  const projRemaining = Math.max(0, projTarget - projCollected);
  const projPct = projTarget > 0 ? Math.min(100, (projCollected / projTarget) * 100) : 0;

  // Find countdown for project
  const projectCountdown =
    selectedProject?.status === "active" && pubConfig?.countdown
      ? pubConfig.countdown
      : null;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          💰 Nouveau paiement
        </h1>
        <p className="text-slate-500 mt-1">
          Sélectionnez un projet, puis suivez les étapes
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {[
          { n: 1, label: "Projet" },
          { n: 2, label: "Infos" },
          { n: 3, label: "Méthode" },
          { n: 4, label: "Preuve" },
          { n: 5, label: "Réception" },
          { n: 6, label: "Vérifier" },
        ].map((s, i) => (
          <div key={s.n} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step >= s.n
                    ? "bg-green-500 text-white"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {step > s.n ? "✓" : s.n}
              </div>
              <span className="text-xs text-slate-500 mt-1 hidden sm:block">
                {s.label}
              </span>
            </div>
            {i < 5 && (
              <div
                className={`w-6 sm:w-10 h-0.5 mx-1 ${
                  step > s.n ? "bg-green-500" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm animate-scale-in">
          {error}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
        {/* ═══ STEP 1: SELECT PROJECT ═══ */}
        {step === 1 && (
          <div className="space-y-5 animate-fade-in">
            <h2 className="text-lg font-bold text-slate-900">
              🎯 Sélectionnez un projet
            </h2>
            <p className="text-sm text-slate-500">
              Choisissez le projet dans lequel vous souhaitez investir.
            </p>

            {projects.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-4xl mb-3">📭</p>
                <p className="text-slate-500">Aucun projet disponible pour le moment</p>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map((p) => {
                  const collected = toSafeNumber(p.collectedAmount);
                  const target = toSafeNumber(p.targetAmount);
                  const remaining = Math.max(0, target - collected);
                  const pct = target > 0 ? Math.min(100, (collected / target) * 100) : 0;
                  const isSelected = selectedProject?.id === p.id;

                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProject(p)}
                      className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
                        isSelected
                          ? "border-green-500 bg-green-50"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">🎯</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900">{p.name}</h3>
                            {p.status === "active" && (
                              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                                Actif
                              </span>
                            )}
                            {isSelected && (
                              <span className="text-xs px-2 py-0.5 bg-green-500 text-white rounded-full font-medium">
                                ✓ Sélectionné
                              </span>
                            )}
                          </div>
                          {p.description && (
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                              {p.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mb-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-semibold text-green-600">
                            ${collected.toLocaleString()} collectés
                          </span>
                          <span className="text-slate-500">
                            Objectif: ${target.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {pct.toFixed(1)}% — Reste: ${remaining.toLocaleString()}
                        </p>
                      </div>

                      <p className="text-xs text-slate-400">
                        {formatSafeDate(p.startDate) && formatSafeDate(p.endDate)
                          ? `📅 ${formatSafeDate(p.startDate)} → ${formatSafeDate(p.endDate)}`
                          : ""}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══ STEP 2: PROJECT DETAILS + COUNTDOWN ═══ */}
        {step === 2 && selectedProject && (
          <div className="space-y-5 animate-fade-in">
            <h2 className="text-lg font-bold text-slate-900">
              📋 Projet sélectionné — {selectedProject.name}
            </h2>

            {/* Project summary */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold text-green-600">
                  ${projCollected.toLocaleString()} collectés
                </span>
                <span className="text-slate-500">
                  Objectif: ${projTarget.toLocaleString()}
                </span>
              </div>
              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full"
                  style={{ width: `${projPct}%` }}
                />
              </div>
              <p className="text-xs text-slate-500">
                Reste à collecter: ${projRemaining.toLocaleString()} — {projPct.toFixed(1)}%
              </p>
            </div>

            {/* Countdown for project */}
            {projectCountdown && (
              <Countdown
                targetDate={projectCountdown.targetDate}
                title={projectCountdown.title}
                message={projectCountdown.message}
                compact
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Prénom *
                </label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => update("firstName", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm"
                  placeholder="Votre prénom"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Nom *
                </label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => update("lastName", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm"
                  placeholder="Votre nom"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Montant en USD *
              </label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={form.amountUSD}
                onChange={(e) => update("amountUSD", e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm"
                placeholder="0.00"
              />
            </div>
          </div>
        )}

        {/* ═══ STEP 3: PAYMENT METHOD ═══ */}
        {step === 3 && (
          <div className="space-y-5 animate-fade-in">
            <h2 className="text-lg font-bold text-slate-900">
              💳 Méthode de paiement
            </h2>
            <p className="text-sm text-slate-500">
              Sélectionnez la méthode pour envoyer votre paiement.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    if (m.available) update("method", m.id);
                  }}
                  disabled={!m.available}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    form.method === m.id
                      ? "border-green-500 bg-green-50"
                      : m.available
                        ? "border-slate-200 hover:border-slate-300 bg-white"
                        : "border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">
                      {m.label}
                    </span>
                    {!m.available && (
                      <span className="text-xs text-red-500 font-medium">
                        Indisponible
                      </span>
                    )}
                    {m.available && form.method === m.id && (
                      <span className="text-green-500">✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Payment Info */}
            {form.method && methodInfo?.available && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mt-4">
                <h3 className="font-bold text-slate-900 mb-3">
                  📌 Informations de paiement — {form.method}
                </h3>
                {form.method === "MonCash" && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between p-2 bg-white rounded-lg">
                      <span className="text-slate-500">Nom :</span>
                      <span className="font-mono font-bold text-slate-900">
                        {MONCASH_INFO.name}
                      </span>
                    </div>
                    <div className="flex justify-between p-2 bg-white rounded-lg">
                      <span className="text-slate-500">Numéro :</span>
                      <span className="font-mono font-bold text-slate-900">
                        {MONCASH_INFO.phone}
                      </span>
                    </div>
                    <p className="text-amber-600 text-xs font-medium">
                      ⚠️ Envoyez exactement le montant indiqué. Conservez la preuve de transaction.
                    </p>
                  </div>
                )}
                {form.method === "CamTransfer" && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between p-2 bg-white rounded-lg">
                      <span className="text-slate-500">Nom & prénom :</span>
                      <span className="font-mono font-bold text-slate-900">
                        {CAM_TRANSFER_INFO.name}
                      </span>
                    </div>
                    <div className="flex justify-between p-2 bg-white rounded-lg">
                      <span className="text-slate-500">Numéro de référence :</span>
                      <span className="font-mono font-bold text-slate-900">
                        {CAM_TRANSFER_INFO.referenceNumber}
                      </span>
                    </div>
                    <p className="text-amber-600 text-xs font-medium">
                      ⚠️ {CAM_TRANSFER_INFO.instructions}
                    </p>
                  </div>
                )}
                {form.method === "Binance" && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between p-2 bg-white rounded-lg">
                      <span className="text-slate-500">ID :</span>
                      <span className="font-mono font-bold text-slate-900">
                        {BINANCE_INFO.id}
                      </span>
                    </div>
                    <div className="flex justify-between p-2 bg-white rounded-lg">
                      <span className="text-slate-500">Nom :</span>
                      <span className="font-mono font-bold text-slate-900">
                        {BINANCE_INFO.name}
                      </span>
                    </div>
                  </div>
                )}
                {form.method === "Crypto" && (
                  <div className="text-sm text-slate-600 space-y-1">
                    <p>• Réseau requis : TRC-20 (TRON)</p>
                    <p>• Wallet: {pubConfig?.config?.wallet_trc20 || DEFAULT_TRC20_WALLET}</p>
                    <p className="text-amber-600 font-medium">
                      ⚠️ Assurez-vous d&apos;envoyer via le bon réseau
                    </p>
                  </div>
                )}
                {form.method === "Zelle" && (
                  <div className="text-sm text-slate-600 space-y-1">
                    <p>• Envoyez via Zelle à l&apos;email/numéro fourni</p>
                    <p>• Incluez votre nom dans la référence</p>
                  </div>
                )}
              </div>
            )}

            {/* Wallet TRC20 */}
            <WalletDisplay wallet={pubConfig?.config?.wallet_trc20 || DEFAULT_TRC20_WALLET} />

            {/* Conversion display */}
            {amountNum > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-4">
                <h4 className="text-sm font-bold text-slate-900 mb-1">
                  💱 Conversion automatique
                </h4>
                {needsConversion ? (
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold">{amountNum} USD</span> →{" "}
                    <span className="font-bold text-green-700">
                      {convertedAmount.toLocaleString("fr-FR")} HTG
                    </span>{" "}
                    <span className="text-xs text-slate-500">
                      (1 USD = {EXCHANGE_RATE} HTG — {form.method})
                    </span>
                  </p>
                ) : (
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold">{amountNum} USD</span> →{" "}
                    <span className="font-bold text-blue-700">
                      {amountNum} USD
                    </span>{" "}
                    <span className="text-xs text-slate-500">
                      (pas de conversion — {form.method})
                    </span>
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══ STEP 4: PAYMENT PROOF ═══ */}
        {step === 4 && (
          <div className="space-y-5 animate-fade-in">
            <h2 className="text-lg font-bold text-slate-900">
              📥 Preuve de paiement
            </h2>
            <p className="text-sm text-slate-500">
              Téléversez une capture d&apos;écran ou photo de votre preuve.
            </p>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-green-400 transition-colors">
              {form.paymentProof ? (
                <div className="space-y-3">
                  <div className="relative h-64 max-w-md mx-auto rounded-lg overflow-hidden bg-slate-50">
                    <Image
                      src={form.paymentProof}
                      alt="Preuve"
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 448px"
                      unoptimized
                    />
                  </div>
                  <p className="text-sm text-green-600 font-medium">
                    ✓ Image uploadée
                  </p>
                  <button
                    onClick={() => {
                      update("paymentProof", "");
                      update("paymentProofFilename", "");
                    }}
                    className="text-sm text-red-500 hover:text-red-600"
                  >
                    Supprimer et changer
                  </button>
                </div>
              ) : (
                <div>
                  <div className="text-4xl mb-3">📷</div>
                  <p className="text-sm text-slate-500 mb-3">
                    Cliquez pour sélectionner un fichier
                  </p>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                  />
                  <p className="text-xs text-slate-400 mt-2">
                    JPG, PNG, WebP ou GIF — Max 5 Mo
                  </p>
                </div>
              )}
              {uploading && (
                <div className="mt-3">
                  <div className="w-6 h-6 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-500 mt-1">Upload en cours...</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ STEP 5: RECEPTION PLATFORM ═══ */}
        {step === 5 && (
          <div className="space-y-5 animate-fade-in">
            <h2 className="text-lg font-bold text-slate-900">
              💸 Plateforme de réception
            </h2>
            <p className="text-sm text-slate-500">
              Choisissez la plateforme pour recevoir vos fonds.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {RECEPTION_PLATFORMS.map((p) => (
                <button
                  key={p}
                  onClick={() => update("receptionPlatform", p)}
                  className={`p-3 rounded-xl border-2 text-center text-sm font-medium transition-all ${
                    form.receptionPlatform === p
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-slate-200 hover:border-slate-300 text-slate-600"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Dynamic Fields */}
            {form.receptionPlatform === "Zelle" && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Nom *</label>
                  <input type="text" value={form.receptionName} onChange={(e) => update("receptionName", e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm" placeholder="Votre nom complet" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email ou numéro Zelle *</label>
                  <input type="text" value={form.receptionEmail} onChange={(e) => update("receptionEmail", e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm" placeholder="email@zelle.com ou +1..." />
                </div>
              </div>
            )}

            {(form.receptionPlatform === "MonCash" || form.receptionPlatform === "NatCash") && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Nom *</label>
                  <input type="text" value={form.receptionName} onChange={(e) => update("receptionName", e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm" placeholder="Votre nom complet" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Numéro de téléphone *</label>
                  <input type="tel" value={form.receptionPhone} onChange={(e) => update("receptionPhone", e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm" placeholder="+509 xxx-xxxx" />
                </div>
              </div>
            )}

            {form.receptionPlatform === "Crypto" && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Réseau *</label>
                  <select value={form.receptionNetwork} onChange={(e) => update("receptionNetwork", e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm">
                    <option value="">Sélectionnez le réseau</option>
                    <option value="TRC20">TRC20 (Tron)</option>
                    <option value="ERC20">ERC20 (Ethereum)</option>
                    <option value="BEP20">BEP20 (BSC)</option>
                    <option value="SPL">SPL (Solana)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Adresse Wallet *</label>
                  <input type="text" value={form.receptionWallet} onChange={(e) => update("receptionWallet", e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm font-mono" placeholder="0x..." />
                </div>
              </div>
            )}

            {form.receptionPlatform === "Binance" && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">ID ou email Binance *</label>
                  <input type="text" value={form.receptionEmail} onChange={(e) => update("receptionEmail", e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm" placeholder="ID ou email Binance" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Nom (optionnel)</label>
                  <input type="text" value={form.receptionName} onChange={(e) => update("receptionName", e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm" placeholder="Votre nom" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ STEP 6: SUMMARY ═══ */}
        {step === 6 && selectedProject && (
          <div className="space-y-5 animate-fade-in">
            <h2 className="text-lg font-bold text-slate-900">
              📊 Résumé du paiement
            </h2>
            <p className="text-sm text-slate-500">
              Vérifiez les informations avant de soumettre.
            </p>

            <div className="bg-slate-50 rounded-xl p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Projet</span>
                <span className="font-medium text-slate-900">{selectedProject.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Nom complet</span>
                <span className="font-medium text-slate-900">{form.firstName} {form.lastName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Méthode d&apos;envoi</span>
                <span className="font-medium text-slate-900">{form.method}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Montant</span>
                <span className="font-bold text-slate-900">
                  {amountNum} USD
                  {needsConversion && (
                    <span className="text-green-600 ml-2">
                      → {convertedAmount.toLocaleString("fr-FR")} HTG
                    </span>
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Plateforme réception</span>
                <span className="font-medium text-slate-900">{form.receptionPlatform}</span>
              </div>
              {form.paymentProofFilename && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Preuve</span>
                  <span className="font-medium text-green-600">✓ {form.paymentProofFilename}</span>
                </div>
              )}
              <hr className="border-slate-200" />
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Statut</span>
                <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                  En attente
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        {step > 1 ? (
          <button
            onClick={() => setStep(step - 1)}
            className="px-6 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
          >
            ← Précédent
          </button>
        ) : (
          <div />
        )}

        {step < 6 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={
              (step === 1 && !canProceedStep1) ||
              (step === 2 && !canProceedStep2) ||
              (step === 3 && !canProceedStep3) ||
              (step === 4 && !canProceedStep4) ||
              (step === 5 && !canProceedStep5)
            }
            className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-green-500 to-blue-600 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Suivant →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-8 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-green-500 to-blue-600 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-green-200"
          >
            {submitting ? "Soumission en cours..." : "✅ Soumettre le paiement"}
          </button>
        )}
      </div>
    </div>
  );
}
