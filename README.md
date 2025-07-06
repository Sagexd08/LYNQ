# LYNQ - Decentralized Finance Platform

<div align="center">
  <img src="public/logo.ico" alt="LYNQ Logo" width="100"/>
  
  **Borrow. Build. Belong.**
  
  *A comprehensive DeFi platform built on the Aptos blockchain*

  [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
  [![Aptos](https://img.shields.io/badge/Built%20on-Aptos-00D4AA.svg)](https://aptos.dev)
  [![React](https://img.shields.io/badge/Frontend-React%2018-61DAFB.svg)](https://react.dev)
  [![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6.svg)](https://typescriptlang.org)
</div>

---

## Overview

LYNQ is a revolutionary decentralized finance platform built entirely on the Aptos blockchain. Our mission is to democratize access to financial services while maintaining the highest standards of security, compliance, and user experience. We provide innovative lending solutions for both crypto-native users and Web3 newcomers.

### Key Features

- **Dual Loan System**: Collateral-based Big Loans & Real-money-backed Small Loans
- **Web3 Onboarding**: Locked mainnet tokens for beginners
- **Reputation System**: Build onchain trust and unlock better rates
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
- npm or yarn
- Aptos Wallet (Petra, Martian, etc.)

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

---

## Smart Contract Information

### Contract Details
- **Contract Address**: `cc5e97e0015543dfac2d3e686fed214a7450e5c1efe15786dfde118987c3fbec`
- **Transaction Hash**: `0x05ba71a35eb4ce22aca3ab299f2ccf1e08690c779a5bb9fbc91bb6d48a14fd81`
- **Gas Used**: 5,978 units
- **Gas Unit Price**: 100

### Contract Functions
- `initiate_big_loan()` - Create collateral-based loan
- `initiate_small_loan()` - Create real-money backed loan
- `repay_loan()` - Repay existing loan
- `liquidate_collateral()` - Emergency liquidation
- `update_reputation()` - Reputation system management

---

## Technology Stack

### Frontend
- **React 18** - Modern UI framework
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Vite** - Lightning-fast build tool

### Blockchain
- **Aptos Blockchain** - High-performance L1
- **Move Language** - Smart contract development
- **Aptos SDK** - Blockchain integration

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Git** - Version control

---

## Roadmap

### Phase 1: Foundation (Q1 2025) ✅
- [x] Core lending platform development
- [x] Basic reputation system
- [x] Collateral-based Big Loans
- [x] Real-money Small Loans
- [x] Web3 onboarding with locked tokens
- [x] Initial compliance framework

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
