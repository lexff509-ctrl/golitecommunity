CREATE TABLE "crypto_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"amount_htg" numeric(12, 2) NOT NULL,
	"amount_usd" numeric(12, 2) NOT NULL,
	"crypto_type" varchar(10) NOT NULL,
	"network" varchar(10) NOT NULL,
	"wallet_address" varchar(100) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"program_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"gain" numeric(10, 2) NOT NULL,
	"expected_return" numeric(10, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"idempotency_key" varchar(64),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "investments_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"min_amount" numeric(10, 2) NOT NULL,
	"max_amount" numeric(10, 2) NOT NULL,
	"multipliers" jsonb NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(255) NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"window_start" timestamp NOT NULL,
	"window_end" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "rate_limits_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "site_config" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "site_config" CASCADE;--> statement-breakpoint
ALTER TABLE "admin_logs" DROP CONSTRAINT "admin_logs_payment_id_payments_id_fk";
--> statement-breakpoint
ALTER TABLE "admin_logs" DROP CONSTRAINT "admin_logs_admin_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "payments" DROP CONSTRAINT "payments_project_id_projects_id_fk";
--> statement-breakpoint
ALTER TABLE "projects" DROP CONSTRAINT "projects_countdown_id_countdowns_id_fk";
--> statement-breakpoint
ALTER TABLE "admin_logs" ALTER COLUMN "details" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "transaction_id" SET DATA TYPE varchar(32);--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "amount_usd" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "status" SET DEFAULT 'active';--> statement-breakpoint
ALTER TABLE "admin_logs" ADD COLUMN "target_type" varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_logs" ADD COLUMN "target_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "reference_code" varchar(32) NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "amount" numeric(10, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "proof_url" text NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "type" varchar(20) DEFAULT 'payment' NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "related_id" uuid;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "ip_address" varchar(45);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "goal_amount" numeric(12, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "current_amount" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_hash" text NOT NULL;--> statement-breakpoint
ALTER TABLE "crypto_transactions" ADD CONSTRAINT "crypto_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investments" ADD CONSTRAINT "investments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investments" ADD CONSTRAINT "investments_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_crypto_user" ON "crypto_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_investment_user" ON "investments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_investment_program" ON "investments" USING btree ("program_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_investment_idempotency" ON "investments" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "idx_program_active" ON "programs" USING btree ("active");--> statement-breakpoint
CREATE INDEX "idx_rate_limits_key" ON "rate_limits" USING btree ("key");--> statement-breakpoint
CREATE INDEX "idx_rate_limits_window" ON "rate_limits" USING btree ("window_end");--> statement-breakpoint
ALTER TABLE "admin_logs" ADD CONSTRAINT "admin_logs_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_adminlog_admin" ON "admin_logs" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "idx_adminlog_target" ON "admin_logs" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "idx_payment_user" ON "payments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_payment_project" ON "payments" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_payment_related" ON "payments" USING btree ("related_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_reference_code" ON "payments" USING btree ("reference_code");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_transaction_id" ON "payments" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "idx_project_status" ON "projects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_project_active" ON "projects" USING btree ("active");--> statement-breakpoint
ALTER TABLE "admin_logs" DROP COLUMN "payment_id";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "currency";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "payment_proof";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "payment_proof_filename";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "reception_platform";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "reception_details";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "rejection_reason";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "validated_at";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "paid_at";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "rejected_at";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "admin_notes";--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "target_amount";--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "start_date";--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "end_date";--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "countdown_id";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "password";--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_reference_code_unique" UNIQUE("reference_code");