"use client";

import { useState } from "react";

type Props = {
  wallet: string;
};

export default function WalletDisplay({ wallet }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(wallet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = wallet;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">🔗</span>
        <div>
          <h3 className="font-bold text-slate-900">Wallet TRC20 (Tron)</h3>
          <p className="text-xs text-slate-500">Réseau TRON — USDT / TRX</p>
        </div>
      </div>
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-3">
        <code className="flex-1 text-sm font-mono text-slate-700 break-all select-all">
          {wallet}
        </code>
        <button
          onClick={handleCopy}
          className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            copied
              ? "bg-green-500 text-white"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          {copied ? "✓ Copié" : "📋 Copier"}
        </button>
      </div>
      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
        <p className="text-xs text-amber-700">
          ⚠️ Envoyez uniquement sur le réseau <strong>TRC20</strong>. Toute transaction sur un autre réseau sera perdue.
        </p>
      </div>
    </div>
  );
}
