# LYNQ Backend - Critical Issues Fix Plan

## Phase 1: CRITICAL - Decimal.js Integration
- [ ] Add `decimal.js` to `package.json`
- [ ] Create `apps/backend/src/common/utils/decimal.util.ts` - Decimal wrapper utility
- [ ] Refactor `loan.service.ts` - Replace all parseFloat with Decimal
- [ ] Refactor `risk-scoring.service.ts` - Replace all parseFloat with Decimal
- [ ] Refactor `transaction-validator.ts` - Use Decimal for validation
- [ ] Refactor `oracle.service.ts` - Use Decimal for price calculations
- [ ] Refactor `message.templates.ts` - Use Decimal for formatting

## Phase 2: HIGH - Break Circular Dependencies
- [ ] Create `apps/backend/src/modules/shared/interfaces/` - Define service interfaces
- [ ] Create `apps/backend/src/modules/shared/shared.module.ts` - Shared module
- [ ] Refactor `loan.service.ts` - Use interface injection instead of forwardRef
- [ ] Refactor `risk-scoring.service.ts` - Use interface injection
- [ ] Refactor `collateral.service.ts` - Use interface injection
- [ ] Update module imports to use proper DI patterns

## Phase 3: HIGH - Implement Real Compliance Checking
- [ ] Update `loan.service.ts` `checkComplianceDeep()` to call blacklistService
- [ ] Add fraud risk detection to compliance check
- [ ] Add on-chain wallet ownership verification stub

## Phase 4: HIGH - Add Comprehensive Tests
- [ ] Create `apps/backend/test/risk-scoring.service.spec.ts`
- [ ] Create `apps/backend/test/loan.service.spec.ts`
- [ ] Create `apps/backend/test/compliance.service.spec.ts`
- [ ] Create `apps/backend/test/dto-validation.spec.ts`
- [ ] Create `apps/backend/test/error-scenarios.spec.ts`
- [ ] Create `apps/backend/test/decimal-precision.spec.ts`

## Phase 5: MEDIUM - Fix Error Type System
- [ ] Update `app-errors.ts` - Remove `as any` with proper type assertions
- [ ] Update services to use `Result<T>` type consistently

## Phase 6: MEDIUM - Complete DTO Validation
- [ ] Update `create-loan.dto.ts` - Add Min/Max amount decorators
- [ ] Add collateral ratio validation decorator
- [ ] Add custom validator for chain enum

## Phase 7: MEDIUM - Update Documentation
- [ ] Update `README.md` - Remove false ML claims
- [ ] Document actual risk scoring algorithm

---

## Progress Tracking

### Started: [Current Date]
### Last Updated: [Current Date]
