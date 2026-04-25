"use client";

import { useState } from "react";
import { usePublicConfig } from "@/lib/use-public-config";
import { apiFetch } from "@/lib/api-client";

function YouTubeEmbed({ url }: { url: string }) {
  // Convert youtu.be URLs to embed URLs
  let videoId = "";
  if (url.includes("youtu.be/")) {
    videoId = url.split("youtu.be/")[1]?.split("?")[0] || "";
  } else if (url.includes("v=")) {
    videoId = url.split("v=")[1]?.split("&")[0] || "";
  }
  if (!videoId) return null;
  return (
    <div className="relative w-full pt-[56.25%] rounded-xl overflow-hidden bg-black">
      <iframe
        className="absolute inset-0 w-full h-full"
        src={`https://www.youtube.com/embed/${videoId}`}
        title="Vidéo"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

export default function OnboardingPage() {
  const { data, loading } = usePublicConfig();
  const [activeStep, setActiveStep] = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);

  const steps = data?.onboarding || [];

  const markComplete = (stepNum: number) => {
    if (!completed.includes(stepNum)) {
      setCompleted([...completed, stepNum]);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          🚀 Start Here — Onboarding
        </h1>
        <p className="text-slate-500 mt-1">
          Suivez chaque étape pour démarrer votre parcours trading
        </p>
      </div>

      {/* Progress bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-slate-600">Progression</span>
          <span className="text-sm font-bold text-green-600">
            {completed.length}/{steps.length}
          </span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-500"
            style={{
              width: `${steps.length > 0 ? (completed.length / steps.length) * 100 : 0}%`,
            }}
          />
        </div>
        <div className="flex gap-2 mt-4">
          {steps.map((step, i) => (
            <button
              key={step.id}
              onClick={() => setActiveStep(i)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                activeStep === i
                  ? "bg-green-500 text-white"
                  : completed.includes(step.stepNumber)
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-slate-50 text-slate-500 border border-slate-200"
              }`}
            >
              {completed.includes(step.stepNumber) ? "✓" : step.icon || `${i + 1}`}
            </button>
          ))}
        </div>
      </div>

      {/* Active step */}
      {steps[activeStep] && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">{steps[activeStep].icon || "📘"}</span>
            <div>
              <span className="text-xs text-slate-400 font-medium">
                ÉTAPE {steps[activeStep].stepNumber}/{steps.length}
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                {steps[activeStep].title}
              </h2>
            </div>
          </div>

          {steps[activeStep].description && (
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              {steps[activeStep].description}
            </p>
          )}

          {/* Video */}
          {steps[activeStep].videoUrl && (
            <div className="mb-6">
              <YouTubeEmbed url={steps[activeStep].videoUrl!} />
            </div>
          )}

          {/* Link */}
          {steps[activeStep].linkUrl && (
            <a
              href={steps[activeStep].linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all mb-4"
            >
              {steps[activeStep].linkLabel || "Lien externe"}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200">
            <button
              onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
              disabled={activeStep === 0}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-40"
            >
              ← Précédent
            </button>

            <div className="flex gap-2">
              {!completed.includes(steps[activeStep].stepNumber) && (
                <button
                  onClick={() => markComplete(steps[activeStep].stepNumber)}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-green-500 rounded-xl hover:bg-green-600 transition-colors"
                >
                  ✓ Terminé
                </button>
              )}
              {activeStep < steps.length - 1 && (
                <button
                  onClick={() => setActiveStep(activeStep + 1)}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-green-500 to-blue-600 rounded-xl hover:opacity-90 transition-all"
                >
                  Suivant →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {steps.length === 0 && (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-slate-500">Aucun contenu d&apos;onboarding disponible</p>
        </div>
      )}
    </div>
  );
}
