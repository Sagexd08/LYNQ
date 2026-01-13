-- CreateEnum
CREATE TYPE "ReputationEventType" AS ENUM ('EARLY_REPAYMENT', 'ON_TIME_REPAYMENT', 'PARTIAL_REPAYMENT', 'LATE_REPAYMENT', 'CONSECUTIVE_LATE_BLOCK', 'RECOVERY', 'UNBLOCK', 'ADMIN_ADJUSTMENT');

-- AlterTable
ALTER TABLE "loans" ADD COLUMN     "late_days" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "partial_extension_used" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "reputation" ADD COLUMN     "clean_cycle_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "consecutive_late_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "max_score_before_last_penalty" INTEGER;

-- CreateTable
CREATE TABLE "reputation_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "ReputationEventType" NOT NULL,
    "delta" INTEGER NOT NULL,
    "previous_score" INTEGER NOT NULL,
    "new_score" INTEGER NOT NULL,
    "loan_id" TEXT,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reputation_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reputation_events_user_id_created_at_idx" ON "reputation_events"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "reputation_events" ADD CONSTRAINT "reputation_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "reputation"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
