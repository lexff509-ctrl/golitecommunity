import {
  pgTable,
  uuid,
  varchar,
  text,
  decimal,
  timestamp,
  boolean,
  jsonb,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ── Users ──────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  first_name: varchar("first_name", { length: 100 }).notNull(),
  last_name: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password_hash: text("password_hash").notNull(),
  role: varchar("role", { length: 20 }).notNull().default("client"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// ── Sessions ───────────────────────────────────────
export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expires_at: timestamp("expires_at").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// ── Programs ───────────────────────────────────────
export const programs = pgTable("programs", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  min_amount: decimal("min_amount", { precision: 10, scale: 2 }).notNull(),
  max_amount: decimal("max_amount", { precision: 10, scale: 2 }).notNull(),
  multipliers: jsonb("multipliers").notNull(),
  active: boolean("active").notNull().default(false),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
},
(program) => ({
  idx_active: index("idx_program_active").on(program.active),
}));

// ── Investments ────────────────────────────────────
export const investments = pgTable("investments", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  program_id: uuid("program_id").notNull().references(() => programs.id, { onDelete: "restrict" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  gain: decimal("gain", { precision: 10, scale: 2 }).notNull(),
  expected_return: decimal("expected_return", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  idempotency_key: varchar("idempotency_key", { length: 64 }).unique(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
},
(investment) => ({
  idx_user: index("idx_investment_user").on(investment.user_id),
  idx_program: index("idx_investment_program").on(investment.program_id),
  idx_idempotency: uniqueIndex("idx_investment_idempotency").on(investment.idempotency_key),
}));

// ── Payments ───────────────────────────────────────
export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  transaction_id: varchar("transaction_id", { length: 32 }).notNull().unique(),
  reference_code: varchar("reference_code", { length: 32 }).notNull().unique(),
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  project_id: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  first_name: varchar("first_name", { length: 100 }).notNull(),
  last_name: varchar("last_name", { length: 100 }).notNull(),
  method: varchar("method", { length: 30 }).notNull(),
  amount_usd: decimal("amount_usd", { precision: 10, scale: 2 }).notNull(),
  amount_htg: decimal("amount_htg", { precision: 12, scale: 2 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  proof_url: text("proof_url").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  type: varchar("type", { length: 20 }).notNull().default("payment"),
  related_id: uuid("related_id"),
  ip_address: varchar("ip_address", { length: 45 }),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
},
(payment) => ({
  idx_user: index("idx_payment_user").on(payment.user_id),
  idx_project: index("idx_payment_project").on(payment.project_id),
  idx_related: index("idx_payment_related").on(payment.related_id),
  unique_reference: uniqueIndex("unique_reference_code").on(payment.reference_code),
  unique_transaction: uniqueIndex("unique_transaction_id").on(payment.transaction_id),
}));

// ── CryptoTransactions ─────────────────────────────
export const cryptoTransactions = pgTable("crypto_transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount_htg: decimal("amount_htg", { precision: 12, scale: 2 }).notNull(),
  amount_usd: decimal("amount_usd", { precision: 12, scale: 2 }).notNull(),
  crypto_type: varchar("crypto_type", { length: 10 }).notNull(),
  network: varchar("network", { length: 10 }).notNull(),
  wallet_address: varchar("wallet_address", { length: 100 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
},
(crypto) => ({
  idx_user: index("idx_crypto_user").on(crypto.user_id),
}));

// ── Settings ───────────────────────────────────────
export const settings = pgTable("settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// ── AdminLogs ──────────────────────────────────────
export const adminLogs = pgTable("admin_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  admin_id: uuid("admin_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  action: varchar("action", { length: 50 }).notNull(),
  target_type: varchar("target_type", { length: 20 }).notNull(),
  target_id: uuid("target_id").notNull(),
  details: jsonb("details"),
  created_at: timestamp("created_at").defaultNow().notNull(),
},
(log) => ({
  idx_admin: index("idx_adminlog_admin").on(log.admin_id),
  idx_target: index("idx_adminlog_target").on(log.target_type, log.target_id),
}));

// ── Notifications ──────────────────────────────────
export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 30 }).notNull().default("info"),
  read: boolean("read").notNull().default(false),
  link: text("link"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// ── Countdown ──────────────────────────────────────
export const countdowns = pgTable("countdowns", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull().default("Lancement du programme"),
  target_date: timestamp("target_date").notNull().default(new Date("2026-05-01T00:00:00Z")),
  active: boolean("active").notNull().default(true),
  message: text("message"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// ── FAQ ────────────────────────────────────────────
export const faqs = pgTable("faqs", {
  id: uuid("id").defaultRandom().primaryKey(),
  question: varchar("question", { length: 500 }).notNull(),
  answer: text("answer").notNull(),
  category: varchar("category", { length: 50 }).notNull().default("general"),
  order: integer("order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// ── Onboarding Steps ───────────────────────────────
export const onboardingSteps = pgTable("onboarding_steps", {
  id: uuid("id").defaultRandom().primaryKey(),
  step_number: integer("step_number").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  video_url: varchar("video_url", { length: 500 }),
  link_url: varchar("link_url", { length: 500 }),
  link_label: varchar("link_label", { length: 255 }),
  icon: varchar("icon", { length: 50 }),
  active: boolean("active").notNull().default(true),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// ── Projects ───────────────────────────────────────
export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  goal_amount: decimal("goal_amount", { precision: 12, scale: 2 }).notNull(),
  current_amount: decimal("current_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  image_url: text("image_url"),
  active: boolean("active").notNull().default(true),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
},
(project) => ({
  idx_status: index("idx_project_status").on(project.status),
  idx_active: index("idx_project_active").on(project.active),
}));

// ── Rate Limits ─────────────────────────────────────
export const rateLimits = pgTable("rate_limits", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  count: integer("count").notNull().default(1),
  window_start: timestamp("window_start").notNull(),
  window_end: timestamp("window_end").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
},
(rateLimit) => ({
  idx_key: index("idx_rate_limits_key").on(rateLimit.key),
  idx_window: index("idx_rate_limits_window").on(rateLimit.window_end),
}));
