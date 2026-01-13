# FLYN – Behavioral Credit Rules (v0.1)

## Target User Reality (Important Context)

Age 18–25 means:
- Irregular income
- Parental dependence
- Emotional spending
- Poor time management (not malice)
- High stress, low buffer

So your system must:
- Be **firm**
- But **forgiving**
- And **predictable**

> Banks fail here. You shouldn't.

---

## 1️⃣ What happens if a user pays 1 day late?

### Rule
- Loan marked `late`
- Reputation penalty: **−5**
- User remains eligible for future loans
- No blocking
- No compounding punishment

### Reasoning
- One-day delay at this age is normal, not risky.
- Punishing harshly creates resentment and churn.
- Late ≠ untrustworthy
- Repeated late = signal

---

## 2️⃣ What if they pay partially?

### Rule
- Loan remains `active`
- Reputation impact: **neutral (0 change)**
- Remaining balance carries forward
- Due date extends once (fixed extension, e.g. +3 days)

### Reasoning
- Partial payment shows intent to repay.
- That matters more than perfection.
- This is where most BNPL apps fail — they treat partial payers like defaulters.

### ⚠️ Hard Limit (Abuse Prevention)
> **Partial extension allowed only once per loan.**
> Second partial payment without full repayment → treated as `late`.

This prevents users from gaming the system with repeated minimal payments.

---

## 3️⃣ What if they pay early?

### Rule
- Loan closed early
- Reputation reward: **+12**
- Next loan eligibility increases immediately
- Optional: cooldown reduction

### ⚠️ Early Repayment Threshold
> **Early repayment = paid ≥24 hours before due date.**

Paying 1 hour early ≠ 5 days early. The 24-hour threshold prevents edge-case confusion.

### Reasoning
- Early repayment = high trust signal
- At this age, early payment is rare and should be rewarded disproportionately.
- This creates positive reinforcement, not fear.

---

## 4️⃣ What if they miss twice in a row?

### Rule
- Second consecutive late → `high-risk`
- Reputation penalty: **−20**
- New loans blocked temporarily
- User must fully repay outstanding balance before re-entry

### Reasoning
- Patterns matter more than incidents.
- Two misses in a row indicates behavioral instability, not a bad day.
- Blocking here protects:
  - Your capital
  - The user from digging a deeper hole

### ⚠️ Reset Rule (Critical)
> **Any clean cycle resets `consecutiveLateCount = 0`.**

Without this explicit reset, users may never recover logically even if forgiveness is your intent.

---

## 5️⃣ How long before forgiveness?

### Definition (MANDATORY)
> **Clean cycle = a loan that is fully repaid on or before the due date without partial payments.**

Partial repayment does NOT count as clean. This prevents users from gaming forgiveness mechanics.

### Rule
- After 2 consecutive on-time repayments:
  - Previous penalties decay by **50%**
- After 4 clean cycles:
  - Past late flags are ignored

### Reasoning
- Young users need a path to redemption.
- If the system never forgives, they disengage permanently.
- Forgiveness is controlled, not free.

---

## 6️⃣ How does trust recover?

### Trust Recovery Formula
Trust recovers through **consistent behavior**, not time.

### Recovery Signals (ranked strongest to weakest):
1. Early repayment
2. On-time repayment streak
3. Partial-but-consistent repayment
4. Reduced loan size voluntarily
5. Long inactivity (weak signal)

### Rule-based Recovery
- **+5** per clean cycle
- **+10** bonus after 3 clean cycles
- Caps at previous max trust level (no instant jump)

### ⚠️ Recovery Cap Precision
> **Trust recovery cannot exceed the highest score achieved before the last penalty, not the lifetime max.**

This prevents:
- Infinite upward drift
- Users gaming recovery loops

### Reasoning
This prevents gaming while encouraging patience.

---

## 7️⃣ Reputation Summary Table (Use This)

| Action                     | Score Impact |
|----------------------------|--------------|
| New user                   | 50           |
| Pay early                  | +12          |
| Pay on time                | +10          |
| 1-day late                 | −5           |
| Partial payment            | 0            |
| Late twice consecutively   | −20          |
| Clean cycle (recovery)     | +5           |
| 3 clean cycles             | +10 bonus    |

---

## 8️⃣ Blocking Philosophy (Very Important)

### You should **never** block users because:
- They're young
- They made one mistake
- They were honest

### You should block users when:
- Patterns indicate risk
- They ignore communication
- They escalate loan sizes irresponsibly

> **Block = pause, not punishment.**

---

## 9️⃣ Why this works for your age group

This system:
- Teaches responsibility
- Rewards effort
- Allows mistakes
- Prevents spirals
- Builds long-term trust

Most apps:
- Punish once
- Extract fees
- Lose users forever

**You're building financial maturity, not debt traps.**

---

## Final blunt advice (don't ignore this)

If your system feels:
- **Too kind** → you'll lose money
- **Too harsh** → you'll lose users

The rules above hit the correct middle for 18–25.
