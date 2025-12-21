-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Enums
CREATE TYPE "LoanStatus" AS ENUM ('PENDING', 'ACTIVE', 'REPAID', 'DEFAULTED', 'LIQUIDATED');
CREATE TYPE "ReputationTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM');
CREATE TYPE "VouchStatus" AS ENUM ('ACTIVE', 'WITHDRAWN', 'SLASHED');

-- Create Users Table
CREATE TABLE "users" (
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

-- Create Loans Table
CREATE TABLE "loans" (
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

-- Create Vouches Table
CREATE TABLE "vouches" (
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

-- Add Foreign Key for Loans -> Users
ALTER TABLE "loans" ADD CONSTRAINT "FK_loans_users" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Enable Row Level Security (Optional, for Supabase specific testing)
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "loans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "vouches" ENABLE ROW LEVEL SECURITY;
