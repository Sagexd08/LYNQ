---
description: LYNQ Platform Refactoring & Feature Implementation Plan
---

# LYNQ Refactoring & Implementation Workflow

This workflow outlines the step-by-step process to transform LYNQ from a polished demo into a production-ready, learning-first DeFi platform.

## Phase 1: Clean Foundation (Critical Fixes)

These steps address the immediate technical debt and critical issues identified in the codebase review.

### 1.1 Remove TypeORM & Clean Architecture
TypeORM is currently unused but creates noise and confusion. We will consolidate on Supabase.

1. **Delete Entity Files**: Remove all `*.entity.ts` files from `apps/backend/src/modules/*/entities/`.
2. **Remove Dependencies**: Uninstall `@nestjs/typeorm`, `typeorm`, and `pg` from `apps/backend/package.json`.
3. **Clean Imports**: Remove all TypeORM imports from `app.module.ts` and feature modules.
4. **Create Shared Types**: creating `apps/backend/src/common/types/database.types.ts` using generated Supabase types.

### 1.2 Fix Security & Performance
Address the O(n) lookup and basic security flaws.

1. **Fix Wallet Lookup**: Refactor `UserService.findByWalletAddress` to use Supabase's JSONB operators (e.g., `.contains()`) instead of iterating through all users in memory.
2. **Add Input Validation**: Implement `ValidationPipe` globally in `main.ts` and add `class-validator` decorators to all DTOs (e.g., `CreateLoanDto`, `CreateUserDto`).
3. **Rate Limiting**: Apply `@Throttle()` decorators to public-facing and sensitive endpoints in controllers.

### 1.3 Honest ML Rebranding
Transition "Fake ML" to "Transparent Algorithmic Scoring".

1. **Rename Service**: Rename `MLService` to `RiskScoringService`.
2. **Remove Randomness**: Delete all `Math.random()` calls used for scoring. Replace with deterministic logic based on:
    - User reputation points
    - Loan history (repayment rate)
    - Collateral ratio
    - Account age
3. **Update API**: Update endpoints to return "Algorithmic Score" instead of "AI Prediction".

## Phase 2: Education System (The Core Differentiator)

Implementing the "Learning-First" architecture.

### 2.1 Database Schema
1. **Create Tables**: Execute SQL to create:
    - `learning_modules`
    - `learning_progress`
    - `quiz_attempts`
    - `reputation_actions`
    - `achievements`

### 2.2 Backend Logic (`EducationModule`)
1. **Create Module**: Generate `EducationModule`, `EducationService`, `EducationController`.
2. **Implement Logic**:
    - `startModule(userId, moduleId)`
    - `submitQuiz(userId, moduleId, answers)`
    - `checkProgression(userId)` (Handles Bronze -> Silver -> Gold tier upgrades)
3. **Gamification**: Implement `ReputationService` to award points for specific actions (completing modules, repaying loans).

### 2.3 Frontend Learning Experience
1. **Learning Dashboard**: Create a new page `/learning` showing progress, tiers, and available modules.
2. **Module Interface**: Build a component to render learning content (Text/Video) and Quizzes.
3. **Gamification UI**: Add "Level Up" animations and a reputation point counter in the `NavBar`.

## Phase 3: Progressive Loan Access

Tie the lending capability to the education system.

1. **Loan Eligibility Service**: Create `LoanEligibilityService` that checks:
    - User Tier (Bronze/Silver/Gold)
    - Completed Modules (Prerequisites)
    - Reputation Score
2. **Refactor Loan Creation**: Update `LoanService.create()` to call `LoanEligibilityService.check()` before allowing a loan.
3. **Frontend Restrictions**: Disable "Create Loan" buttons for ineligible users and show a "Complete Education to Unlock" tooltip.

## Phase 4: Valid Blockchain Integration

Fix the polling and reliable event handling.

1. **Event Driven Indexer**: Refactor `IndexerService` to use `ethers.WebSocketProvider` and `contract.on('Event', ...)` instead of `setInterval`.
2. **Replay Mechanism**: Implement a "Catch-up" method that scans from `lastProcessedBlock` to `currentBlock` on startup to handle downtime.
3. **Robustness**: Add error handling for WebSocket disconnections with automatic reconnection logic.

## Phase 5: Testing & Deployment

1. **Integration Tests**: Write real integration tests using a local test database for the `Loan Flow` (Create -> Repay).
2. **CI/CD**: Set up a basic GitHub Action to run linting and tests on PRs.
3. **Deployment Specs**: Create a `render.yaml` or `Dockerfile` for production deployment.

---

**Trigger Instructions:**
To start a phase, simply say "Start Phase [X]" or "Run step [X.Y]".
