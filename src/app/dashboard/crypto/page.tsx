"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { PAYMENT_METHODS, RECEPTION_PLATFORMS } from "@/lib/constants";

const BUY_RATE = 136;
const SELL_RATE = 150;

export default function CryptoPage() {
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [amountHtg, setAmountHtg] = useState("");
  const [cryptoType, setCryptoType] = useState("USDT");
  const [network, setNetwork] = useState("TRC20");
  const [walletAddress, setWalletAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("MonCash");
  const [paymentProof, setPaymentProof] = useState("");
  const [uploading, setUploading] = useState(false);
  const [receptionPlatform, setReceptionPlatform] = useState("");
  const [receptionName, setReceptionName] = useState("");
  const [receptionEmail, setReceptionEmail] = useState("");
  const [receptionPhone, setReceptionPhone] = useState("");
  const [receptionNetwork, setReceptionNetwork] = useState("");
  const [receptionWallet, setReceptionWallet] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const amount = Number(amountHtg || 0);
  const rate = mode === "buy" ? BUY_RATE : SELL_RATE;
  const usd = amount > 0 ? amount / rate : 0;

  const uploadProof = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await apiFetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload échoué");
      setPaymentProof(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur upload");
    }
    setUploading(false);
  };

  const buildReceptionDetails = () => {
    const details: Record<string, string> = {};
    if (receptionPlatform === "Zelle") {
      details.name = receptionName;
      details.email = receptionEmail;
    } else if (receptionPlatform === "MonCash" || receptionPlatform === "NatCash") {
      details.name = receptionName;
      details.phone = receptionPhone;
    } else if (receptionPlatform === "Crypto") {
      details.network = receptionNetwork;
      details.wallet = receptionWallet;
    } else if (receptionPlatform === "Binance") {
      details.idOrEmail = receptionEmail;
      details.name = receptionName;
    }
    return details;
  };

  const submit = async () => {
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      const body = {
        mode,
        amountHtg: amount,
        cryptoType,
        network,
        walletAddress,
        paymentMethod: mode === "buy" ? paymentMethod : null,
        paymentProof: mode === "buy" ? paymentProof : null,
        receptionPlatform: mode === "sell" ? receptionPlatform : null,
        receptionDetails: mode === "sell" ? buildReceptionDetails() : null,
      };
      const res = await apiFetch("/api/crypto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de soumission");
      setMessage(
        mode === "buy"
          ? "Demande d'achat envoyée. L'admin va vérifier la preuve et traiter l'envoi."
          : "Demande de vente envoyée. L'admin va examiner et confirmer le paiement."
      );
      setAmountHtg("");
      setWalletAddress("");
      setPaymentProof("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur serveur");
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">🪙 Crypto Achat / Vente</h1>
        <p className="text-slate-500 mt-1">
          Achat à {BUY_RATE} HTG/USD, vente à {SELL_RATE} HTG/USD.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setMode("buy")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold ${
            mode === "buy" ? "bg-green-500 text-white" : "bg-white border border-slate-200 text-slate-700"
          }`}
        >
          Achat
        </button>
        <button
          onClick={() => setMode("sell")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold ${
            mode === "sell" ? "bg-blue-500 text-white" : "bg-white border border-slate-200 text-slate-700"
          }`}
        >
          Vente
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <input
            type="number"
            min="1"
            value={amountHtg}
            onChange={(e) => setAmountHtg(e.target.value)}
            placeholder="Montant HTG"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
          />
          <div className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm">
            Equivalent USD: <span className="font-semibold">{usd.toFixed(2)} USD</span>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <select
            value={cryptoType}
            onChange={(e) => setCryptoType(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
          >
            <option value="USDT">USDT</option>
            <option value="USDC">USDC</option>
            <option value="BTC">BTC</option>
            <option value="ETH">ETH</option>
          </select>
          <select
            value={network}
            onChange={(e) => setNetwork(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
          >
            <option value="TRC20">TRC20</option>
            <option value="ERC20">ERC20</option>
            <option value="BEP20">BEP20</option>
            <option value="BTC">BTC</option>
            <option value="SOL">SOL</option>
          </select>
        </div>

        <input
          type="text"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          placeholder={mode === "buy" ? "Votre wallet pour recevoir crypto" : "Wallet source (optionnel recommandé)"}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
        />

        {mode === "buy" && (
          <>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
            >
              {PAYMENT_METHODS.filter((m) => m.available).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>

            <div className="space-y-2">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadProof(file);
                }}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700"
              />
              {uploading && <p className="text-xs text-slate-500">Upload...</p>}
              {paymentProof && <p className="text-xs text-green-600">Preuve uploadée ✅</p>}
            </div>
          </>
        )}

        {mode === "sell" && (
          <div className="space-y-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-sm font-semibold text-slate-800">Moyen pour recevoir votre paiement</p>
            <select
              value={receptionPlatform}
              onChange={(e) => setReceptionPlatform(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
            >
              <option value="">Choisir plateforme</option>
              {RECEPTION_PLATFORMS.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>

            {(receptionPlatform === "Zelle" || receptionPlatform === "Binance") && (
              <>
                <input
                  type="text"
                  value={receptionName}
                  onChange={(e) => setReceptionName(e.target.value)}
                  placeholder="Nom"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
                <input
                  type="text"
                  value={receptionEmail}
                  onChange={(e) => setReceptionEmail(e.target.value)}
                  placeholder="Email / ID"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </>
            )}

            {(receptionPlatform === "MonCash" || receptionPlatform === "NatCash") && (
              <>
                <input
                  type="text"
                  value={receptionName}
                  onChange={(e) => setReceptionName(e.target.value)}
                  placeholder="Nom"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
                <input
                  type="text"
                  value={receptionPhone}
                  onChange={(e) => setReceptionPhone(e.target.value)}
                  placeholder="Téléphone"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </>
            )}

            {receptionPlatform === "Crypto" && (
              <>
                <select
                  value={receptionNetwork}
                  onChange={(e) => setReceptionNetwork(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                >
                  <option value="">Réseau</option>
                  <option value="TRC20">TRC20</option>
                  <option value="ERC20">ERC20</option>
                  <option value="BEP20">BEP20</option>
                  <option value="SPL">SPL</option>
                </select>
                <input
                  type="text"
                  value={receptionWallet}
                  onChange={(e) => setReceptionWallet(e.target.value)}
                  placeholder="Adresse wallet"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </>
            )}
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-green-600">{message}</p>}

        <button
          onClick={submit}
          disabled={submitting || amount <= 0}
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-green-500 to-blue-600 disabled:opacity-50"
        >
          {submitting ? "Traitement..." : mode === "buy" ? "Envoyer demande d'achat" : "Envoyer demande de vente"}
        </button>
      </div>
    </div>
  );
}
