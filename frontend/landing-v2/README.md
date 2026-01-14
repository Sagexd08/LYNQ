# LYNQ Frontend

Modern web interface for the LYNQ DeFi lending platform with AI-powered risk assessment.

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **TailwindCSS** for styling
- **Ethers.js** for blockchain interaction
- **React Router** for navigation

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will run on `http://localhost:5173` (or the port shown in terminal).

## Environment Variables

Create a `.env` file in this directory:

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_CHAIN_ID=11155111
VITE_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
```

## Building for Production

```bash
npm run build
npm run preview  # Preview production build
```

## Features

- **Wallet Authentication** - Connect with MetaMask/WalletConnect
- **Loan Management** - Create, view, and repay loans
- **Risk Assessment** - Real-time AI-powered credit scoring
- **Multi-chain Support** - Ethereum Sepolia, Polygon Amoy testnets
- **Telegram Integration** - Loan notifications and updates

## API Integration

The frontend connects to the NestJS backend API. See main README for API documentation.
