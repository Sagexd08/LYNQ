# Frontend-Backend Integration

This document describes how the frontend connects to the LYNQ backend API.

## Setup

1. **Environment Variables**

Create a `.env` file in `frontend/landing-v2/`:

```env
VITE_API_URL=http://localhost:3000/api/v1
```

2. **Install Dependencies**

```bash
cd frontend/landing-v2
npm install
```

## API Client

The API client is located in `src/lib/api/client.ts` and provides:

- Automatic token management
- Request/response interceptors
- Error handling with toast notifications
- Type-safe API calls

## Authentication Flow

1. User clicks "Connect Wallet"
2. Frontend requests MetaMask connection
3. Backend generates challenge (`POST /auth/wallet/challenge`)
4. User signs message with wallet
5. Frontend sends signature (`POST /auth/wallet/verify`)
6. Backend returns JWT token
7. Token stored in localStorage and used for all subsequent requests

## Available Hooks

### `useAuth()`
- `connectWallet()` - Connect wallet and authenticate
- `disconnect()` - Logout
- `profile` - Current user profile
- `isAuthenticated` - Auth status

### `useLoans()`
- `loans` - List of user loans
- `createLoan()` - Create new loan
- `repayLoan()` - Repay a loan
- `isLoading` - Loading state

### `useRisk()`
- `evaluateRisk()` - Evaluate loan risk
- `riskData` - Risk assessment data

## Protected Routes

Use the `ProtectedRoute` component to protect routes:

```tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

<ProtectedRoute>
  <YourComponent />
</ProtectedRoute>
```

## API Endpoints Used

- `POST /api/v1/auth/wallet/challenge` - Get signature challenge
- `POST /api/v1/auth/wallet/verify` - Verify signature and login
- `GET /api/v1/auth/me` - Get current user profile
- `POST /api/v1/loans` - Create loan
- `GET /api/v1/loans` - Get user loans
- `GET /api/v1/loans/:id` - Get loan details
- `POST /api/v1/loans/:id/repay` - Repay loan
- `POST /api/v1/risk/evaluate` - Evaluate risk

## Error Handling

All API errors are automatically handled by the client interceptor and displayed as toast notifications. Common errors:

- `401` - Unauthorized (token expired/invalid)
- `403` - Forbidden
- `422` - Validation error
- `500` - Server error

## Type Safety

All API types are defined in `src/lib/api/types.ts` and match the backend DTOs.
