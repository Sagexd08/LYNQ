# LYNQ - Decentralized Finance Platform

<div align="center">
  <img src="public/logo.ico" alt="LYNQ Logo" width="100"/>
  
  **Borrow. Build. Belong.**
  
  *A comprehensive multi-chain DeFi platform*

  [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
  [![Multi-Chain](https://img.shields.io/badge/Built%20on-Multi--Chain-00D4AA.svg)](https://aptos.dev)
  [![React](https://img.shields.io/badge/Frontend-React%2018-61DAFB.svg)](https://react.dev)
  [![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6.svg)](https://typescriptlang.org)
</div>

---

## Overview

LYNQ is a revolutionary decentralized finance platform supporting multiple blockchain networks. Our mission is to democratize access to financial services while maintaining the highest standards of security, compliance, and user experience. We provide innovative lending solutions for both crypto-native users and Web3 newcomers across Ethereum, Aptos, and Flow networks.

### Key Features

- **Multi-Chain Support**: Ethereum, Aptos, and Flow blockchain integration
- **Dual Loan System**: Collateral-based Big Loans & Real-money-backed Small Loans
- **Web3 Onboarding**: Locked mainnet tokens for beginners
- **Reputation System**: Build onchain trust and unlock better rates
- **Telegram Notifications**: Real-time loan updates and alerts
- **Multi-Wallet Integration**: MetaMask, Coinbase Wallet, and Flow-compatible wallets
- **Compliance First**: MiCA Framework & RBI Digital Lending Guidelines compliant
- **No-KYC Options**: Privacy-preserving financial services

---

## Architecture

### Big Loans (Collateral-Based)
- **Collateral Types**: Digital assets, NFTs, staking positions
- **Loan-to-Value Ratio**: 70-80% of collateral value
- **Features**:
  - Extended repayment windows
  - Real-time collateral monitoring
  - Automatic liquidation protection
  - Reputation-based rewards
- **Compliance**: MiCA collateral standards + RBI Digital Lending Guidelines (2022)

### Small Loans (Real-Money Backed)
- **Collateral**: Real-world money deposits
- **Target Audience**: Web3 newcomers and micro-borrowers
- **Features**:
  - Short-term, low-value loans
  - No-KYC required
  - 10% late fee structure
  - Onchain reputation building
- **Use Case**: Perfect for exploring DeFi without prior crypto exposure

### Web3 Onboarding Experience
- **Locked Mainnet Tokens**: Non-withdrawable, platform-exclusive Aptos tokens
- **Learning Environment**: Safe space to understand trading and staking
- **Developer Friendly**: Test smart contracts with mainnet behavior
- **Reputation Building**: Real onchain activity tracking
- **Compliance**: FATF Guidance (2021) compliant

---

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm, yarn, or pnpm
- Compatible Web3 wallet (MetaMask, Coinbase Wallet, Flow-compatible, etc.)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/lynq.git
cd lynq

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Environment Setup
```bash
cp .env.example .env
# Configure your environment variables
```

Required environment variables:
- `VITE_PARTICLE_PROJECT_ID` - Particle Network project ID
- `VITE_PARTICLE_CLIENT_KEY` - Particle Network client key
- `VITE_PARTICLE_APP_ID` - Particle Network app ID
- `VITE_TELEGRAM_BOT_TOKEN` - Telegram bot token for notifications (optional)
- `VITE_TELEGRAM_DEFAULT_CHAT_ID` - Default Telegram chat ID (optional)
- `VITE_DEFAULT_NETWORK` - Default network (mainnet/testnet)

---

## Multi-Chain Architecture

### Supported Blockchains

#### Ethereum (EVM)
- **Mainnet**: Production Ethereum blockchain
- **Sepolia Testnet**: Testing environment
- **Wallets**: MetaMask, Coinbase Wallet, WalletConnect
- **Smart Contracts**: Solidity-based lending contracts
- **Features**: Full EVM compatibility, gas optimization

#### Aptos
- **Network**: High-performance Aptos blockchain
- **Language**: Move smart contracts
- **Wallets**: Petra, Martian, Aptos-compatible wallets
- **Features**: 160K+ TPS capability, advanced resource management

#### Flow
- **Network**: Flow blockchain with FCL integration
- **Language**: Cadence smart contracts
- **Wallets**: Flow-compatible wallets via FCL
- **Features**: Developer-friendly architecture, composability

### Cross-Chain Features
- **Unified Interface**: Single UI for all supported blockchains
- **Multi-Wallet Support**: Connect with different wallets per chain
- **Network Switching**: Seamless switching between supported networks
- **Consistent UX**: Same lending experience across all chains

---

## Smart Contract Information

### Flow Blockchain (Cadence)

**LoanPlatform Contract**
- **Language**: Cadence
- **Location**: `contracts/LoanPlatform.cdc`

#### Contract Functions
- `createLoan()` - Create a new loan with borrower, amount, interest, and duration
- `getLoan()` - Retrieve loan details by ID
- `applyRepayment()` - Apply payment to existing loan
- `calculateTotalOwed()` - Calculate total amount owed including interest

#### Events
- `LoanCreated` - Emitted when a new loan is created
- `LoanRepaid` - Emitted when a loan is repaid

### Additional Smart Contract Platforms

#### Ethereum (EVM)
- **Status**: Integration ready
- **Standards**: ERC-20, ERC-721 compatible
- **Gas Optimization**: Advanced gas efficiency patterns

#### Aptos (Move)
- **Status**: Integration ready  
- **Standards**: Aptos Coin Standard, Token Standard
- **Resource Model**: Advanced resource safety

---

## Technology Stack

### Frontend
- **React 18** - Modern UI framework with Suspense and code splitting
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling with custom design system
- **Framer Motion** - Smooth animations and transitions
- **Vite** - Lightning-fast build tool with HMR
- **Axios** - HTTP client for API interactions
- **React Hot Toast** - Toast notifications

### Blockchain Infrastructure
- **Multi-Chain SDKs**:
  - `@onflow/fcl` - Flow blockchain integration
  - `ethers` - Ethereum/EVM integration
  - `@coinbase/wallet-sdk` - Coinbase Wallet integration
  - `@metamask/detect-provider` - MetaMask integration
- **Smart Contract Languages**:
  - Cadence (Flow)
  - Solidity (Ethereum)
  - Move (Aptos)

### Services & Integrations
- **Telegram Bot API** - Real-time notifications
- **CoinGecko API** - Market data and pricing
- **Particle Network** - Wallet infrastructure
- **Axios** - HTTP requests

### Development Tools
- **ESLint** - Code linting and quality
- **PostCSS** - CSS processing and optimization
- **pnpm/npm** - Package management
- **Git** - Version control

---

## Project Architecture

### Directory Structure

```
LYNQ/
├── contracts/           # Smart contracts
│   ├── LoanPlatform.cdc # Flow/Cadence contract
│   └── scripts/         # Deployment scripts
├── src/
│   ├── components/      # React components
│   │   ├── card/        # Loan card components
│   │   ├── dashboard/   # Dashboard views
│   │   ├── landing/     # Landing page sections
│   │   ├── loan/        # Loan management
│   │   ├── marketplace/ # Trading interface
│   │   ├── wallet/      # Wallet integration
│   │   └── hooks/       # Custom React hooks
│   ├── config/          # Configuration files
│   ├── constants/       # Constants and types
│   ├── services/        # Business logic & APIs
│   │   ├── telegramService.ts      # Telegram notifications
│   │   ├── loanRepaymentService.ts # Loan management
│   │   ├── flowLoanService.ts      # Flow integration
│   │   └── userTelegramService.ts  # User-Telegram mapping
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions
├── scripts/             # Build and deployment scripts
├── dist/                # Production build output
└── public/              # Static assets
```

### Key Components

#### Wallet Integration
- **Multi-Wallet Support**: Automatic detection and connection
- **Persistence**: Session management and auto-reconnect
- **Network Switching**: Seamless chain switching
- **Error Handling**: Comprehensive error boundaries

#### Notification System
- **Telegram Bot**: Real-time notifications via Telegram Bot API
- **User Mapping**: LocalStorage-based wallet-to-chat mapping
- **Event Types**: Loan granted, payment received, overdue alerts
- **Optional**: Graceful degradation when not configured

#### Loan Management
- **Dual System**: Big loans (collateral) and small loans (real-money)
- **Repayment Tracking**: Real-time payment application
- **State Management**: Custom hooks for loan state
- **Credit Scoring**: Trust score calculation and tracking

### Security Features
- **Input Validation**: Comprehensive validation patterns
- **Rate Limiting**: API and transaction rate limits
- **XSS Protection**: Content Security Policy
- **Error Boundaries**: React error handling
- **Audit Logging**: Security event tracking

---

## Roadmap

### Phase 1: Foundation (Q1 2025) ✅
- [x] Core lending platform development
- [x] Basic reputation system
- [x] Collateral-based Big Loans
- [x] Real-money Small Loans
- [x] Web3 onboarding with locked tokens
- [x] Initial compliance framework
- [x] **Multi-Chain Integration**
  - Ethereum/EVM support
  - Flow blockchain integration
  - Aptos blockchain support
- [x] **Wallet Infrastructure**
  - MetaMask integration
  - Coinbase Wallet support
  - Flow FCL integration
  - Auto-detection and connection
- [x] **Telegram Notifications**
  - Real-time loan status updates
  - Payment notifications
  - Overdue alerts

### Phase 2: Enhanced Features (Q2 2025)
- [ ] **No-Collateral Loans**
  - High-reputation user loans
  - Advanced credit scoring
  - Dynamic interest rates
- [ ] **Advanced Reputation System**
  - Cross-platform reputation tracking
  - Gamification elements
  - Community governance tokens
- [ ] **Mobile Application**
  - iOS and Android apps
  - Push notifications
  - Biometric authentication

### Phase 3: Financial Infrastructure (Q3 2025)
- [ ] **Enhanced DeFi Features**
  - Yield farming opportunities
  - Liquidity mining programs
  - Automated investment strategies
- [ ] **Cross-Chain Integration**
  - Ethereum bridge
  - Polygon support
  - Multi-chain collateral
- [ ] **Trading & Swapping**
  - DEX integration
  - Token swapping functionality
  - Automated market making
- [ ] **Institutional Features**
  - Corporate lending solutions
  - Bulk transaction processing
  - Advanced analytics dashboard

### Phase 4: Banking Solutions (Q4 2025)
- [ ] **Payment Infrastructure**
  - Failed UPI settlement resolution
  - Payment lag solutions
  - Stablecoin alternatives
- [ ] **Bridging Features**
  - Cross-chain asset bridging
  - Multi-network liquidity
  - Seamless chain interactions
- [ ] **Fiat Integration**
  - Seamless fiat ramps
  - Bank account linking
  - Traditional payment methods

### Phase 5: Ultimate Financial Product (Q1 2026)
- [ ] **Crypto-Native Credit Card System**
  - Direct wallet integration
  - Real-time spending limits
  - Cashback in platform tokens
  - Aptos-based transaction processing
  - Complete DeFi credit solution
- [ ] **Platform Optimization**
  - Performance enhancements
  - Advanced security features
  - User experience refinements

### Platform Completion (2026)
The LYNQ platform will reach its complete vision with the crypto-native credit card system, representing the ultimate integration of traditional finance convenience with decentralized finance innovation, all built natively on the Aptos blockchain.

---

## Market Impact

### Target Metrics
- **100K+** Active users by end of 2025
- **$50M+** Total value locked (TVL)
- **25+** Countries supported
- **99.9%** Platform uptime
- **<2 seconds** Average transaction time

### Competitive Advantages
- ✅ **Regulatory Compliance**: First-mover in MiCA compliance
- ✅ **User Experience**: Web2-like experience with Web3 benefits
- ✅ **Aptos Performance**: 160K+ TPS capability
- ✅ **Innovation**: Unique locked mainnet token system
- ✅ **Accessibility**: No-KYC options for privacy

---

## Contributing

We welcome contributions from the community! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details on how to get started.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Submit a pull request

---

## Security & Compliance

### Security Measures
- Multi-signature wallet integration
- Smart contract audits by leading firms
- Real-time monitoring and alerts
- Formal verification of critical functions

### Regulatory Compliance
- **MiCA Framework** compliance
- **RBI Digital Lending Guidelines (2022)** adherence
- **FATF Guidance (2021)** implementation
- Regular compliance audits

---

## Disclaimer

LYNQ is a DeFi platform that involves financial risk. Please ensure you understand the risks involved before using our services. This is not financial advice. Always do your own research and consider consulting with financial professionals.

---

<div align="center">
  <p><strong>Built with ❤️ by the LYNQ Team</strong></p>
  <p>Empowering the future of decentralized finance</p>
</div>
