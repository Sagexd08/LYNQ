# FLYN

FLYN is a credit-first financial platform designed to help people earn access through trust.  
It starts with simple micro-credit and reputation-based limits, then evolves into a global financial system where responsible behavior unlocks greater control and ownership over money.

---

## Problem

Millions of people use modern payment apps but still lack access to fair credit.

- No credit history or rejected by banks
- Predatory lending and opaque fees
- Credit systems that don't reward good behavior early
- Financial tools that assume trust instead of helping users earn it

---

## Vision

FLYN aims to become a global trust and credit layer for individuals.

Instead of relying only on paperwork or legacy credit scores, FLYN builds trust through real financial behavior — borrowing responsibly, repaying on time, and growing access gradually.

---

## MVP Scope (v0)

The first version of FLYN focuses on one thing only:

- Phone-based user identity (mocked)
- Micro-credit issuance (₹500 – ₹5,000)
- Fixed repayment windows
- Rule-based reputation scoring
- Progressive credit limits
- Admin-controlled risk management

No UI. No blockchain. No machine learning.

---

## Core Principles

- **Trust is earned, not assumed**
- **Simple systems beat complex ideas**
- **Behavior matters more than background**
- **Build small, validate fast, scale responsibly**

---

## Tech Stack (Initial)

- Backend: Node.js + TypeScript
- Framework: NestJS
- Database: PostgreSQL
- ORM: Prisma
- API: REST
- Auth: Mock phone verification

---

## Roadmap (High-Level)

- v0: Credit engine & reputation logic
- v1: Closed pilot with real users
- v2: Stronger risk models & automation
- v3: Optional on-chain reputation & ownership

---

## Project Setup

```bash
npm install
docker-compose up -d
npx prisma migrate dev
npx prisma generate
```

## Run the Project

```bash
# development
npm run start:dev

# production
npm run start:prod
```

## Run Tests

```bash
# all tests
npm test

# specific test suite
npm test -- src/reputation/reputation.service.spec.ts

# test coverage
npm run test:cov
```

## API Endpoints

### User Management
- `POST /users` - Register new user
- `GET /users/:id` - Get user profile

### Loans
- `POST /loans` - Create loan (reputation-gated)
- `GET /loans/:id` - Get loan details

### Repayments
- `POST /repayments` - Make payment (triggers reputation update)

### Reputation
- `GET /reputation/:userId` - Get current reputation score
- `GET /reputation/:userId/history` - Get audit trail of all reputation changes

### Admin
- `GET /admin/users` - List all users
- `PATCH /admin/users/:id/status` - Block/unblock user
- `PATCH /admin/reputation/:userId` - Manual reputation adjustment
- `POST /admin/loans/:id/overdue` - Simulate overdue loan (testing)

---

## Reputation System

### How It Works

**Starting Score:** 50 points (0-100 range)

**Payment Classifications:**
- **EARLY** (≥24h before due): +12 points
- **ON_TIME** (on/before due): +10 points
- **PARTIAL** (< full amount): No change, +3 day extension (1x only)
- **LATE** (after due):
  - 1st late: -5 points
  - 2nd consecutive late: -20 points + BLOCKED

**Recovery System:**
- After 2 clean on-time cycles: Recover 50% of last penalty (capped)
- After 3 clean on-time cycles: +10 bonus (capped at pre-penalty score)

**Loan Eligibility:**
- Reputation score ≥ 30
- Not blocked
- No existing active loan
- Max loan amount = score × 20

---

## Database Schema

### Tables
1. **users** - User accounts with status tracking
2. **loans** - Loan issuance and tracking
3. **repayments** - Payment history
4. **reputation** - User reputation scores with tracking fields
5. **reputation_events** - Complete audit trail of all reputation changes

### Key Features
- Transactional mutations (ACID compliance)
- Immutable audit log for every reputation change
- Indexed queries for fast lookups

---

## Status

FLYN is in early development and active research.  
The project is intentionally minimal while core assumptions are tested.

**Current Version:** 0.0.1  
**Test Suite:** 49 tests (100% passing)  
**Git Repository:** https://github.com/Sagexd08/FLYN.git

---

## Disclaimer

This project is an early-stage experiment and not a licensed lending product.  
All credit flows are simulated until regulatory and compliance requirements are met.

---

## License

MIT
