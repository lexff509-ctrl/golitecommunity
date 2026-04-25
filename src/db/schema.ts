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

// ── Users ──────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  role: varchar("role", { length: 20 }).notNull().default("client"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Sessions ───────────────────────────────────────
export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Projects ───────────────────────────────────────
export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  targetAmount: decimal("target_amount", { precision: 12, scale: 2 }).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("upcoming"),
  // upcoming | active | completed
  countdownId: uuid("countdown_id").references(() => countdowns.id),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Payments ───────────────────────────────────────
export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  transactionId: varchar("transaction_id", { length: 20 }).notNull().unique(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
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

// ── Notifications ──────────────────────────────────
export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 30 }).notNull().default("info"),
  read: boolean("read").notNull().default(false),
  link: text("link"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Admin Logs ─────────────────────────────────────
export const adminLogs = pgTable("admin_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  adminId: uuid("admin_id")
    .notNull()
    .references(() => users.id),
  paymentId: uuid("payment_id")
    .notNull()
    .references(() => payments.id),
  action: varchar("action", { length: 50 }).notNull(),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Countdown ──────────────────────────────────────
export const countdowns = pgTable("countdowns", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull().default("Lancement du programme"),
  targetDate: timestamp("target_date").notNull().default(new Date("2026-05-01T00:00:00Z")),
  active: boolean("active").notNull().default(true),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Site Config ────────────────────────────────────
export const siteConfig = pgTable("site_config", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  category: varchar("category", { length: 50 }).notNull().default("general"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── FAQ ────────────────────────────────────────────
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

// ── Onboarding Steps ───────────────────────────────
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
