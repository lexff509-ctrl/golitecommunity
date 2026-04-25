"use client";

import { useState } from "react";
import { usePublicConfig } from "@/lib/use-public-config";

const CATEGORY_ICONS: Record<string, string> = {
  inscription: "📝",
  trading: "📈",
  paiement: "💳",
  retrait: "💸",
  sécurité: "🔒",
  programme: "🚀",
  general: "❓",
};

const CATEGORY_LABELS: Record<string, string> = {
  inscription: "Inscription",
  trading: "Trading",
  paiement: "Paiement",
  retrait: "Retrait",
  sécurité: "Sécurité",
  programme: "Programme",
  general: "Général",
};

export default function FAQPage() {
  const { data, loading } = usePublicConfig();
  const [activeCategory, setActiveCategory] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const faqs = data?.faq || [];
  const categories = [...new Set(faqs.map((f) => f.category))];

  const filtered =
    activeCategory === "all"
      ? faqs
      : faqs.filter((f) => f.category === activeCategory);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          ❓ Questions fréquentes
        </h1>
        <p className="text-slate-500 mt-1">
          Trouvez rapidement les réponses à vos questions
        </p>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory("all")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeCategory === "all"
              ? "bg-green-500 text-white shadow-sm"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          Toutes
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeCategory === cat
                ? "bg-green-500 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {CATEGORY_ICONS[cat] || "❓"} {CATEGORY_LABELS[cat] || cat}
          </button>
        ))}
      </div>

      {/* FAQ Items */}
      <div className="space-y-3 stagger-children">
        {filtered.map((faq) => {
          const isOpen = openId === faq.id;
          return (
            <div
              key={faq.id}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setOpenId(isOpen ? null : faq.id)}
                className="w-full px-6 py-4 flex items-center gap-3 text-left hover:bg-slate-50 transition-colors"
              >
                <span className="text-lg">{CATEGORY_ICONS[faq.category] || "❓"}</span>
                <span className="flex-1 font-medium text-slate-900 text-sm">
                  {faq.question}
                </span>
                <svg
                  className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isOpen && (
                <div className="px-6 pb-4 border-t border-slate-100 pt-3 animate-fade-in">
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-slate-500">Aucune question dans cette catégorie</p>
        </div>
      )}
    </div>
  );
}
