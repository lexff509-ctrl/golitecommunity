"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api-client";

type Project = {
  id: string;
  name: string;
  description: string | null;
  targetAmount: string;
  collectedAmount: string;
  startDate: string;
  endDate: string;
  status: string;
  active: boolean;
  countdownId: string | null;
  paymentCount: number;
  createdAt: string;
};

const toSafeNumber = (value: unknown): number => {
  const num = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
};

const toDateTimeLocal = (value: unknown): string => {
  if (!value) return "";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};

const toDateLabel = (value: unknown): string => {
  if (!value) return "";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("fr-FR");
};

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("upcoming");

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/admin/projects");
      const data = await res.json();
      setProjects(data.projects || []);
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, []);

  const showMsg = (m: string) => {
    setMessage(m);
    setTimeout(() => setMessage(""), 3000);
  };

  const resetForm = () => {
    setName(""); setDescription(""); setTargetAmount("");
    setStartDate(""); setEndDate(""); setStatus("upcoming");
    setEditId(null); setShowForm(false);
  };

  const startEdit = (p: Project) => {
    setEditId(p.id);
    setName(p.name);
    setDescription(p.description || "");
    setTargetAmount(String(p.targetAmount ?? ""));
    setStartDate(toDateTimeLocal(p.startDate));
    setEndDate(toDateTimeLocal(p.endDate));
    setStatus(p.status);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!name || !targetAmount || !startDate || !endDate) return;
    setSaving(true);
    const body = { name, description, targetAmount, startDate, endDate, status };
    if (editId) {
      await apiFetch(`/api/admin/projects/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      showMsg("✅ Projet mis à jour");
    } else {
      await apiFetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      showMsg("✅ Projet créé");
    }
    resetForm();
    setSaving(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce projet ?")) return;
    const res = await apiFetch(`/api/admin/projects/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { showMsg(`❌ ${data.error}`); return; }
    showMsg("✅ Projet supprimé");
    load();
  };

  const toggleActive = async (p: Project) => {
    await apiFetch(`/api/admin/projects/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !p.active }),
    });
    load();
  };

  const totalTarget = projects.reduce((s, p) => s + toSafeNumber(p.targetAmount), 0);
  const totalCollected = projects.reduce((s, p) => s + toSafeNumber(p.collectedAmount), 0);

  const STATUS_COLORS: Record<string, string> = {
    upcoming: "bg-slate-100 text-slate-700",
    active: "bg-green-100 text-green-700",
    completed: "bg-blue-100 text-blue-700",
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">📁 Gestion des Projets</h1>
          <p className="text-slate-500 mt-1">Créez et gérez les projets d&apos;investissement</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-500 rounded-xl hover:bg-blue-600">
          {showForm ? "✕ Annuler" : "➕ Nouveau projet"}
        </button>
      </div>

      {message && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm animate-scale-in">{message}</div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-2xl p-5">
          <p className="text-2xl font-bold text-slate-900">{projects.length}</p>
          <p className="text-sm text-slate-500">Projets</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-5">
          <p className="text-2xl font-bold text-green-700">${totalCollected.toLocaleString()}</p>
          <p className="text-sm text-slate-500">Collecté</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-5">
          <p className="text-2xl font-bold text-blue-700">${totalTarget.toLocaleString()}</p>
          <p className="text-sm text-slate-500">Objectif total</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-2xl p-5">
          <p className="text-2xl font-bold text-amber-700">${(totalTarget - totalCollected).toLocaleString()}</p>
          <p className="text-sm text-slate-500">Restant</p>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 animate-fade-in">
          <h2 className="font-bold text-slate-900">{editId ? "✏️ Modifier le projet" : "➕ Nouveau projet"}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Nom *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="Ex: Projet Mai 2026" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Objectif ($) *</label>
              <input type="number" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="2000" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Date début *</label>
              <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Date fin *</label>
              <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Statut</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                <option value="upcoming">À venir</option>
                <option value="active">Actif</option>
                <option value="completed">Terminé</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none" placeholder="Description du projet..." />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-500 rounded-xl hover:bg-blue-600 disabled:opacity-50">
              {saving ? "..." : editId ? "✏️ Modifier" : "➕ Créer"}
            </button>
            <button onClick={resetForm} className="px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">Annuler</button>
          </div>
        </div>
      )}

      {/* Projects List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-slate-500">Aucun projet. Créez-en un !</p>
        </div>
      ) : (
        <div className="space-y-4 stagger-children">
          {projects.map((p) => {
            const collected = toSafeNumber(p.collectedAmount);
            const target = toSafeNumber(p.targetAmount);
            const remaining = Math.max(0, target - collected);
            const pct = target > 0 ? Math.min(100, (collected / target) * 100) : 0;

            return (
              <div key={p.id} className={`bg-white border rounded-2xl p-6 card-hover ${p.active ? "border-green-200" : "border-slate-200 opacity-60"}`}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold text-slate-900">{p.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[p.status] || "bg-slate-100"}`}>
                        {p.status === "upcoming" ? "À venir" : p.status === "active" ? "Actif" : "Terminé"}
                      </span>
                    </div>
                    {p.description && <p className="text-sm text-slate-500 mb-3">{p.description}</p>}

                    {/* Progress */}
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold text-green-600">${collected.toLocaleString()} collectés</span>
                        <span className="text-slate-500">Objectif: ${target.toLocaleString()}</span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex justify-between text-xs text-slate-400 mt-1">
                        <span>{pct.toFixed(1)}%</span>
                        <span>Reste: ${remaining.toLocaleString()}</span>
                        <span>{p.paymentCount} paiement{p.paymentCount > 1 ? "s" : ""}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span>
                        {toDateLabel(p.startDate) && toDateLabel(p.endDate)
                          ? `📅 ${toDateLabel(p.startDate)} → ${toDateLabel(p.endDate)}`
                          : ""}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <button onClick={() => toggleActive(p)} className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${p.active ? "bg-green-50 text-green-700 hover:bg-green-100" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                      {p.active ? "🟢 Actif" : "⚫ Inactif"}
                    </button>
                    <button onClick={() => startEdit(p)} className="px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">✏️ Modifier</button>
                    <button onClick={() => handleDelete(p.id)} className="px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-700 rounded-lg hover:bg-red-100">🗑️ Supprimer</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
