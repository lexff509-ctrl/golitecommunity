-- ============================================
-- Migration 001: Schema Fixes
-- Date: 2024
-- Description: Fix database schema to match application code
-- ============================================

BEGIN;

-- ============================================
-- 1. FIX USERS TABLE
-- ============================================

-- Add first_name and last_name columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);

-- Set default values for existing users (from email)
UPDATE users 
SET 
  first_name = COALESCE(first_name, split_part(email, '@', 1)),
  last_name = COALESCE(last_name, 'User')
WHERE first_name IS NULL OR last_name IS NULL;

-- Make columns NOT NULL after setting defaults
ALTER TABLE users 
ALTER COLUMN first_name SET NOT NULL,
ALTER COLUMN last_name SET NOT NULL;

-- Change default role from 'user' to 'client'
ALTER TABLE users 
ALTER COLUMN role SET DEFAULT 'client';

-- Update existing 'user' roles to 'client'
UPDATE users SET role = 'client' WHERE role = 'user';

COMMENT ON COLUMN users.first_name IS 'User first name';
COMMENT ON COLUMN users.last_name IS 'User last name';

-- ============================================
-- 2. CREATE PROJECTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  goal_amount DECIMAL(12, 2) NOT NULL,
  current_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_project_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_project_active ON projects(active);

COMMENT ON TABLE projects IS 'Community investment projects';

-- ============================================
-- 3. FIX PAYMENTS TABLE
-- ============================================

-- Add new columns
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(32),
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS amount_usd DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS amount_htg DECIMAL(12, 2);

-- Make related_id nullable if not already
ALTER TABLE payments
ALTER COLUMN related_id DROP NOT NULL;

-- Generate transaction_id for existing records
UPDATE payments 
SET transaction_id = CONCAT('GL-', UPPER(substring(md5(random()::text) from 1 for 8)))
WHERE transaction_id IS NULL;

-- Copy data from amount to amount_usd for existing records
UPDATE payments 
SET amount_usd = amount
WHERE amount_usd IS NULL;

-- Set first_name and last_name from users table for existing records
UPDATE payments p
SET 
  first_name = u.first_name,
  last_name = u.last_name
FROM users u
WHERE p.user_id = u.id 
  AND (p.first_name IS NULL OR p.last_name IS NULL);

-- Make transaction_id unique
CREATE UNIQUE INDEX IF NOT EXISTS unique_transaction_id 
ON payments(transaction_id) WHERE transaction_id IS NOT NULL;

-- Create additional indexes
CREATE INDEX IF NOT EXISTS idx_payment_project 
ON payments(project_id);

-- Make transaction_id NOT NULL after migration
ALTER TABLE payments
ALTER COLUMN transaction_id SET NOT NULL;

COMMENT ON COLUMN payments.transaction_id IS 'Unique transaction identifier (GL-XXXXXXXX)';
COMMENT ON COLUMN payments.project_id IS 'Reference to project if payment is for a project';
COMMENT ON COLUMN payments.amount_usd IS 'Amount in USD';
COMMENT ON COLUMN payments.amount_htg IS 'Amount in HTG (Haitian Gourdes)';

-- ============================================
-- 4. VERIFY AND CLEANUP
-- ============================================

-- Verify all users have first_name and last_name
DO $$
DECLARE
  invalid_users INTEGER;
BEGIN
  SELECT COUNT(*) INTO invalid_users
  FROM users 
  WHERE first_name IS NULL OR last_name IS NULL;
  
  IF invalid_users > 0 THEN
    RAISE EXCEPTION 'Migration failed: % users still have NULL first_name or last_name', invalid_users;
  END IF;
  
  RAISE NOTICE 'Users table verified: all users have first_name and last_name';
END $$;

-- Verify all payments have transaction_id
DO $$
DECLARE
  invalid_payments INTEGER;
BEGIN
  SELECT COUNT(*) INTO invalid_payments
  FROM payments 
  WHERE transaction_id IS NULL;
  
  IF invalid_payments > 0 THEN
    RAISE EXCEPTION 'Migration failed: % payments still have NULL transaction_id', invalid_payments;
  END IF;
  
  RAISE NOTICE 'Payments table verified: all payments have transaction_id';
END $$;

-- ============================================
-- 5. UPDATE SEQUENCES AND STATS
-- ============================================

-- Update table statistics
ANALYZE users;
ANALYZE payments;
ANALYZE projects;

COMMIT;

-- ============================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================
/*
BEGIN;

-- Rollback users changes
ALTER TABLE users 
DROP COLUMN IF EXISTS first_name,
DROP COLUMN IF EXISTS last_name;

ALTER TABLE users 
ALTER COLUMN role SET DEFAULT 'user';

-- Drop projects table
DROP TABLE IF EXISTS projects CASCADE;

-- Rollback payments changes
ALTER TABLE payments
DROP COLUMN IF EXISTS transaction_id,
DROP COLUMN IF EXISTS project_id,
DROP COLUMN IF EXISTS first_name,
DROP COLUMN IF EXISTS last_name,
DROP COLUMN IF EXISTS amount_usd,
DROP COLUMN IF EXISTS amount_htg;

COMMIT;
*/
