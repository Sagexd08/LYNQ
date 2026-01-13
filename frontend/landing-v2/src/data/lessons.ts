import { Lesson } from '@/types';

export const LESSONS: Lesson[] = [
  {
    id: 'lesson-1',
    title: 'What Is DeFi Lending?',
    description: 'Learn the fundamentals of decentralized finance and peer-to-peer lending',
    content: `
# What Is DeFi Lending?

DeFi lending allows you to lend and borrow cryptocurrency without traditional banks.

## Key Concepts:
- **Peer-to-peer**: Direct transactions between users
- **Smart contracts**: Automated, trustless agreements
- **Collateral**: Assets you lock to borrow
- **Interest rates**: Determined by supply and demand

## Why It Matters:
- No credit checks required
- Access capital globally
- Earn interest on idle assets
- Full transparency on-chain
    `,
    duration: '5 min',
    reputation: 5,
    quiz: [
      {
        id: 'q1',
        question: 'What makes DeFi lending different from traditional lending?',
        options: [
          'It requires credit checks',
          'It uses smart contracts for trustless transactions',
          'It has fixed interest rates',
          'It only works with fiat currency',
        ],
        correctIndex: 1,
        explanation:
          'DeFi lending uses smart contracts to enable trustless, peer-to-peer transactions without intermediaries.',
      },
      {
        id: 'q2',
        question: 'What is collateral in DeFi lending?',
        options: [
          'The interest you earn',
          'Assets you lock up to borrow',
          'The lending platform fee',
          'Your credit score',
        ],
        correctIndex: 1,
        explanation: 'Collateral is the asset you lock up in a smart contract to secure a loan.',
      },
    ],
  },
  {
    id: 'lesson-2',
    title: 'Market Dynamics & Interest Rates',
    description: 'Understand how supply, demand, and utilization affect lending rates',
    content: `
# Market Dynamics & Interest Rates

Interest rates in DeFi are dynamic and determined by real-time market conditions.

## Supply & Demand:
- More borrowers → Higher rates
- More lenders → Lower rates
- **Utilization rate** = Borrowed / Total Supply

## Rate Models:
- Linear models (most common)
- Kinked models (optimal utilization)
- Dynamic adjustments every block

## Real Example:
If a pool has 1M USDC:
- 700K borrowed = 70% utilization
- Higher utilization = Higher borrow rate
- Lenders earn more when utilization is high
    `,
    duration: '7 min',
    reputation: 5,
    quiz: [
      {
        id: 'q3',
        question: 'What happens to interest rates when utilization increases?',
        options: [
          'Rates decrease for everyone',
          'Borrow rates increase, supply rates increase',
          'Nothing changes',
          'Only supply rates increase',
        ],
        correctIndex: 1,
        explanation:
          'Higher utilization means more demand for borrowing, so both borrow and supply rates increase.',
      },
    ],
  },
  {
    id: 'lesson-3',
    title: 'Risk Management & Liquidations',
    description: 'Master collateral ratios, health factors, and liquidation mechanics',
    content: `
# Risk Management & Liquidations

Understanding risk is critical to successful DeFi lending.

## Key Metrics:
- **LTV (Loan-to-Value)**: Loan amount / Collateral value
- **Health Factor**: Collateral / (Loan × Liquidation Threshold)
- **Liquidation Threshold**: When your position gets liquidated

## Example:
- You supply 1 ETH ($2000) as collateral
- You borrow 1000 USDC
- LTV = 50%, Max LTV = 80%
- If ETH drops below $1250, you get liquidated

## Risk Management:
- Keep health factor above 1.5
- Monitor asset volatility
- Set price alerts
- Use stop-losses
    `,
    duration: '10 min',
    reputation: 10,
    sandboxTask: 'supply-and-borrow',
    quiz: [
      {
        id: 'q4',
        question: 'What is the health factor?',
        options: [
          'Your credit score',
          'Ratio of collateral value to borrowed value',
          'Annual percentage yield',
          'Transaction fee percentage',
        ],
        correctIndex: 1,
        explanation: 'Health factor measures how safe your position is. Below 1.0 means liquidation.',
      },
    ],
  },
  {
    id: 'lesson-4',
    title: 'Building Your On-Chain Reputation',
    description: 'Learn how borrowing behavior creates your DeFi credit score',
    content: `
# Building Your On-Chain Reputation

Your on-chain actions create a transparent credit history.

## Reputation Factors:
1. **Payment History** (40%): On-time repayments
2. **Utilization** (30%): How much you borrow vs limit
3. **Account Age** (15%): Time since first transaction
4. **Diversity** (10%): Different assets used
5. **Defaults** (5%): Liquidation history

## Benefits:
- Lower interest rates
- Higher borrowing limits
- Access to premium features
- Community trust

## How to Build:
- Make consistent repayments
- Keep utilization below 50%
- Interact with multiple protocols
- Avoid liquidations
    `,
    duration: '8 min',
    reputation: 10,
  },
  {
    id: 'lesson-5',
    title: 'Advanced Strategies',
    description: 'Leverage, yield farming, and portfolio optimization',
    content: `
# Advanced Strategies

Take your DeFi lending to the next level.

## Leverage:
- Borrow → Supply → Borrow again
- Amplify returns (and risks)
- Requires careful monitoring

## Yield Farming:
- Supply to high-APY pools
- Compound rewards automatically
- Balance risk vs reward

## Portfolio Strategies:
- Diversify across assets
- Balance stable and volatile assets
- Regular rebalancing
- Risk-adjusted returns

## Warning:
Advanced strategies amplify both gains AND losses.
Start small, learn continuously, manage risk.
    `,
    duration: '12 min',
    reputation: 15,
  },
];
