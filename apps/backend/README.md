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
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=lynq

# JWT
JWT_SECRET=your-super-secret-key-change-this

# CORS
FRONTEND_URL=http://localhost:3001
ADMIN_URL=http://localhost:3002
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
- **Swagger Docs**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/api/v1/health

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

### Interactive Documentation

Full interactive API documentation is available at `/api/docs` when the server is running.

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
