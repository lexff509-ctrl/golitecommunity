-- Migration: Create new tables for investment system
-- Generated at: 2026-04-26

-- ============================================
-- PROGRAMS table
-- ============================================
CREATE TABLE IF NOT EXISTS "programs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar(100) NOT NULL,
  "min_amount" decimal(10,2) NOT NULL,
  "max_amount" decimal(10,2) NOT NULL,
  "multipliers" jsonb NOT NULL,
  "active" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_program_active" ON "programs" ("active");

-- ============================================
-- INVESTMENTS table
-- ============================================
CREATE TABLE IF NOT EXISTS "investments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "program_id" uuid NOT NULL REFERENCES "programs"("id") ON DELETE RESTRICT,
  "amount" decimal(10,2) NOT NULL,
  "gain" decimal(10,2) NOT NULL,
  "expected_return" decimal(10,2) NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'pending',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_investment_user" ON "investments" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_investment_program" ON "investments" ("program_id");

-- ============================================
-- PAYMENTS table (updated structure)
-- ============================================
CREATE TABLE IF NOT EXISTS "payments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "reference_code" varchar(32) NOT NULL UNIQUE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "method" varchar(30) NOT NULL,
  "amount" decimal(10,2) NOT NULL,
  "proof_url" text NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'pending',
  "type" varchar(20) NOT NULL,
  "related_id" uuid NOT NULL,
  "ip_address" varchar(45),
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_payment_user" ON "payments" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_payment_related" ON "payments" ("related_id");
CREATE UNIQUE INDEX IF NOT EXISTS "unique_reference_code" ON "payments" ("reference_code");

-- ============================================
-- CRYPTO_TRANSACTIONS table
-- ============================================
CREATE TABLE IF NOT EXISTS "crypto_transactions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "amount_htg" decimal(12,2) NOT NULL,
  "amount_usd" decimal(12,2) NOT NULL,
  "crypto_type" varchar(10) NOT NULL,
  "network" varchar(10) NOT NULL,
  "wallet_address" varchar(100) NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'pending',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_crypto_user" ON "crypto_transactions" ("user_id");

-- ============================================
-- SETTINGS table
-- ============================================
CREATE TABLE IF NOT EXISTS "settings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "key" varchar(100) NOT NULL UNIQUE,
  "value" text NOT NULL,
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- ============================================
-- ADMIN_LOGS table (updated structure)
-- ============================================
CREATE TABLE IF NOT EXISTS "admin_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "admin_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "action" varchar(50) NOT NULL,
  "target_type" varchar(20) NOT NULL,
  "target_id" uuid NOT NULL,
  "details" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_adminlog_admin" ON "admin_logs" ("admin_id");
CREATE INDEX IF NOT EXISTS "idx_adminlog_target" ON "admin_logs" ("target_type", "target_id");

-- ============================================
-- Insert default program
-- ============================================
INSERT INTO "programs" ("name", "min_amount", "max_amount", "multipliers", "active")
VALUES (
  'Programme Mai 2026',
  15.00,
  100.00,
  '{"15":30,"30":100,"100":210}',
  true
) ON CONFLICT DO NOTHING;

-- ============================================
-- Insert default settings
-- ============================================
INSERT INTO "settings" ("key", "value") VALUES
  ('exchange_rate', '150'),
  ('binance_id', '554871538'),
  ('binance_name', 'DK27HA'),
  ('moncash_name', 'Joseph Renato'),
  ('moncash_phone', '+50931959375')
ON CONFLICT DO NOTHING;