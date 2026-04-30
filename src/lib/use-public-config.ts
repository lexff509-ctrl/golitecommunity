"use client";

import { useState, useEffect } from "react";

export type PublicProject = {
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
};

export type PublicConfig = {
  countdown: {
    id: string;
    title: string;
    targetDate: string;
    active: boolean;
    message: string | null;
  } | null;
  config: Record<string, string>;
  faq: {
    id: string;
    question: string;
    answer: string;
    category: string;
    order: number;
  }[];
  onboarding: {
    id: string;
    stepNumber: number;
    title: string;
    description: string | null;
    videoUrl: string | null;
    linkUrl: string | null;
    linkLabel: string | null;
    icon: string | null;
  }[];
  projects: PublicProject[];
};

export function usePublicConfig() {
  const [data, setData] = useState<PublicConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/public/config").then((r) => r.json()),
      fetch("/api/projects").then((r) => r.json()),
    ])
      .then(([cfg, proj]) => {
        const projects = Array.isArray(proj?.projects) ? proj.projects : [];
        const normalizedProjects = projects.map((project: Record<string, unknown>) => {
          const targetAmount =
            project.targetAmount ?? project.goalAmount ?? project.currentAmount ?? "0";
          return {
            id: String(project.id ?? ""),
            name: String(project.name ?? ""),
            description: (project.description as string | null) ?? null,
            targetAmount: String(targetAmount ?? "0"),
            collectedAmount: String(project.collectedAmount ?? "0"),
            startDate: String(project.startDate ?? project.createdAt ?? ""),
            endDate: String(project.endDate ?? project.createdAt ?? ""),
            status: String(project.status ?? "active"),
            active: Boolean(project.active),
            countdownId: (project.countdownId as string | null) ?? null,
          };
        });

        setData({ ...cfg, projects: normalizedProjects });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}
