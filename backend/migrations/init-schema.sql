CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
    CREATE TYPE "LoanStatus" AS ENUM ('PENDING', 'ACTIVE', 'REPAID', 'DEFAULTED', 'LIQUIDATED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ReputationTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "VouchStatus" AS ENUM ('ACTIVE', 'WITHDRAWN', 'SLASHED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "CollateralStatus" AS ENUM ('LOCKED', 'UNLOCKED', 'LIQUIDATED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "users" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "email" CHARACTER VARYING NOT NULL,
    "password" CHARACTER VARYING,
    "walletAddresses" JSONB,
    "reputationTier" "ReputationTier" NOT NULL DEFAULT 'BRONZE',
    "reputationPoints" INTEGER NOT NULL DEFAULT 0,
    "kycVerified" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "PK_users" PRIMARY KEY ("id"),
    CONSTRAINT "UQ_users_email" UNIQUE ("email")
);

CREATE TABLE IF NOT EXISTS "loans" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "amount" NUMERIC(18,8) NOT NULL,
    "outstandingAmount" NUMERIC(18,8) NOT NULL DEFAULT '0',
    "chain" CHARACTER VARYING NOT NULL,
    "collateralTokenAddress" CHARACTER VARYING NOT NULL,
    "collateralAmount" NUMERIC(18,8) NOT NULL,
    "interestRate" NUMERIC(5,2) NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "status" "LoanStatus" NOT NULL DEFAULT 'PENDING',
    "contractAddress" CHARACTER VARYING,
    "transactionHash" CHARACTER VARYING,
    "startDate" TIMESTAMP,
    "dueDate" TIMESTAMP,
    "repaidDate" TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "PK_loans" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "vouches" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "loanId" CHARACTER VARYING NOT NULL,
    "stakerAddress" CHARACTER VARYING NOT NULL,
    "borrowerAddress" CHARACTER VARYING NOT NULL,
    "amount" NUMERIC(36,18) NOT NULL,
    "status" "VouchStatus" NOT NULL DEFAULT 'ACTIVE',
    "transactionHash" CHARACTER VARYING NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "PK_vouches" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "collateral" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "tokenAddress" CHARACTER VARYING NOT NULL,
    "amount" NUMERIC(18,8) NOT NULL,
    "status" "CollateralStatus" NOT NULL DEFAULT 'LOCKED',
    "chain" CHARACTER VARYING DEFAULT 'ethereum',
    "lastValuation" NUMERIC(18,8),
    "lastValuationAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "PK_collateral" PRIMARY KEY ("id"),
    CONSTRAINT "FK_collateral_users" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "telegram_subscriptions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "chatId" CHARACTER VARYING NOT NULL,
    "walletAddress" CHARACTER VARYING NOT NULL,
    "username" CHARACTER VARYING,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "preferences" JSONB NOT NULL DEFAULT '{"loanAlerts":true,"healthFactorAlerts":true,"creditScoreAlerts":true,"transactionAlerts":true,"dailySummary":false,"priceAlerts":false,"marketingMessages":false}',
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "PK_telegram_subscriptions" PRIMARY KEY ("id"),
    CONSTRAINT "UQ_telegram_userId" UNIQUE ("userId"),
    CONSTRAINT "UQ_telegram_chatId" UNIQUE ("chatId")
);

CREATE TABLE IF NOT EXISTS "credit_scores" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "score" INTEGER NOT NULL,
    "grade" VARCHAR NOT NULL,
    "breakdown" JSONB NOT NULL,
    "method" VARCHAR NOT NULL,
    "calculatedAt" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "fraud_checks" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "recommendation" VARCHAR NOT NULL,
    "flags" JSONB NOT NULL,
    "checkedAt" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "loan_risk_assessments" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "loanId" UUID NOT NULL,
    "riskLevel" VARCHAR NOT NULL,
    "defaultProbability" NUMERIC(5,2),
    "liquidationRisk" NUMERIC(5,2),
    "collateralHealth" NUMERIC(5,2),
    "recommendation" VARCHAR NOT NULL,
    "assessedAt" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "ml_training_data" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "loanId" UUID,
    "userId" UUID,
    "features" JSONB NOT NULL,
    "collected_at" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "learning_modules" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT,
    "video_url" TEXT,
    "difficulty" TEXT DEFAULT 'BEGINNER',
    "points_reward" INTEGER DEFAULT 100,
    "created_at" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "learning_progress" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" UUID,
    "module_id" UUID,
    "status" TEXT DEFAULT 'STARTED',
    "score" INTEGER DEFAULT 0,
    "completed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ DEFAULT now(),
    UNIQUE("user_id", "module_id")
);

CREATE TABLE IF NOT EXISTS "quiz_attempts" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" UUID,
    "module_id" UUID,
    "answers" JSONB,
    "score" INTEGER,
    "passed" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "reputation_actions" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" UUID,
    "action_type" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "achievements" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" UUID,
    "achievement_type" TEXT NOT NULL,
    "unlocked_at" TIMESTAMPTZ DEFAULT now()
);

DO $$ BEGIN
    ALTER TABLE "loans" ADD CONSTRAINT "FK_loans_users" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "telegram_subscriptions" ADD CONSTRAINT "FK_telegram_users" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "credit_scores" ADD CONSTRAINT "FK_credit_scores_users" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "fraud_checks" ADD CONSTRAINT "FK_fraud_checks_users" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "loan_risk_assessments" ADD CONSTRAINT "FK_loan_risk_assessments_loans" 
        FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "ml_training_data" ADD CONSTRAINT "FK_ml_training_data_loans" 
        FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "ml_training_data" ADD CONSTRAINT "FK_ml_training_data_users" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "learning_progress" ADD CONSTRAINT "FK_learning_progress_users" 
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "learning_progress" ADD CONSTRAINT "FK_learning_progress_modules" 
        FOREIGN KEY ("module_id") REFERENCES "learning_modules"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "quiz_attempts" ADD CONSTRAINT "FK_quiz_attempts_users" 
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "quiz_attempts" ADD CONSTRAINT "FK_quiz_attempts_modules" 
        FOREIGN KEY ("module_id") REFERENCES "learning_modules"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "reputation_actions" ADD CONSTRAINT "FK_reputation_actions_users" 
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "achievements" ADD CONSTRAINT "FK_achievements_users" 
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE INDEX IF NOT EXISTS "IDX_telegram_walletAddress" ON "telegram_subscriptions" ("walletAddress");
CREATE INDEX IF NOT EXISTS "IDX_loans_userId" ON "loans" ("userId");
CREATE INDEX IF NOT EXISTS "IDX_loans_status" ON "loans" ("status");
CREATE INDEX IF NOT EXISTS "IDX_loans_createdAt" ON "loans" ("createdAt");
CREATE INDEX IF NOT EXISTS "IDX_users_reputationTier" ON "users" ("reputationTier");
CREATE INDEX IF NOT EXISTS "IDX_credit_scores_userId" ON "credit_scores" ("userId");
CREATE INDEX IF NOT EXISTS "IDX_fraud_checks_userId" ON "fraud_checks" ("userId");
CREATE INDEX IF NOT EXISTS "IDX_loan_risk_assessments_loanId" ON "loan_risk_assessments" ("loanId");
CREATE INDEX IF NOT EXISTS "IDX_learning_progress_user_id" ON "learning_progress" ("user_id");
CREATE INDEX IF NOT EXISTS "IDX_quiz_attempts_user_id" ON "quiz_attempts" ("user_id");
CREATE INDEX IF NOT EXISTS "IDX_collateral_userId" ON "collateral" ("userId");
CREATE INDEX IF NOT EXISTS "IDX_collateral_status" ON "collateral" ("status");

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "loans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "vouches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "collateral" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "telegram_subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "credit_scores" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "fraud_checks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "loan_risk_assessments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ml_training_data" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "learning_modules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "learning_progress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "quiz_attempts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reputation_actions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "achievements" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own" ON "users";
CREATE POLICY "users_select_own" ON "users" FOR SELECT USING (auth.uid()::text = id::text);

DROP POLICY IF EXISTS "loans_select_own" ON "loans";
CREATE POLICY "loans_select_own" ON "loans" FOR SELECT USING (auth.uid()::text = "userId"::text);

DROP POLICY IF EXISTS "collateral_select_own" ON "collateral";
CREATE POLICY "collateral_select_own" ON "collateral" FOR SELECT USING (auth.uid()::text = "userId"::text);

DROP POLICY IF EXISTS "telegram_select_own" ON "telegram_subscriptions";
CREATE POLICY "telegram_select_own" ON "telegram_subscriptions" FOR SELECT USING (auth.uid()::text = "userId"::text);

DROP POLICY IF EXISTS "users_insert_own" ON "users";
CREATE POLICY "users_insert_own" ON "users" FOR INSERT WITH CHECK (auth.uid()::text = id::text);

DROP POLICY IF EXISTS "loans_insert_own" ON "loans";
CREATE POLICY "loans_insert_own" ON "loans" FOR INSERT WITH CHECK (auth.uid()::text = "userId"::text);

DROP POLICY IF EXISTS "telegram_insert_own" ON "telegram_subscriptions";
CREATE POLICY "telegram_insert_own" ON "telegram_subscriptions" FOR INSERT WITH CHECK (auth.uid()::text = "userId"::text);

DROP POLICY IF EXISTS "telegram_update_own" ON "telegram_subscriptions";
CREATE POLICY "telegram_update_own" ON "telegram_subscriptions" FOR UPDATE USING (auth.uid()::text = "userId"::text);

DROP POLICY IF EXISTS "learning_modules_select_all" ON "learning_modules";
CREATE POLICY "learning_modules_select_all" ON "learning_modules" FOR SELECT USING (true);
