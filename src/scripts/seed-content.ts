import "dotenv/config";
import { db } from "../db";
import { countdowns, siteConfig, faqs, onboardingSteps, projects } from "../db/schema";
import { sql } from "drizzle-orm";

async function seedContent() {
  console.log("🌱 Seeding content (countdown, config, FAQ, onboarding)...");

  // ── Countdown ──
  const existingCountdown = await db.execute(
    sql`SELECT COUNT(*)::int as count FROM countdowns`
  );
  const cdCount = (existingCountdown.rows[0] as { count: number }).count;
  if (cdCount === 0) {
    await db.insert(countdowns).values({
      title: "🚀 Lancement du Programme GoLite",
      targetDate: new Date("2026-05-01T00:00:00Z"),
      active: true,
      message: "Rejoignez la communauté avant le lancement officiel !",
    });
    console.log("  ✅ Countdown créé (1er mai 2026)");
  }

  // ── Site Config ──
  const configs = [
    { key: "wallet_trc20", value: "TPYgjvcLB5Jps5zEmMPgRK8xHXip5iVuyJ", category: "payment" },
    { key: "moncash_name", value: "Joseph Renato", category: "payment" },
    { key: "moncash_phone", value: "+50931959375", category: "payment" },
    { key: "pocket_option_link", value: "https://u3.shortink.io/register?utm_campaign=815190&utm_source=affiliate&utm_medium=sr&a=wwZbShSH8vSKIt&al=1752471&ac=golitecommunitybonus&cid=951966&code=WELCOME50", category: "links" },
    { key: "youtube_trading_basics", value: "https://youtu.be/MGv_R_1EC6A?si=J-YoIhOqv1Umq1uu", category: "links" },
    { key: "youtube_inscription_po", value: "https://youtu.be/XZbrdGCSUxA?si=5Nq_wskAPOj6O0X4", category: "links" },
    { key: "youtube_wallet", value: "https://youtu.be/oIgmmZxlgp8?si=AhbLgGrvjzOExcHA", category: "links" },
    { key: "support_link", value: "https://t.me/golitecommunity", category: "links" },
    { key: "program_active", value: "true", category: "program" },
  ];

  for (const c of configs) {
    const existing = await db.execute(
      sql`SELECT COUNT(*)::int as count FROM site_config WHERE key = ${c.key}`
    );
    if ((existing.rows[0] as { count: number }).count === 0) {
      await db.insert(siteConfig).values(c);
    }
  }
  console.log("  ✅ Site config créé");

  // ── FAQ ──
  const existingFaq = await db.execute(
    sql`SELECT COUNT(*)::int as count FROM faqs`
  );
  if ((existingFaq.rows[0] as { count: number }).count === 0) {
    await db.insert(faqs).values([
      { question: "Comment s'inscrire sur GoLite ?", answer: "Allez sur la page d'inscription, remplissez vos informations (nom, prénom, email, mot de passe) et cliquez sur Créer mon compte. Vous recevrez une confirmation immédiate.", category: "inscription", order: 1 },
      { question: "Comment commencer le trading ?", answer: "Commencez par la section Onboarding. Regardez la vidéo de base du trading, puis inscrivez-vous sur Pocket Option avec notre lien de parrainage pour recevoir un bonus.", category: "trading", order: 2 },
      { question: "Quelles sont les méthodes de paiement acceptées ?", answer: "Nous acceptons Binance, Crypto (TRC20/ERC20) et Zelle. MonCash et NatCash sont temporairement indisponibles. Le wallet TRC20 est disponible dans la section paiement.", category: "paiement", order: 3 },
      { question: "Comment effectuer un retrait ?", answer: "Après validation de votre investissement par l'équipe, vous recevrez vos fonds sur la plateforme de réception choisie. Les délais sont de 1 à 3 jours ouvrés.", category: "retrait", order: 4 },
      { question: "Mes données sont-elles sécurisées ?", answer: "Oui. Toutes les données sont chiffrées, l'authentification est sécurisée avec token, et les preuves de paiement sont stockées de manière protégée. Nous ne partageons jamais vos informations.", category: "sécurité", order: 5 },
      { question: "Comment fonctionne le programme GoLite ?", answer: "GoLite est une plateforme éducative qui vous accompagne dans votre parcours de trading. Vous avez accès à des formations, un système de parrainage, et un support communautaire actif.", category: "programme", order: 6 },
      { question: "Qu'est-ce que le wallet TRC20 ?", answer: "Le wallet TRC20 est une adresse sur le réseau TRON utilisée pour recevoir des cryptomonnaies comme USDT. Vous la trouverez dans la section Paiement de votre dashboard.", category: "paiement", order: 7 },
      { question: "Comment contacter le support ?", answer: "Vous pouvez nous contacter via Telegram (@golitecommunity) ou通过 les notifications dans votre dashboard. Notre équipe répond sous 24h.", category: "programme", order: 8 },
    ]);
    console.log("  ✅ FAQ créé (8 questions)");
  }

  // ── Onboarding Steps ──
  const existingOnb = await db.execute(
    sql`SELECT COUNT(*)::int as count FROM onboarding_steps`
  );
  if ((existingOnb.rows[0] as { count: number }).count === 0) {
    await db.insert(onboardingSteps).values([
      {
        stepNumber: 1,
        title: "Base du trading",
        description: "Apprenez les fondamentaux du trading avec cette vidéo complète. Vous comprendrez les concepts de base avant de commencer.",
        videoUrl: "https://youtu.be/MGv_R_1EC6A?si=J-YoIhOqv1Umq1uu",
        icon: "📘",
      },
      {
        stepNumber: 2,
        title: "Inscription Pocket Option",
        description: "Créez votre compte sur Pocket Option via notre lien de parrainage pour recevoir un bonus de bienvenue de 50%.",
        videoUrl: "https://youtu.be/XZbrdGCSUxA?si=5Nq_wskAPOj6O0X4",
        linkUrl: "https://u3.shortink.io/register?utm_campaign=815190&utm_source=affiliate&utm_medium=sr&a=wwZbShSH8vSKIt&al=1752471&ac=golitecommunitybonus&cid=951966&code=WELCOME50",
        linkLabel: "S'inscrire sur Pocket Option",
        icon: "🪪",
      },
      {
        stepNumber: 3,
        title: "Création portefeuille crypto",
        description: "Créez votre portefeuille crypto (Binance ou autre) pour gérer vos fonds et effectuer des dépôts/retraits.",
        videoUrl: "https://youtu.be/oIgmmZxlgp8?si=AhbLgGrvjzOExcHA",
        icon: "💳",
      },
    ]);
    console.log("  ✅ Onboarding steps créé (3 étapes)");
  }

  // ── Default Project ──
  const existingProjects = await db.execute(
    sql`SELECT COUNT(*)::int as count FROM projects`
  );
  if ((existingProjects.rows[0] as { count: number }).count === 0) {
    // Get the countdown ID to link
    const cdResult = await db.execute(
      sql`SELECT id FROM countdowns LIMIT 1`
    );
    const cdId = cdResult.rows[0] ? (cdResult.rows[0] as { id: string }).id : null;

    await db.insert(projects).values({
      name: "Projet GoLite Mai 2026",
      description: "Premier projet d'investissement communautaire GoLite. Rejoignez-nous pour construire ensemble un avenir financier solide. Les fonds collectés serviront au lancement du programme éducatif trading.",
      targetAmount: "2000",
      startDate: new Date("2026-04-24T00:00:00Z"),
      endDate: new Date("2026-05-01T00:00:00Z"),
      status: "active",
      countdownId: cdId,
      active: true,
    });
    console.log("  ✅ Projet par défaut créé");
  }

  console.log("\n🎉 Content seeding terminé !");
}

seedContent()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
  });
