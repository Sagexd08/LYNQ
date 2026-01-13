-- Prisma Migration: Add missing schema elements
-- This will be applied via Prisma Migrate

/*
  Warnings:

  - You are about to add missing tables and fields required by the application

*/

-- CreateEnum
CREATE TYPE "ReputationEventType" AS ENUM ('LOAN_REPAID', 'LOAN_DEFAULTED', 'EARLY_REPAYMENT', 'LATE_PAYMENT', 'PARTIAL_REPAYMENT', 'VOUCH_PROVIDED', 'VOUCH_SLASHED', 'KYC_VERIFIED', 'ACCOUNT_BLOCKED', 'ACCOUNT_UNBLOCKED');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'BLOCKED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "RepaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "loans" ADD COLUMN     "lateDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "partialExtensionUsed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "riskLevel" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "phone" TEXT,
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "reputation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 500,
    "tier" "ReputationTier" NOT NULL DEFAULT 'BRONZE',
    "totalLoans" INTEGER NOT NULL DEFAULT 0,
    "successfulRepayments" INTEGER NOT NULL DEFAULT 0,
    "defaults" INTEGER NOT NULL DEFAULT 0,
    "latePayments" INTEGER NOT NULL DEFAULT 0,
    "earlyRepayments" INTEGER NOT NULL DEFAULT 0,
    "totalVouches" INTEGER NOT NULL DEFAULT 0,
    "slashedVouches" INTEGER NOT NULL DEFAULT 0,
    "consecutiveSuccessful" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reputation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reputation_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "reputationId" UUID NOT NULL,
    "eventType" "ReputationEventType" NOT NULL,
    "pointsChange" INTEGER NOT NULL,
    "previousScore" INTEGER NOT NULL,
    "newScore" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reputation_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repayments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "loanId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "amount" DECIMAL(18,8) NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "RepaymentStatus" NOT NULL DEFAULT 'COMPLETED',
    "transactionHash" TEXT,
    "isPartial" BOOLEAN NOT NULL DEFAULT false,
    "isEarly" BOOLEAN NOT NULL DEFAULT false,
    "isLate" BOOLEAN NOT NULL DEFAULT false,
    "lateDays" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "repayments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reputation_userId_key" ON "reputation"("userId");

-- CreateIndex
CREATE INDEX "IDX_reputation_userId" ON "reputation"("userId");

-- CreateIndex
CREATE INDEX "IDX_reputation_score" ON "reputation"("score");

-- CreateIndex
CREATE INDEX "IDX_reputation_tier" ON "reputation"("tier");

-- CreateIndex
CREATE INDEX "IDX_reputation_events_userId" ON "reputation_events"("userId");

-- CreateIndex
CREATE INDEX "IDX_reputation_events_reputationId" ON "reputation_events"("reputationId");

-- CreateIndex
CREATE INDEX "IDX_reputation_events_eventType" ON "reputation_events"("eventType");

-- CreateIndex
CREATE INDEX "IDX_reputation_events_createdAt" ON "reputation_events"("createdAt");

-- CreateIndex
CREATE INDEX "IDX_repayments_loanId" ON "repayments"("loanId");

-- CreateIndex
CREATE INDEX "IDX_repayments_userId" ON "repayments"("userId");

-- CreateIndex
CREATE INDEX "IDX_repayments_paidAt" ON "repayments"("paidAt");

-- CreateIndex
CREATE INDEX "IDX_repayments_status" ON "repayments"("status");

-- AddForeignKey
ALTER TABLE "reputation" ADD CONSTRAINT "FK_reputation_users" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reputation_events" ADD CONSTRAINT "FK_reputation_events_users" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reputation_events" ADD CONSTRAINT "FK_reputation_events_reputation" FOREIGN KEY ("reputationId") REFERENCES "reputation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repayments" ADD CONSTRAINT "FK_repayments_loans" FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repayments" ADD CONSTRAINT "FK_repayments_users" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
