"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { EXCHANGE_RATE } from "@/lib/constants";

const INVESTMENT_RETURNS: Record<number, number> = {
  15: 30,
  30: 100,
  50: 170,
  100: 350,
  200: 720,
  300: 1100,
  400: 1500,
  500: 1900,
};

export default function InvestGuidePage() {
  const [amount, setAmount] = useState("15");
  const [cryptoHtg, setCryptoHtg] = useState("1500");
  const amountNum = Number(amount) || 0;
  const cryptoHtgNum = Number(cryptoHtg) || 0;

  const exactReturn = useMemo(() => INVESTMENT_RETURNS[amountNum], [amountNum]);
  const cryptoUsd = useMemo(() => cryptoHtgNum / EXCHANGE_RATE, [cryptoHtgNum]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          📖 Comment investir
        </h1>
        <p className="text-slate-500 mt-1">
          Suivez ces étapes pour effectuer votre investissement
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-6 stagger-children">
        {[
          {
            step: 1,
            icon: "1️⃣",
            title: "Créez votre compte",
            desc: "Inscrivez-vous sur la plateforme avec vos informations personnelles. L'inscription est gratuite et rapide.",
          },
          {
            step: 2,
            icon: "2️⃣",
            title: "Choisissez votre montant",
            desc: "Rendez-vous dans la section « Nouveau paiement » et indiquez le montant que vous souhaitez investir en USD.",
          },
          {
            step: 3,
            icon: "3️⃣",
            title: "Sélectionnez la méthode de paiement",
            desc: "Choisissez parmi les méthodes disponibles : MonCash, CAM Transfer, Binance, Crypto. NatCash et Zelle sont temporairement indisponibles.",
          },
          {
            step: 4,
            icon: "4️⃣",
            title: "Effectuez le transfert",
            desc: "Envoyez le montant correspondant aux informations de paiement affichées. Conservez votre preuve de transaction.",
          },
          {
            step: 5,
            icon: "5️⃣",
            title: "Téléversez votre preuve",
            desc: "Uploadez une capture d'écran ou une photo de votre preuve de paiement (JPG, PNG, WebP, GIF — max 5 Mo).",
          },
          {
            step: 6,
            icon: "6️⃣",
            title: "Choisissez la plateforme de réception",
            desc: "Indiquez sur quelle plateforme vous souhaitez recevoir vos fonds (Zelle, MonCash, NatCash, Crypto, Binance).",
          },
          {
            step: 7,
            icon: "7️⃣",
            title: "Soumettez et attendez",
            desc: "Vérifiez le résumé et soumettez. Notre équipe traitera votre paiement dans les délais indiqués.",
          },
        ].map((s) => (
          <div
            key={s.step}
            className="bg-white border border-slate-200 rounded-2xl p-6 card-hover"
          >
            <div className="flex items-start gap-4">
              <div className="text-3xl">{s.icon}</div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  {s.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {s.desc}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Important Info */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">
          ⏱️ Délais de traitement
        </h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <span className="text-lg">⏳</span>
            <div>
              <p className="font-medium text-slate-900 text-sm">
                Validation
              </p>
              <p className="text-xs text-slate-500">
                24 à 48 heures ouvrées
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <span className="text-lg">💰</span>
            <div>
              <p className="font-medium text-slate-900 text-sm">
                Paiement
              </p>
              <p className="text-xs text-slate-500">
                1 à 3 jours ouvrés après validation
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Accepted Methods */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">
          💳 Méthodes acceptées
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              name: "Binance",
              status: "Disponible",
              ok: true,
              info: "ID: 554871538 | Nom: DK27HA",
            },
            { name: "Crypto", status: "Disponible", ok: true, info: "TRC20 / ERC20" },
            { name: "CAM Transfer", status: "Disponible", ok: true, info: "Dorvil Winchell | Réf: +50946074865" },
            { name: "MonCash", status: "Disponible", ok: true, info: "Numéro: 31959375" },
            { name: "NatCash", status: "Temporairement indisponible", ok: false },
            { name: "Zelle", status: "Temporairement indisponible", ok: false },
          ].map((m) => (
            <div
              key={m.name}
              className={`flex items-center gap-3 p-4 rounded-xl border ${
                m.ok
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <span className="text-xl">{m.ok ? "✅" : "❌"}</span>
              <div>
                <p className="font-semibold text-sm text-slate-900">
                  {m.name}
                </p>
                <p
                  className={`text-xs ${m.ok ? "text-green-600" : "text-red-600"}`}
                >
                  {m.status}
                </p>
                {m.info && (
                  <p className="text-xs text-slate-500 mt-0.5">{m.info}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Investment Calculator */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-3">
          🧮 Calcul investissement (15$ à 500$)
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          Entrez un montant autorisé pour voir le gain attendu immédiatement.
        </p>
        <input
          type="number"
          min="15"
          max="500"
          step="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm mb-4"
        />
        {exactReturn ? (
          <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-sm">
            <p className="font-semibold text-slate-900">
              Investi: ${amountNum.toLocaleString()} → Gain: ${exactReturn.toLocaleString()}
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-700">
            Montant non autorisé. Montants disponibles: {Object.keys(INVESTMENT_RETURNS).join(", ")} USD.
          </div>
        )}
      </div>

      {/* Crypto Purchase */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-3">
          💱 Achat de crypto
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          Taux fixe: 1 USD = {EXCHANGE_RATE} HTG. L&apos;admin valide uniquement avec preuve de paiement (image).
        </p>
        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <input
            type="number"
            min="150"
            step="1"
            value={cryptoHtg}
            onChange={(e) => setCryptoHtg(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
            placeholder="Montant HTG"
          />
          <div className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm">
            Equivalent USD: <span className="font-semibold">{cryptoUsd.toFixed(2)} USD</span>
          </div>
        </div>
        <p className="text-xs text-slate-500 mb-3">
          Processus: paiement → upload preuve image → validation admin → traitement.
        </p>
        <Link
          href="/dashboard/payment"
          className="inline-block px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-green-500 to-blue-600 rounded-xl hover:opacity-90"
        >
          Acheter crypto maintenant
        </Link>
      </div>

      {/* Rules & Warnings */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">
          ⚠️ Règles importantes
        </h2>
        <ul className="space-y-3">
          {[
            "La preuve de paiement est obligatoire pour chaque transaction.",
            "Les informations fournies doivent être exactes et à jour.",
            "Les transactions sans preuve valide seront rejetées.",
            "Ne soumettez pas le même paiement deux fois.",
            "Le montant envoyé doit correspondre exactement au montant déclaré.",
            "Les paiements sont traités uniquement pendant les jours ouvrés.",
            "Conservez votre numéro de transaction (GL-XXXXXXXX) pour le suivi.",
          ].map((rule, i) => (
            <li
              key={i}
              className="flex items-start gap-3 text-sm text-slate-600"
            >
              <span className="text-amber-500 mt-0.5">⚡</span>
              {rule}
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <div className="text-center pb-4">
        <Link
          href="/dashboard/payment"
          className="inline-block px-8 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-green-500 to-blue-600 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-green-200"
        >
          Commencer un paiement →
        </Link>
      </div>
    </div>
  );
}
