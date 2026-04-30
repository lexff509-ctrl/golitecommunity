-- Add idempotency_key to investments table
ALTER TABLE investments ADD COLUMN idempotency_key VARCHAR(64) UNIQUE;

-- Create index for idempotency lookups
CREATE INDEX idx_investment_idempotency ON investments(idempotency_key);