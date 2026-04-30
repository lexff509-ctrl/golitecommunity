import { pgTable, index, uniqueIndex, foreignKey, unique, uuid, varchar, numeric, text, jsonb, timestamp, integer, boolean } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const payments = pgTable("payments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	transactionId: varchar("transaction_id", { length: 20 }).notNull(),
	userId: uuid("user_id").notNull(),
	projectId: uuid("project_id"),
	firstName: varchar("first_name", { length: 100 }).notNull(),
	lastName: varchar("last_name", { length: 100 }).notNull(),
	amountUsd: numeric("amount_usd", { precision: 12, scale:  2 }).notNull(),
	amountHtg: numeric("amount_htg", { precision: 12, scale:  2 }),
	currency: varchar({ length: 5 }).default('USD').notNull(),
	method: varchar({ length: 30 }).notNull(),
	status: varchar({ length: 20 }).default('pending').notNull(),
	paymentProof: text("payment_proof"),
	paymentProofFilename: varchar("payment_proof_filename", { length: 255 }),
	receptionPlatform: varchar("reception_platform", { length: 30 }),
	receptionDetails: jsonb("reception_details"),
	rejectionReason: text("rejection_reason"),
	validatedAt: timestamp("validated_at", { mode: 'string' }),
	paidAt: timestamp("paid_at", { mode: 'string' }),
	rejectedAt: timestamp("rejected_at", { mode: 'string' }),
	adminNotes: text("admin_notes"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	referenceCode: varchar("reference_code", { length: 32 }),
	amount: numeric({ precision: 10, scale:  2 }),
	proofUrl: text("proof_url"),
	type: varchar({ length: 20 }).default('payment'),
	relatedId: uuid("related_id"),
	ipAddress: varchar("ip_address", { length: 45 }),
}, (table) => [
	index("idx_payments_project_id").using("btree", table.projectId.asc().nullsLast().op("uuid_ops")),
	index("idx_payments_related_id").using("btree", table.relatedId.asc().nullsLast().op("uuid_ops")),
	index("idx_payments_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("payments_reference_code_unique").using("btree", table.referenceCode.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "payments_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "payments_project_id_projects_id_fk"
		}),
	unique("payments_transaction_id_unique").on(table.transactionId),
]);

export const sessions = pgTable("sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	token: varchar({ length: 255 }).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "sessions_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("sessions_token_unique").on(table.token),
]);

export const faqs = pgTable("faqs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	question: varchar({ length: 500 }).notNull(),
	answer: text().notNull(),
	category: varchar({ length: 50 }).default('general').notNull(),
	order: integer().default(0).notNull(),
	active: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const onboardingSteps = pgTable("onboarding_steps", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	stepNumber: integer("step_number").notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	videoUrl: varchar("video_url", { length: 500 }),
	linkUrl: varchar("link_url", { length: 500 }),
	linkLabel: varchar("link_label", { length: 255 }),
	icon: varchar({ length: 50 }),
	active: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	title: varchar({ length: 255 }).notNull(),
	message: text().notNull(),
	type: varchar({ length: 30 }).default('info').notNull(),
	read: boolean().default(false).notNull(),
	link: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "notifications_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const countdowns = pgTable("countdowns", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: varchar({ length: 255 }).default('Lancement du programme').notNull(),
	targetDate: timestamp("target_date", { mode: 'string' }).default('2026-05-01 00:00:00').notNull(),
	active: boolean().default(true).notNull(),
	message: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const siteConfig = pgTable("site_config", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	key: varchar({ length: 100 }).notNull(),
	value: text(),
	category: varchar({ length: 50 }).default('general').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("site_config_key_unique").on(table.key),
]);

export const projects = pgTable("projects", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	targetAmount: numeric("target_amount", { precision: 12, scale:  2 }).notNull(),
	startDate: timestamp("start_date", { mode: 'string' }).notNull(),
	endDate: timestamp("end_date", { mode: 'string' }).notNull(),
	status: varchar({ length: 20 }).default('upcoming').notNull(),
	countdownId: uuid("countdown_id"),
	active: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	goalAmount: numeric("goal_amount", { precision: 12, scale:  2 }),
	currentAmount: numeric("current_amount", { precision: 12, scale:  2 }).default('0'),
	imageUrl: text("image_url"),
}, (table) => [
	foreignKey({
			columns: [table.countdownId],
			foreignColumns: [countdowns.id],
			name: "projects_countdown_id_countdowns_id_fk"
		}),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	firstName: varchar("first_name", { length: 100 }).notNull(),
	lastName: varchar("last_name", { length: 100 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	password: text().notNull(),
	role: varchar({ length: 20 }).default('client').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const adminLogs = pgTable("admin_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	adminId: uuid("admin_id").notNull(),
	paymentId: uuid("payment_id").notNull(),
	action: varchar({ length: 50 }).notNull(),
	details: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	targetType: varchar("target_type", { length: 20 }),
	targetId: uuid("target_id"),
}, (table) => [
	index("idx_admin_logs_target").using("btree", table.targetType.asc().nullsLast().op("text_ops"), table.targetId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.adminId],
			foreignColumns: [users.id],
			name: "admin_logs_admin_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.paymentId],
			foreignColumns: [payments.id],
			name: "admin_logs_payment_id_payments_id_fk"
		}),
]);

export const cryptoTransactions = pgTable("crypto_transactions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	amountHtg: numeric("amount_htg", { precision: 12, scale:  2 }).notNull(),
	amountUsd: numeric("amount_usd", { precision: 12, scale:  2 }).notNull(),
	cryptoType: varchar("crypto_type", { length: 10 }).notNull(),
	network: varchar({ length: 10 }).notNull(),
	walletAddress: varchar("wallet_address", { length: 100 }).notNull(),
	status: varchar({ length: 20 }).default('pending').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const investments = pgTable("investments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	programId: uuid("program_id").notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	gain: numeric({ precision: 10, scale:  2 }).notNull(),
	expectedReturn: numeric("expected_return", { precision: 10, scale:  2 }).notNull(),
	status: varchar({ length: 20 }).default('pending').notNull(),
	idempotencyKey: varchar("idempotency_key", { length: 64 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("investments_idempotency_key_unique").on(table.idempotencyKey),
]);

export const programs = pgTable("programs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	minAmount: numeric("min_amount", { precision: 10, scale:  2 }).notNull(),
	maxAmount: numeric("max_amount", { precision: 10, scale:  2 }).notNull(),
	multipliers: jsonb().notNull(),
	active: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const rateLimits = pgTable("rate_limits", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	key: varchar({ length: 255 }).notNull(),
	count: integer().default(1).notNull(),
	windowStart: timestamp("window_start", { mode: 'string' }).notNull(),
	windowEnd: timestamp("window_end", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("rate_limits_key_unique").on(table.key),
]);

export const settings = pgTable("settings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	key: varchar({ length: 100 }).notNull(),
	value: text().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("settings_key_unique").on(table.key),
]);
