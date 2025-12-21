# LYNQ Backend - NestJS API

Multi-chain DeFi lending platform backend built with NestJS, TypeORM, and PostgreSQL.

## 🏗️ Architecture

### Tech Stack
- **Framework**: NestJS 11.x
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT with Passport
- **Validation**: class-validator + class-transformer
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest + Supertest
- **Security**: Helmet, CORS
- **Logging**: Winston

### Project Structure
```
src/
├── common/
│   ├── filters/          # Global exception filters
│   └── interceptors/     # Global interceptors (logging, etc.)
├── config/
│   └── env.validation.ts # Environment variable validation
├── modules/
│   ├── auth/            # Authentication & authorization
│   ├── user/            # User management
│   ├── loan/            # Loan operations
│   ├── collateral/      # Collateral management
│   ├── ml/              # ML risk assessment
│   └── health/          # Health check endpoints
├── services/            # Shared services (blockchain, flash loans, etc.)
├── utils/               # Utility functions
├── app.module.ts        # Root module
└── main.ts              # Application bootstrap
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- pnpm (recommended) or npm

### Environment Setup

1. Copy the example environment file:
```powershell
cp .env.example .env
```

2. Configure required environment variables in `.env`:
```env
# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=lynq

# JWT
JWT_SECRET=your-super-secret-key-change-this

# CORS (tightened)
FRONTEND_URL=http://localhost:3001
ADMIN_URL=http://localhost:3002
CORS_ORIGINS=http://localhost:3001,http://localhost:3002

# Observability
SENTRY_DSN=optional-dsn
ENABLE_SWAGGER=true
LOG_LEVEL=debug
```

### Installation

```powershell
cd apps/backend
npm install
```

### Running the App

```powershell
# Development mode with hot reload
npm run dev

# Production mode
npm run build
npm run start
```

The API will be available at:
- **API**: http://localhost:3000/api/v1
- **Swagger Docs**: http://localhost:3000/api/docs (toggle via `ENABLE_SWAGGER`)
- **Health Check**: http://localhost:3000/api/v1/health

### Migrations (TypeORM)

```powershell
# Generate a migration
pnpm --filter @lynq/backend run migration:generate -- src/migrations/<MigrationName>

# Run migrations
pnpm --filter @lynq/backend run migration:run

# Revert last migration
pnpm --filter @lynq/backend run migration:revert
```

## 📚 API Documentation

### Endpoints Overview

#### Health
- `GET /api/v1/health` - Health check with DB status

#### Authentication
- `POST /api/v1/auth/wallet` - Wallet-based authentication
- `POST /api/v1/auth/email` - Email/password authentication
- `GET /api/v1/auth/profile` - Get current user profile

#### Users
- `GET /api/v1/users/me` - Get current user
- `PUT /api/v1/users/me` - Update current user
- `GET /api/v1/users/:id` - Get user by ID

#### Loans
- `POST /api/v1/loans` - Create loan
- `GET /api/v1/loans/user/:userId` - Get user loans
- `GET /api/v1/loans/:id` - Get loan by ID
- `PATCH /api/v1/loans/:id/status` - Update loan status
- `POST /api/v1/loans/:id/repay` - Repay loan

#### Collateral
- `POST /api/v1/collateral` - Add collateral
- `GET /api/v1/collateral/user/:userId` - Get user collateral
- `GET /api/v1/collateral/:id` - Get collateral by ID

#### ML/Risk
- `POST /api/v1/ml/assess-risk` - Assess loan risk
- `GET /api/v1/ml/trust-score/:userId` - Get user trust score

#### Telegram Notifications
- `GET /api/v1/telegram/status` - Check bot status
- `POST /api/v1/telegram/register` - Register for notifications (auth required)
- `DELETE /api/v1/telegram/unregister` - Unregister from notifications (auth required)
- `GET /api/v1/telegram/preferences` - Get notification preferences (auth required)
- `PUT /api/v1/telegram/preferences` - Update preferences (auth required)
- `POST /api/v1/telegram/test` - Send test notification (auth required)
- `POST /api/v1/telegram/webhook` - Telegram webhook endpoint

### Interactive Documentation

Full interactive API documentation is available at `/api/docs` when the server is running.

## 📱 Telegram Integration

LYNQ supports Telegram notifications for real-time updates on your DeFi activities.

### Setup

1. **Get Bot Token**: The bot token is already configured. If you need your own bot:
   - Message [@BotFather](https://t.me/BotFather) on Telegram
   - Create a new bot with `/newbot`
   - Copy the token to your `.env` file

2. **Configure Environment**:
   ```env
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   ```

3. **Get Your Chat ID**:
   - Message your bot with `/start`
   - The bot will reply with your Chat ID
   - Use this Chat ID to register in the LYNQ app

### Notification Types

| Type | Description |
|------|-------------|
| `LOAN_CREATED` | New loan request created |
| `LOAN_APPROVED` | Loan approved |
| `LOAN_ACTIVATED` | Loan activated with collateral |
| `LOAN_REPAID` | Loan fully repaid |
| `LOAN_LIQUIDATED` | Loan position liquidated |
| `LOAN_DUE_SOON` | Loan due in 3 days |
| `LOAN_OVERDUE` | Loan payment overdue |
| `HEALTH_FACTOR_WARNING` | Health factor below 1.5 |
| `HEALTH_FACTOR_CRITICAL` | Health factor below 1.2 |
| `LIQUIDATION_RISK` | Imminent liquidation risk |
| `CREDIT_SCORE_UPDATED` | Credit score changed |
| `TIER_UPGRADED` | Reputation tier upgraded |
| `TIER_DOWNGRADED` | Reputation tier downgraded |
| `VOUCH_RECEIVED` | Received a vouch from another user |
| `DEPOSIT_CONFIRMED` | Deposit transaction confirmed |
| `WITHDRAWAL_CONFIRMED` | Withdrawal transaction confirmed |

### Bot Commands

Users can interact with the bot using these commands:
- `/start` - Get your Chat ID for registration
- `/help` - Show available commands
- `/status` - Check connection status
- `/stop` - Disable notifications

### Webhook Setup (Optional)

For production, set up a webhook to receive bot commands:
```bash
POST /api/v1/telegram/webhook/set
{
  "url": "https://your-domain.com/api/v1/telegram/webhook"
}
```

## 🧪 Testing

### Unit Tests
```powershell
# Run all unit tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### E2E Tests
```powershell
# Run e2e tests
npm run test:e2e
```

### Test Structure
- **Unit tests**: `src/**/*.spec.ts` - Test individual services/controllers
- **E2E tests**: `test/**/*.e2e-spec.ts` - Test complete request flows

## 🔒 Security

### Implemented Security Measures
- **Helmet**: Security headers
- **CORS**: Configured for specific origins
- **Rate Limiting**: Throttling (can be added via @nestjs/throttler)
- **Validation**: Request DTO validation with whitelist
- **JWT**: Secure token-based authentication
- **Password Hashing**: bcrypt for password storage

### Environment Variables
All sensitive configuration is managed through environment variables validated at startup.

## 🏛️ Database

### TypeORM Entities
- `User` - User accounts and wallet addresses
- `Loan` - Loan records
- `Collateral` - Collateral assets

### Migrations
```powershell
# Generate migration
npm run typeorm migration:generate -- -n MigrationName

# Run migrations
npm run typeorm migration:run

# Revert migration
npm run typeorm migration:revert
```

## 📊 Monitoring & Logging

### Logging
- Winston logger configured for file and console output
- Request/response logging via interceptor
- Error logging with stack traces

### Health Checks
The `/health` endpoint provides:
- Application status
- Database connectivity
- Timestamp

## 🔧 Development

### Code Quality
```powershell
# Linting
npm run lint

# Formatting
npm run format
```

### Module Structure
Each feature module follows this structure:
```
module/
├── controllers/       # HTTP controllers
├── services/         # Business logic
├── entities/         # TypeORM entities
├── dto/              # Data transfer objects
├── guards/           # Authorization guards (if needed)
└── module.ts         # Module definition
```

## 🚢 Deployment

### Build
```powershell
npm run build
```

### Production Environment
Ensure all required environment variables are set:
- Set `NODE_ENV=production`
- Use strong `JWT_SECRET`
- Configure proper database credentials
- Set `DB` synchronize to `false` and use migrations

### Docker
(Add Docker configuration as needed)

## 📝 Contributing

1. Follow NestJS best practices
2. Write tests for new features
3. Update Swagger documentation
4. Validate environment changes in `.env.example`
5. Run linter before committing

## 📄 License

[Your License Here]

## 🆘 Support

For issues and questions:
- Check `/api/docs` for API documentation
- Review logs in `logs/` directory
- Check health endpoint for system status
