-- Migration to add missing tables and fields for LYNQ backend
-- Run this in Supabase SQL Editor or via psql

-- ============================================================================
-- ADD MISSING ENUMS
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE "ReputationEventType" AS ENUM (
        'LOAN_REPAID',
        'LOAN_DEFAULTED',
        'EARLY_REPAYMENT',
        'LATE_PAYMENT',
        'PARTIAL_REPAYMENT',
        'VOUCH_PROVIDED',
        'VOUCH_SLASHED',
        'KYC_VERIFIED',
        'ACCOUNT_BLOCKED',
        'ACCOUNT_UNBLOCKED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'BLOCKED', 'SUSPENDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "RepaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- ADD MISSING FIELDS TO EXISTING TABLES
-- ============================================================================

-- Add fields to users table
ALTER TABLE "users" 
ADD COLUMN IF NOT EXISTS "phone" VARCHAR,
ADD COLUMN IF NOT EXISTS "status" "UserStatus" DEFAULT 'ACTIVE';

-- Add fields to loans table
ALTER TABLE "loans"
ADD COLUMN IF NOT EXISTS "partialExtensionUsed" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "lateDays" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "riskLevel" VARCHAR;

-- ============================================================================
-- CREATE REPUTATION TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "reputation" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL UNIQUE,
    "score" INTEGER NOT NULL DEFAULT 500,
    "tier" "ReputationTier" NOT NULL DEFAULT 'BRONZE',
    "totalLoans" INTEGER DEFAULT 0,
    "successfulRepayments" INTEGER DEFAULT 0,
    "defaults" INTEGER DEFAULT 0,
    "latePayments" INTEGER DEFAULT 0,
    "earlyRepayments" INTEGER DEFAULT 0,
    "totalVouches" INTEGER DEFAULT 0,
    "slashedVouches" INTEGER DEFAULT 0,
    "consecutiveSuccessful" INTEGER DEFAULT 0,
    "longestStreak" INTEGER DEFAULT 0,
    "lastUpdated" TIMESTAMP DEFAULT now(),
    "createdAt" TIMESTAMP DEFAULT now(),
    CONSTRAINT "FK_reputation_users" FOREIGN KEY ("userId") 
        REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "IDX_reputation_userId" ON "reputation" ("userId");
CREATE INDEX IF NOT EXISTS "IDX_reputation_score" ON "reputation" ("score");
CREATE INDEX IF NOT EXISTS "IDX_reputation_tier" ON "reputation" ("tier");

-- ============================================================================
-- CREATE REPUTATION_EVENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "reputation_events" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "reputationId" UUID NOT NULL,
    "eventType" "ReputationEventType" NOT NULL,
    "pointsChange" INTEGER NOT NULL,
    "previousScore" INTEGER NOT NULL,
    "newScore" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP DEFAULT now(),
    CONSTRAINT "FK_reputation_events_users" FOREIGN KEY ("userId") 
        REFERENCES "users"("id") ON DELETE CASCADE,
    CONSTRAINT "FK_reputation_events_reputation" FOREIGN KEY ("reputationId") 
        REFERENCES "reputation"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "IDX_reputation_events_userId" ON "reputation_events" ("userId");
CREATE INDEX IF NOT EXISTS "IDX_reputation_events_reputationId" ON "reputation_events" ("reputationId");
CREATE INDEX IF NOT EXISTS "IDX_reputation_events_eventType" ON "reputation_events" ("eventType");
CREATE INDEX IF NOT EXISTS "IDX_reputation_events_createdAt" ON "reputation_events" ("createdAt");

-- ============================================================================
-- CREATE REPAYMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "repayments" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "loanId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "amount" NUMERIC(18,8) NOT NULL,
    "paidAt" TIMESTAMP NOT NULL DEFAULT now(),
    "status" "RepaymentStatus" DEFAULT 'COMPLETED',
    "transactionHash" VARCHAR,
    "isPartial" BOOLEAN DEFAULT false,
    "isEarly" BOOLEAN DEFAULT false,
    "isLate" BOOLEAN DEFAULT false,
    "lateDays" INTEGER DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP DEFAULT now(),
    CONSTRAINT "FK_repayments_loans" FOREIGN KEY ("loanId") 
        REFERENCES "loans"("id") ON DELETE CASCADE,
    CONSTRAINT "FK_repayments_users" FOREIGN KEY ("userId") 
        REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "IDX_repayments_loanId" ON "repayments" ("loanId");
CREATE INDEX IF NOT EXISTS "IDX_repayments_userId" ON "repayments" ("userId");
CREATE INDEX IF NOT EXISTS "IDX_repayments_paidAt" ON "repayments" ("paidAt");
CREATE INDEX IF NOT EXISTS "IDX_repayments_status" ON "repayments" ("status");

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE "reputation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reputation_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "repayments" ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "reputation_select_own" ON "reputation";
CREATE POLICY "reputation_select_own" ON "reputation" 
    FOR SELECT USING (auth.uid()::text = "userId"::text);

DROP POLICY IF EXISTS "reputation_events_select_own" ON "reputation_events";
CREATE POLICY "reputation_events_select_own" ON "reputation_events" 
    FOR SELECT USING (auth.uid()::text = "userId"::text);

DROP POLICY IF EXISTS "repayments_select_own" ON "repayments";
CREATE POLICY "repayments_select_own" ON "repayments" 
    FOR SELECT USING (auth.uid()::text = "userId"::text);

DROP POLICY IF EXISTS "repayments_insert_own" ON "repayments";
CREATE POLICY "repayments_insert_own" ON "repayments" 
    FOR INSERT WITH CHECK (auth.uid()::text = "userId"::text);

-- ============================================================================
-- TRIGGER TO AUTO-CREATE REPUTATION FOR NEW USERS
-- ============================================================================

CREATE OR REPLACE FUNCTION create_user_reputation()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO "reputation" ("userId", "score", "tier")
    VALUES (NEW.id, 500, 'BRONZE')
    ON CONFLICT ("userId") DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_reputation ON "users";
CREATE TRIGGER trigger_create_reputation
    AFTER INSERT ON "users"
    FOR EACH ROW
    EXECUTE FUNCTION create_user_reputation();

-- ============================================================================
-- VERIFY MIGRATION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'New tables created: reputation, reputation_events, repayments';
    RAISE NOTICE 'Fields added to users: phone, status';
    RAISE NOTICE 'Fields added to loans: partialExtensionUsed, lateDays, riskLevel';
END $$;
