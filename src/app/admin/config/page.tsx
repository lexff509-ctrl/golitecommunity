"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api-client";

type Countdown = {
  id: string;
  title: string;
  targetDate: string;
  active: boolean;
  message: string | null;
};

type SiteConfigItem = {
  id: string;
  key: string;
  value: string;
  category: string;
};

type FAQ = {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  active: boolean;
};

type OnboardingStep = {
  id: string;
  stepNumber: number;
  title: string;
  description: string | null;
  videoUrl: string | null;
  linkUrl: string | null;
  linkLabel: string | null;
  icon: string | null;
  active: boolean;
};

type Tab = "countdown" | "links" | "faq" | "onboarding";

export default function AdminConfigPage() {
  const [tab, setTab] = useState<Tab>("countdown");
  const [countdown, setCountdown] = useState<Countdown | null>(null);
  const [configItems, setConfigItems] = useState<SiteConfigItem[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Countdown form
  const [cdTitle, setCdTitle] = useState("");
  const [cdDate, setCdDate] = useState("");
  const [cdActive, setCdActive] = useState(true);
  const [cdMessage, setCdMessage] = useState("");

  // FAQ form
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");
  const [faqCategory, setFaqCategory] = useState("general");
  const [editFaqId, setEditFaqId] = useState<string | null>(null);

  // Onboarding form
  const [onbTitle, setOnbTitle] = useState("");
  const [onbDesc, setOnbDesc] = useState("");
  const [onbVideo, setOnbVideo] = useState("");
  const [onbLink, setOnbLink] = useState("");
  const [onbLinkLabel, setOnbLinkLabel] = useState("");
  const [onbIcon, setOnbIcon] = useState("");
  const [onbNum, setOnbNum] = useState(1);
  const [editOnbId, setEditOnbId] = useState<string | null>(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [cdRes, cfgRes, faqRes, onbRes] = await Promise.all([
        apiFetch("/api/admin/config/countdown"),
        apiFetch("/api/admin/config/site"),
        apiFetch("/api/admin/config/faq"),
        apiFetch("/api/admin/config/onboarding"),
      ]);
      const cd = await cdRes.json();
      const cfg = await cfgRes.json();
      const faq = await faqRes.json();
      const onb = await onbRes.json();

      if (cd.countdown) {
        setCountdown(cd.countdown);
        setCdTitle(cd.countdown.title || "");
        setCdDate(new Date(cd.countdown.targetDate).toISOString().slice(0, 16));
        setCdActive(cd.countdown.active);
        setCdMessage(cd.countdown.message || "");
      }
      setConfigItems(cfg.config || []);
      setFaqs(faq.faqs || []);
      setSteps(onb.steps || []);
    } catch {
      // silent
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const showMsg = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  // ── Save Countdown ──
  const saveCountdown = async () => {
    setSaving(true);
    await apiFetch("/api/admin/config/countdown", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: cdTitle,
        targetDate: new Date(cdDate).toISOString(),
        active: cdActive,
        message: cdMessage,
      }),
    });
    showMsg("✅ Countdown mis à jour");
    setSaving(false);
    loadAll();
  };

  // ── Save Config Links ──
  const saveConfig = async () => {
    setSaving(true);
    const items = configItems.map((c) => ({ key: c.key, value: c.value }));
    await apiFetch("/api/admin/config/site", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    showMsg("✅ Liens mis à jour");
    setSaving(false);
  };

  // ── Save FAQ ──
  const saveFaq = async () => {
    if (!faqQuestion || !faqAnswer) return;
    setSaving(true);
    if (editFaqId) {
      await apiFetch("/api/admin/config/faq", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editFaqId, question: faqQuestion, answer: faqAnswer, category: faqCategory }),
      });
    } else {
      await apiFetch("/api/admin/config/faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: faqQuestion, answer: faqAnswer, category: faqCategory, order: faqs.length + 1 }),
      });
    }
    setFaqQuestion("");
    setFaqAnswer("");
    setEditFaqId(null);
    showMsg("✅ FAQ sauvegardée");
    setSaving(false);
    loadAll();
  };

  const deleteFaq = async (id: string) => {
    await apiFetch(`/api/admin/config/faq?id=${id}`, { method: "DELETE" });
    showMsg("✅ FAQ supprimée");
    loadAll();
  };

  // ── Save Onboarding ──
  const saveOnboarding = async () => {
    if (!onbTitle) return;
    setSaving(true);
    if (editOnbId) {
      await apiFetch("/api/admin/config/onboarding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editOnbId, stepNumber: onbNum, title: onbTitle, description: onbDesc, videoUrl: onbVideo, linkUrl: onbLink, linkLabel: onbLinkLabel, icon: onbIcon }),
      });
    } else {
      await apiFetch("/api/admin/config/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepNumber: steps.length + 1, title: onbTitle, description: onbDesc, videoUrl: onbVideo, linkUrl: onbLink, linkLabel: onbLinkLabel, icon: onbIcon }),
      });
    }
    setOnbTitle("");
    setOnbDesc("");
    setOnbVideo("");
    setOnbLink("");
    setOnbLinkLabel("");
    setOnbIcon("");
    setEditOnbId(null);
    showMsg("✅ Étape sauvegardée");
    setSaving(false);
    loadAll();
  };

  const deleteOnboarding = async (id: string) => {
    await apiFetch(`/api/admin/config/onboarding?id=${id}`, { method: "DELETE" });
    showMsg("✅ Étape supprimée");
    loadAll();
  };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "countdown", label: "Countdown", icon: "⏳" },
    { id: "links", label: "Liens & Wallet", icon: "🔗" },
    { id: "faq", label: "FAQ", icon: "❓" },
    { id: "onboarding", label: "Onboarding", icon: "🚀" },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          ⚙️ Program Control Panel
        </h1>
        <p className="text-slate-500 mt-1">
          Gérez le countdown, les liens, la FAQ et l&apos;onboarding
        </p>
      </div>

      {message && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm animate-scale-in">
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              tab === t.id
                ? "bg-blue-500 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── COUNTDOWN TAB ── */}
      {tab === "countdown" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-slate-900">⏳ Countdown</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Titre</label>
              <input value={cdTitle} onChange={(e) => setCdTitle(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Date cible</label>
              <input type="datetime-local" value={cdDate} onChange={(e) => setCdDate(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Message</label>
            <input value={cdMessage} onChange={(e) => setCdMessage(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={cdActive} onChange={(e) => setCdActive(e.target.checked)} className="w-4 h-4 rounded border-slate-300" />
              <span className="text-sm font-medium text-slate-700">Actif</span>
            </label>
          </div>
          <button onClick={saveCountdown} disabled={saving} className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-500 rounded-xl hover:bg-blue-600 disabled:opacity-50">
            {saving ? "..." : "💾 Sauvegarder"}
          </button>
        </div>
      )}

      {/* ── LINKS TAB ── */}
      {tab === "links" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-slate-900">🔗 Liens & Wallet</h2>
          <div className="space-y-4">
            {configItems.map((item, i) => (
              <div key={item.id}>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  {item.key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </label>
                <input
                  value={item.value}
                  onChange={(e) => {
                    const newItems = [...configItems];
                    newItems[i].value = e.target.value;
                    setConfigItems(newItems);
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            ))}
          </div>
          <button onClick={saveConfig} disabled={saving} className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-500 rounded-xl hover:bg-blue-600 disabled:opacity-50">
            {saving ? "..." : "💾 Sauvegarder"}
          </button>
        </div>
      )}

      {/* ── FAQ TAB ── */}
      {tab === "faq" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <h2 className="font-bold text-slate-900">
              {editFaqId ? "✏️ Modifier" : "➕ Ajouter"} une question
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input value={faqQuestion} onChange={(e) => setFaqQuestion(e.target.value)} placeholder="Question..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              <select value={faqCategory} onChange={(e) => setFaqCategory(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                <option value="inscription">Inscription</option>
                <option value="trading">Trading</option>
                <option value="paiement">Paiement</option>
                <option value="retrait">Retrait</option>
                <option value="sécurité">Sécurité</option>
                <option value="programme">Programme</option>
                <option value="general">Général</option>
              </select>
            </div>
            <textarea value={faqAnswer} onChange={(e) => setFaqAnswer(e.target.value)} placeholder="Réponse..." rows={3} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none" />
            <div className="flex gap-2">
              <button onClick={saveFaq} disabled={saving} className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-500 rounded-xl hover:bg-blue-600 disabled:opacity-50">
                {saving ? "..." : editFaqId ? "✏️ Modifier" : "➕ Ajouter"}
              </button>
              {editFaqId && (
                <button onClick={() => { setEditFaqId(null); setFaqQuestion(""); setFaqAnswer(""); }} className="px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">
                  Annuler
                </button>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-900">📋 {faqs.length} questions</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {faqs.map((f) => (
                <div key={f.id} className="px-6 py-4 flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 bg-slate-100 rounded-full text-slate-500">{f.category}</span>
                    </div>
                    <p className="font-medium text-sm text-slate-900">{f.question}</p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{f.answer}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => { setEditFaqId(f.id); setFaqQuestion(f.question); setFaqAnswer(f.answer); setFaqCategory(f.category); }} className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">✏️</button>
                    <button onClick={() => deleteFaq(f.id)} className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ONBOARDING TAB ── */}
      {tab === "onboarding" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <h2 className="font-bold text-slate-900">
              {editOnbId ? "✏️ Modifier" : "➕ Ajouter"} une étape
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Titre *</label>
                <input value={onbTitle} onChange={(e) => setOnbTitle(e.target.value)} placeholder="Titre de l'étape" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Icône (emoji)</label>
                <input value={onbIcon} onChange={(e) => setOnbIcon(e.target.value)} placeholder="📘" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
              <textarea value={onbDesc} onChange={(e) => setOnbDesc(e.target.value)} rows={2} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">URL vidéo YouTube</label>
                <input value={onbVideo} onChange={(e) => setOnbVideo(e.target.value)} placeholder="https://youtu.be/..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Lien externe</label>
                <input value={onbLink} onChange={(e) => setOnbLink(e.target.value)} placeholder="https://..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Label du bouton lien</label>
              <input value={onbLinkLabel} onChange={(e) => setOnbLinkLabel(e.target.value)} placeholder="S'inscrire maintenant" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <div className="flex gap-2">
              <button onClick={saveOnboarding} disabled={saving} className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-500 rounded-xl hover:bg-blue-600 disabled:opacity-50">
                {saving ? "..." : editOnbId ? "✏️ Modifier" : "➕ Ajouter"}
              </button>
              {editOnbId && (
                <button onClick={() => { setEditOnbId(null); setOnbTitle(""); setOnbDesc(""); setOnbVideo(""); setOnbLink(""); setOnbLinkLabel(""); setOnbIcon(""); }} className="px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">
                  Annuler
                </button>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-900">📋 {steps.length} étapes</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {steps.map((s) => (
                <div key={s.id} className="px-6 py-4 flex items-start gap-4">
                  <span className="text-2xl">{s.icon || `#${s.stepNumber}`}</span>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-slate-900">
                      Étape {s.stepNumber}: {s.title}
                    </p>
                    {s.description && <p className="text-xs text-slate-500 mt-1">{s.description}</p>}
                    {s.videoUrl && <p className="text-xs text-blue-500 mt-1">🎥 {s.videoUrl}</p>}
                    {s.linkUrl && <p className="text-xs text-green-500 mt-1">🔗 {s.linkLabel || s.linkUrl}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => { setEditOnbId(s.id); setOnbTitle(s.title); setOnbDesc(s.description || ""); setOnbVideo(s.videoUrl || ""); setOnbLink(s.linkUrl || ""); setOnbLinkLabel(s.linkLabel || ""); setOnbIcon(s.icon || ""); setOnbNum(s.stepNumber); }} className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">✏️</button>
                    <button onClick={() => deleteOnboarding(s.id)} className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
