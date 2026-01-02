-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Risk Scoring Tables
CREATE TABLE IF NOT EXISTS "credit_scores" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "score" INTEGER NOT NULL,
  "grade" VARCHAR NOT NULL,
  "breakdown" JSONB NOT NULL,
  "method" VARCHAR NOT NULL,
  "calculatedAt" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "fraud_checks" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "riskScore" INTEGER NOT NULL,
  "recommendation" VARCHAR NOT NULL,
  "flags" JSONB NOT NULL,
  "checkedAt" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "loan_risk_assessments" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "loanId" UUID NOT NULL REFERENCES "loans"("id") ON DELETE CASCADE,
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
  "loanId" UUID REFERENCES "loans"("id") ON DELETE SET NULL,
  "userId" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "features" JSONB NOT NULL,
  "collected_at" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP DEFAULT now()
);

-- Education System Tables
CREATE TABLE IF NOT EXISTS learning_modules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  content text, 
  video_url text,
  difficulty text DEFAULT 'BEGINNER',
  points_reward int DEFAULT 100,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS learning_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  module_id uuid REFERENCES learning_modules(id) ON DELETE CASCADE,
  status text DEFAULT 'STARTED',
  score int DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, module_id)
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  module_id uuid REFERENCES learning_modules(id) ON DELETE CASCADE,
  answers jsonb,
  score int,
  passed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reputation_actions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  points int NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS achievements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  achievement_type text NOT NULL,
  unlocked_at timestamptz DEFAULT now()
);
