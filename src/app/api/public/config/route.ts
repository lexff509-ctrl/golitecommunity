import { NextResponse } from "next/server";
import { db } from "@/db";
import { countdowns, siteConfig, faqs, onboardingSteps } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const countdown = await db
      .select()
      .from(countdowns)
      .where(eq(countdowns.active, true))
      .limit(1);

    const config = await db.select().from(siteConfig);

    const faqList = await db
      .select()
      .from(faqs)
      .where(eq(faqs.active, true))
      .orderBy(asc(faqs.order));

    const steps = await db
      .select()
      .from(onboardingSteps)
      .where(eq(onboardingSteps.active, true))
      .orderBy(asc(onboardingSteps.stepNumber));

    const configMap: Record<string, string> = {};
    config.forEach((c) => {
      configMap[c.key] = c.value || "";
    });

    return NextResponse.json({
      countdown: countdown[0] || null,
      config: configMap,
      faq: faqList,
      onboarding: steps,
    });
  } catch (error) {
    console.error("Public config error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
