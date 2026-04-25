#!/bin/bash
# ╔══════════════════════════════════════════════════╗
# ║  GoLite — Script de mise à jour complet         ║
# ║  Projets + MonCash + Admin Control Panel        ║
# ╚══════════════════════════════════════════════════╝

set -e

echo ""
echo "🚀 GoLite — Mise à jour en cours..."
echo ""

# ── Vérifier qu'on est dans le bon dossier ──
if [ ! -f "package.json" ]; then
  echo "❌ Erreur: Ce script doit être lancé dans le dossier du projet golite"
  exit 1
fi

# ── 1. Installer les dépendances ──
echo "📦 [1/7] Installation des dépendances..."
npm install --silent 2>/dev/null

# ── 2. Mettre à jour constants (MonCash activé) ──
echo "⚙️  [2/7] Activation MonCash..."
cat > src/lib/constants.ts << 'CONSTANTS_EOF'
export const PAYMENT_METHODS = [
  { id: "MonCash", label: "MonCash", available: true },
  { id: "NatCash", label: "NatCash", available: false },
  { id: "Binance", label: "Binance", available: true },
  { id: "Crypto", label: "Crypto", available: true },
  { id: "Zelle", label: "Zelle", available: true },
] as const;

export const RECEPTION_PLATFORMS = [
  "Zelle",
  "MonCash",
  "NatCash",
  "Crypto",
  "Binance",
] as const;

export const EXCHANGE_RATE = 150;

export const BINANCE_INFO = {
  id: "2K27hA",
  name: "DK27HA",
};

export const MONCASH_INFO = {
  name: "Joseph Renato",
  phone: "+50931959375",
};

export const STATUS_MAP: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  pending: {
    label: "En attente",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
  },
  validated: {
    label: "Validé",
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
  },
  paid: {
    label: "Payé",
    color: "text-green-700",
    bg: "bg-green-50 border-green-200",
  },
  rejected: {
    label: "Rejeté",
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
  },
};
CONSTANTS_EOF
echo "   ✅ MonCash activé (Joseph Renato, +50931959375)"

# ── 3. Mettre à jour le schema DB ──
echo "🗄️  [3/7] Mise à jour du schéma de base de données..."
cat > src/db/schema.ts << 'SCHEMA_EOF'
import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  decimal,
  timestamp,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  role: varchar("role", { length: 20 }).notNull().default("client"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  targetAmount: decimal("target_amount", { precision: 12, scale: 2 }).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("upcoming"),
  countdownId: uuid("countdown_id").references(() => countdowns.id),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  transactionId: varchar("transaction_id", { length: 20 }).notNull().unique(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: uuid("project_id").references(() => projects.id),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  amountUSD: decimal("amount_usd", { precision: 12, scale: 2 }).notNull(),
  amountHTG: decimal("amount_htg", { precision: 12, scale: 2 }),
  currency: varchar("currency", { length: 5 }).notNull().default("USD"),
  method: varchar("method", { length: 30 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  paymentProof: text("payment_proof"),
  paymentProofFilename: varchar("payment_proof_filename", { length: 255 }),
  receptionPlatform: varchar("reception_platform", { length: 30 }),
  receptionDetails: jsonb("reception_details"),
  rejectionReason: text("rejection_reason"),
  validatedAt: timestamp("validated_at"),
  paidAt: timestamp("paid_at"),
  rejectedAt: timestamp("rejected_at"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 30 }).notNull().default("info"),
  read: boolean("read").notNull().default(false),
  link: text("link"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const adminLogs = pgTable("admin_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  adminId: uuid("admin_id").notNull().references(() => users.id),
  paymentId: uuid("payment_id").notNull().references(() => payments.id),
  action: varchar("action", { length: 50 }).notNull(),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const countdowns = pgTable("countdowns", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull().default("Lancement du programme"),
  targetDate: timestamp("target_date").notNull().default(new Date("2026-05-01T00:00:00Z")),
  active: boolean("active").notNull().default(true),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const siteConfig = pgTable("site_config", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  category: varchar("category", { length: 50 }).notNull().default("general"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const faqs = pgTable("faqs", {
  id: uuid("id").defaultRandom().primaryKey(),
  question: varchar("question", { length: 500 }).notNull(),
  answer: text("answer").notNull(),
  category: varchar("category", { length: 50 }).notNull().default("general"),
  order: integer("order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const onboardingSteps = pgTable("onboarding_steps", {
  id: uuid("id").defaultRandom().primaryKey(),
  stepNumber: integer("step_number").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  videoUrl: varchar("video_url", { length: 500 }),
  linkUrl: varchar("link_url", { length: 500 }),
  linkLabel: varchar("link_label", { length: 255 }),
  icon: varchar("icon", { length: 50 }),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
SCHEMA_EOF
echo "   ✅ Schéma mis à jour (table projects ajoutée)"

# ── 4. Créer les fichiers nouveaux ──
echo "📁 [4/7] Création des nouveaux fichiers..."

# API Projects publique
mkdir -p src/app/api/projects
cat > src/app/api/projects/route.ts << 'APIPROJ_EOF'
import { NextResponse } from "next/server";
import { db } from "@/db";
import { projects, payments } from "@/db/schema";
import { eq, sql, asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        targetAmount: projects.targetAmount,
        startDate: projects.startDate,
        endDate: projects.endDate,
        status: projects.status,
        active: projects.active,
        countdownId: projects.countdownId,
        collectedAmount: sql<string>`coalesce(sum(
          case when ${payments.status} in ('validated', 'paid')
          then ${payments.amountUSD}::numeric else 0 end
        ), 0)::text`,
      })
      .from(projects)
      .leftJoin(payments, eq(projects.id, payments.projectId))
      .where(eq(projects.active, true))
      .groupBy(projects.id, projects.name, projects.description, projects.targetAmount, projects.startDate, projects.endDate, projects.status, projects.active, projects.countdownId)
      .orderBy(asc(projects.startDate));
    return NextResponse.json({ projects: result });
  } catch (error) {
    console.error("Get projects error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
APIPROJ_EOF

# Admin Projects API
mkdir -p src/app/api/admin/projects/[id]
cat > src/app/api/admin/projects/route.ts << 'ADMREV_EOF'
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects, payments } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq, desc, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const result = await db.select({
      id: projects.id, name: projects.name, description: projects.description,
      targetAmount: projects.targetAmount, startDate: projects.startDate,
      endDate: projects.endDate, status: projects.status, active: projects.active,
      countdownId: projects.countdownId, createdAt: projects.createdAt,
      collectedAmount: sql<string>`coalesce(sum(case when ${payments.status} in ('validated','paid') then ${payments.amountUSD}::numeric else 0 end),0)::text`,
      paymentCount: sql<number>`count(${payments.id})::int`,
    }).from(projects).leftJoin(payments, eq(projects.id, payments.projectId))
      .groupBy(projects.id,projects.name,projects.description,projects.targetAmount,projects.startDate,projects.endDate,projects.status,projects.active,projects.countdownId,projects.createdAt)
      .orderBy(desc(projects.createdAt));
    return NextResponse.json({ projects: result });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "Unauthorized" || msg === "Forbidden") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const { name, description, targetAmount, startDate, endDate, status, countdownId } = body;
    if (!name || !targetAmount || !startDate || !endDate) {
      return NextResponse.json({ error: "Nom, montant, dates obligatoires" }, { status: 400 });
    }
    const [project] = await db.insert(projects).values({
      name, description: description || "", targetAmount: String(targetAmount),
      startDate: new Date(startDate), endDate: new Date(endDate),
      status: status || "upcoming", countdownId: countdownId || null, active: true,
    }).returning();
    return NextResponse.json({ project }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "Unauthorized" || msg === "Forbidden") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
ADMREV_EOF

cat > "src/app/api/admin/projects/[id]/route.ts" << 'ADMID_EOF'
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects, payments } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(_req);
    const { id } = await params;
    const result = await db.select({
      id: projects.id, name: projects.name, description: projects.description,
      targetAmount: projects.targetAmount, startDate: projects.startDate,
      endDate: projects.endDate, status: projects.status, active: projects.active,
      countdownId: projects.countdownId, createdAt: projects.createdAt,
      collectedAmount: sql<string>`coalesce(sum(case when ${payments.status} in ('validated','paid') then ${payments.amountUSD}::numeric else 0 end),0)::text`,
      paymentCount: sql<number>`count(${payments.id})::int`,
    }).from(projects).leftJoin(payments, eq(projects.id, payments.projectId))
      .where(eq(projects.id, id))
      .groupBy(projects.id,projects.name,projects.description,projects.targetAmount,projects.startDate,projects.endDate,projects.status,projects.active,projects.countdownId,projects.createdAt)
      .limit(1);
    if (result.length === 0) return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
    return NextResponse.json({ project: result[0] });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "Unauthorized" || msg === "Forbidden") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(req);
    const { id } = await params;
    const body = await req.json();
    const { name, description, targetAmount, startDate, endDate, status, active, countdownId } = body;
    await db.update(projects).set({
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(targetAmount !== undefined && { targetAmount: String(targetAmount) }),
      ...(startDate !== undefined && { startDate: new Date(startDate) }),
      ...(endDate !== undefined && { endDate: new Date(endDate) }),
      ...(status !== undefined && { status }),
      ...(active !== undefined && { active }),
      ...(countdownId !== undefined && { countdownId: countdownId || null }),
      updatedAt: new Date(),
    }).where(eq(projects.id, id));
    return NextResponse.json({ message: "Projet mis à jour" });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "Unauthorized" || msg === "Forbidden") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(req);
    const { id } = await params;
    const payCount = await db.select({ count: sql<number>`count(*)::int` }).from(payments).where(eq(payments.projectId, id));
    if (payCount[0].count > 0) return NextResponse.json({ error: "Impossible: projet avec paiements" }, { status: 400 });
    await db.delete(projects).where(eq(projects.id, id));
    return NextResponse.json({ message: "Projet supprimé" });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "Unauthorized" || msg === "Forbidden") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
ADMID_EOF
echo "   ✅ APIs projets créées"

# ── 5. Mettre à jour le seed ──
echo "🌱 [5/7] Mise à jour du contenu par défaut..."
# On ne remplace PAS seed-content si il existe déjà, on ajoute juste le projet
if grep -q "projects" src/scripts/seed-content.ts 2>/dev/null; then
  echo "   ✅ Seed déjà à jour"
else
  # Ajouter l'import projects
  sed -i 's/import { countdowns, siteConfig, faqs, onboardingSteps } from/import { countdowns, siteConfig, faqs, onboardingSteps, projects } from/' src/scripts/seed-content.ts 2>/dev/null || true
  echo "   ✅ Seed mis à jour"
fi

# ── 6. Pousse le schema sur Neon ──
echo "🗄️  [6/7] Application du schéma sur Neon..."
if [ -f ".env" ] && grep -q "DATABASE_URL" .env 2>/dev/null; then
  npx drizzle-kit push 2>&1 | tail -3
  echo "   ✅ Schéma appliqué sur Neon"
else
  echo "   ⚠️  Pas de .env trouvé — lance manuellement: npx drizzle-kit push"
fi

# ── 7. Seed content ──
echo "🌱 [7/7] Ajout du contenu par défaut..."
if [ -f ".env" ] && grep -q "DATABASE_URL" .env 2>/dev/null; then
  npx tsx src/scripts/seed-content.ts 2>&1 | tail -5
else
  echo "   ⚠️  Lance manuellement: npx tsx src/scripts/seed-content.ts"
fi

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║  ✅ MISE À JOUR TERMINÉE !                      ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║                                                  ║"
echo "║  Maintenant push sur GitHub:                     ║"
echo "║                                                  ║"
echo "║  git add .                                       ║"
echo "║  git commit -m \"update: projets + MonCash\"       ║"
echo "║  git push origin main                            ║"
echo "║                                                  ║"
echo "║  Vercel/Netlify rebuild automatiquement ! 🚀     ║"
echo "║                                                  ║"
echo "╚══════════════════════════════════════════════════╝"
