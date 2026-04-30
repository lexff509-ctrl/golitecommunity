import { NextResponse } from "next/server";
import { db } from "@/db";
import { countdowns, settings, faqs, onboardingSteps } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const countdown = await db
      .select()
      .from(countdowns)
      .where(eq(countdowns.active, true))
      .limit(1);

    const config = await db.select().from(settings);

    const faqList = await db
      .select()
      .from(faqs)
      .where(eq(faqs.active, true))
      .orderBy(asc(faqs.order));

    const steps = await db
      .select()
      .from(onboardingSteps)
      .where(eq(onboardingSteps.active, true))
      .orderBy(asc(onboardingSteps.step_number));

    const configMap: Record<string, string> = {};
    config.forEach((c) => {
      configMap[c.key] = c.value || "";
    });

    const normalizedCountdown = countdown[0]
      ? {
          id: countdown[0].id,
          title: countdown[0].title,
          targetDate: countdown[0].target_date
            ? new Date(countdown[0].target_date).toISOString()
            : "",
          active: countdown[0].active,
          message: countdown[0].message,
        }
      : null;

    const normalizedFaq = faqList.map((f) => ({
      id: f.id,
      question: f.question,
      answer: f.answer,
      category: f.category,
      order: f.order,
    }));

    const normalizedOnboarding = steps.map((s) => ({
      id: s.id,
      stepNumber: s.step_number,
      title: s.title,
      description: s.description,
      videoUrl: s.video_url,
      linkUrl: s.link_url,
      linkLabel: s.link_label,
      icon: s.icon,
    }));

    return NextResponse.json({
      countdown: normalizedCountdown,
      config: configMap,
      faq: normalizedFaq,
      onboarding: normalizedOnboarding,
    });
  } catch (error) {
    console.error("Public config error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
