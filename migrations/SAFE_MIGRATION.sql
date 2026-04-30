-- =====================================================
-- MIGRATION SÉCURISÉE - PRODUCTION SAFE
-- Date: 2024
-- Version: SAFE v1.0
-- 
-- ⚠️  AUCUNE PERTE DE DONNÉES
-- ✅  Uniquement AJOUTS et MODIFICATIONS non-destructives
-- =====================================================

BEGIN;

-- =====================================================
-- SECTION 1: CRÉER LES NOUVELLES TABLES
-- =====================================================

-- Table crypto_transactions (nouvelle)
CREATE TABLE IF NOT EXISTS "crypto_transactions" (
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

-- Table investments (nouvelle)
CREATE TABLE IF NOT EXISTS "investments" (
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

-- Table programs (nouvelle)
CREATE TABLE IF NOT EXISTS "programs" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name" varchar(100) NOT NULL,
    "min_amount" numeric(10, 2) NOT NULL,
    "max_amount" numeric(10, 2) NOT NULL,
    "multipliers" jsonb NOT NULL,
    "active" boolean DEFAULT false NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Table rate_limits (nouvelle)
CREATE TABLE IF NOT EXISTS "rate_limits" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "key" varchar(255) NOT NULL,
    "count" integer DEFAULT 1 NOT NULL,
    "window_start" timestamp NOT NULL,
    "window_end" timestamp NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "rate_limits_key_unique" UNIQUE("key")
);

-- Table settings (nouvelle)
CREATE TABLE IF NOT EXISTS "settings" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "key" varchar(100) NOT NULL,
    "value" text NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "settings_key_unique" UNIQUE("key")
);

-- =====================================================
-- SECTION 2: AJOUTER COLONNES MANQUANTES (SAFE)
-- =====================================================

-- Table admin_logs - Ajouter colonnes si elles n'existent pas
DO $$
BEGIN
    -- Ajouter target_type (nullable au début pour données existantes)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'admin_logs' AND column_name = 'target_type') THEN
        ALTER TABLE "admin_logs" ADD COLUMN "target_type" varchar(20);
    END IF;

    -- Ajouter target_id (nullable au début)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'admin_logs' AND column_name = 'target_id') THEN
        ALTER TABLE "admin_logs" ADD COLUMN "target_id" uuid;
    END IF;

    -- Convertir details en jsonb si ce n'est pas déjà le cas
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'admin_logs' AND column_name = 'details' 
               AND data_type != 'jsonb') THEN
        ALTER TABLE "admin_logs" ALTER COLUMN "details" TYPE jsonb USING details::jsonb;
    END IF;
END $$;

-- Table payments - Ajouter colonnes si elles n'existent pas
DO $$
BEGIN
    -- reference_code (nullable au début)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'reference_code') THEN
        ALTER TABLE "payments" ADD COLUMN "reference_code" varchar(32);
    END IF;

    -- amount (copié depuis amount_usd si existe)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'amount') THEN
        ALTER TABLE "payments" ADD COLUMN "amount" numeric(10, 2);
        -- Copier depuis amount_usd si existe
        UPDATE "payments" SET "amount" = "amount_usd" WHERE "amount_usd" IS NOT NULL;
    END IF;

    -- proof_url (mapper depuis payment_proof si existe)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'proof_url') THEN
        ALTER TABLE "payments" ADD COLUMN "proof_url" text;
        -- Copier depuis payment_proof si existe
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'payment_proof') THEN
            UPDATE "payments" SET "proof_url" = "payment_proof" WHERE "payment_proof" IS NOT NULL;
        END IF;
    END IF;

    -- type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'type') THEN
        ALTER TABLE "payments" ADD COLUMN "type" varchar(20) DEFAULT 'payment';
    END IF;

    -- related_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'related_id') THEN
        ALTER TABLE "payments" ADD COLUMN "related_id" uuid;
    END IF;

    -- ip_address
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'ip_address') THEN
        ALTER TABLE "payments" ADD COLUMN "ip_address" varchar(45);
    END IF;
END $$;

-- Table projects - Ajouter colonnes si elles n'existent pas
DO $$
BEGIN
    -- goal_amount (mapper depuis target_amount si existe)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'goal_amount') THEN
        ALTER TABLE "projects" ADD COLUMN "goal_amount" numeric(12, 2);
        -- Copier depuis target_amount si existe
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'target_amount') THEN
            UPDATE "projects" SET "goal_amount" = "target_amount" WHERE "target_amount" IS NOT NULL;
        END IF;
    END IF;

    -- current_amount
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'current_amount') THEN
        ALTER TABLE "projects" ADD COLUMN "current_amount" numeric(12, 2) DEFAULT 0;
    END IF;

    -- image_url
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'image_url') THEN
        ALTER TABLE "projects" ADD COLUMN "image_url" text;
    END IF;

    -- Modifier status default si nécessaire
    ALTER TABLE "projects" ALTER COLUMN "status" SET DEFAULT 'active';
END $$;

-- Table users - Ajouter password_hash si nécessaire (MAPPER depuis password)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'password_hash') THEN
        ALTER TABLE "users" ADD COLUMN "password_hash" text;
        
        -- Copier depuis password si existe
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'password') THEN
            UPDATE "users" SET "password_hash" = "password" WHERE "password" IS NOT NULL;
        END IF;
    END IF;
END $$;

-- =====================================================
-- SECTION 3: GÉNÉRER VALEURS PAR DÉFAUT POUR COLONNES EXISTANTES
-- =====================================================

-- Générer reference_code pour payments existants sans reference_code
UPDATE "payments" 
SET "reference_code" = CONCAT('REF-', UPPER(substring(md5(random()::text) from 1 for 10)))
WHERE "reference_code" IS NULL;

-- Générer transaction_id pour payments existants sans transaction_id
UPDATE "payments" 
SET "transaction_id" = CONCAT('GL-', UPPER(substring(md5(random()::text) from 1 for 8)))
WHERE "transaction_id" IS NULL;

-- Remplir target_type et target_id pour admin_logs existants (fallback safe)
UPDATE "admin_logs"
SET 
    "target_type" = COALESCE("target_type", 'payment'),
    "target_id" = COALESCE("target_id", "payment_id")
WHERE "target_type" IS NULL AND "payment_id" IS NOT NULL;

-- Remplir les autres admin_logs sans target
UPDATE "admin_logs"
SET 
    "target_type" = COALESCE("target_type", 'unknown'),
    "target_id" = COALESCE("target_id", gen_random_uuid())
WHERE "target_type" IS NULL;

-- =====================================================
-- SECTION 4: CRÉER INDEX
-- =====================================================

-- Index pour crypto_transactions
CREATE INDEX IF NOT EXISTS "idx_crypto_user" ON "crypto_transactions" USING btree ("user_id");

-- Index pour investments
CREATE INDEX IF NOT EXISTS "idx_investment_user" ON "investments" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "idx_investment_program" ON "investments" USING btree ("program_id");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_investment_idempotency" ON "investments" USING btree ("idempotency_key");

-- Index pour programs
CREATE INDEX IF NOT EXISTS "idx_program_active" ON "programs" USING btree ("active");

-- Index pour rate_limits
CREATE INDEX IF NOT EXISTS "idx_rate_limits_key" ON "rate_limits" USING btree ("key");
CREATE INDEX IF NOT EXISTS "idx_rate_limits_window" ON "rate_limits" USING btree ("window_end");

-- Index pour admin_logs
CREATE INDEX IF NOT EXISTS "idx_adminlog_admin" ON "admin_logs" USING btree ("admin_id");
CREATE INDEX IF NOT EXISTS "idx_adminlog_target" ON "admin_logs" USING btree ("target_type", "target_id");

-- Index pour payments
CREATE INDEX IF NOT EXISTS "idx_payment_user" ON "payments" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "idx_payment_project" ON "payments" USING btree ("project_id");
CREATE INDEX IF NOT EXISTS "idx_payment_related" ON "payments" USING btree ("related_id");
CREATE UNIQUE INDEX IF NOT EXISTS "unique_reference_code" ON "payments" USING btree ("reference_code");
CREATE UNIQUE INDEX IF NOT EXISTS "unique_transaction_id" ON "payments" USING btree ("transaction_id");

-- Index pour projects
CREATE INDEX IF NOT EXISTS "idx_project_status" ON "projects" USING btree ("status");
CREATE INDEX IF NOT EXISTS "idx_project_active" ON "projects" USING btree ("active");

-- =====================================================
-- SECTION 5: CRÉER CONTRAINTES (FOREIGN KEYS)
-- =====================================================

-- Contraintes pour crypto_transactions
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'crypto_transactions_user_id_users_id_fk') THEN
        ALTER TABLE "crypto_transactions" 
        ADD CONSTRAINT "crypto_transactions_user_id_users_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;

-- Contraintes pour investments
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'investments_user_id_users_id_fk') THEN
        ALTER TABLE "investments" 
        ADD CONSTRAINT "investments_user_id_users_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'investments_program_id_programs_id_fk') THEN
        ALTER TABLE "investments" 
        ADD CONSTRAINT "investments_program_id_programs_id_fk" 
        FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE restrict ON UPDATE no action;
    END IF;
END $$;

-- Contraintes pour admin_logs (recréer si supprimées)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'admin_logs_admin_id_users_id_fk') THEN
        ALTER TABLE "admin_logs" 
        ADD CONSTRAINT "admin_logs_admin_id_users_id_fk" 
        FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;

-- Contraintes pour payments (recréer si supprimées)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'payments_project_id_projects_id_fk') THEN
        ALTER TABLE "payments" 
        ADD CONSTRAINT "payments_project_id_projects_id_fk" 
        FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
    END IF;
END $$;

-- =====================================================
-- SECTION 6: CONTRAINTES UNIQUES
-- =====================================================

-- Ajouter contrainte unique sur reference_code si pas déjà présente
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'payments_reference_code_unique') THEN
        ALTER TABLE "payments" ADD CONSTRAINT "payments_reference_code_unique" UNIQUE("reference_code");
    END IF;
END $$;

-- =====================================================
-- SECTION 7: VÉRIFICATIONS FINALES
-- =====================================================

-- Vérifier que les nouvelles tables ont été créées
DO $$
DECLARE
    missing_tables TEXT[] := ARRAY[]::TEXT[];
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crypto_transactions') THEN
        missing_tables := array_append(missing_tables, 'crypto_transactions');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'investments') THEN
        missing_tables := array_append(missing_tables, 'investments');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'programs') THEN
        missing_tables := array_append(missing_tables, 'programs');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rate_limits') THEN
        missing_tables := array_append(missing_tables, 'rate_limits');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'settings') THEN
        missing_tables := array_append(missing_tables, 'settings');
    END IF;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE EXCEPTION 'Migration failed: missing tables: %', array_to_string(missing_tables, ', ');
    END IF;
    
    RAISE NOTICE '✅ All new tables created successfully';
END $$;

-- Vérifier que les colonnes critiques existent
DO $$
BEGIN
    -- Vérifier users.password_hash
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'password_hash') THEN
        RAISE EXCEPTION 'Migration failed: users.password_hash not created';
    END IF;
    
    -- Vérifier payments.reference_code
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'reference_code') THEN
        RAISE EXCEPTION 'Migration failed: payments.reference_code not created';
    END IF;
    
    RAISE NOTICE '✅ All critical columns verified';
END $$;

-- =====================================================
-- SECTION 8: STATISTIQUES
-- =====================================================

ANALYZE crypto_transactions;
ANALYZE investments;
ANALYZE programs;
ANALYZE rate_limits;
ANALYZE settings;
ANALYZE admin_logs;
ANALYZE payments;
ANALYZE projects;
ANALYZE users;

COMMIT;

-- =====================================================
-- MIGRATION TERMINÉE
-- =====================================================
-- ✅ Aucune donnée perdue
-- ✅ Toutes les nouvelles tables créées
-- ✅ Toutes les colonnes ajoutées de façon safe
-- ✅ Les anciennes colonnes PRÉSERVÉES (pas de DROP)
-- ✅ Valeurs par défaut générées automatiquement
-- =====================================================

-- NOTE IMPORTANTE:
-- Les anciennes colonnes (payment_proof, currency, target_amount, etc.)
-- sont CONSERVÉES et peuvent être supprimées MANUELLEMENT plus tard
-- après vérification que tout fonctionne correctement.
-- 
-- Pour les supprimer (UNIQUEMENT après vérification):
-- ALTER TABLE payments DROP COLUMN currency;
-- ALTER TABLE payments DROP COLUMN payment_proof;
-- etc.
