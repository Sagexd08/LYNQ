# 🔐 LYNQ Security Checklist

## ⚠️ CRITICAL SECURITY ISSUES TO FIX BEFORE DEPLOYMENT

### 1. Exposed Credentials in .env File
**STATUS:** ❌ **IMMEDIATE ACTION REQUIRED**

The following sensitive credentials are currently in your `.env` file:
- ✅ AWS Access Keys (rotate these immediately)
- ✅ Database credentials (Supabase password visible)
- ✅ Telegram Bot Token
- ✅ JWT Secret (too simple)

**Actions Required:**
```bash
# 1. Generate a strong JWT secret
openssl rand -base64 64

# 2. Rotate AWS credentials
# Go to AWS Console → IAM → Security Credentials → Create New Access Key

# 3. Regenerate Telegram Bot Token (if exposed publicly)
# Talk to @BotFather on Telegram → /revoke → /token

# 4. Update Supabase password
# Go to Supabase Dashboard → Settings → Database → Reset Password
```

### 2. Blockchain Configuration Issues
**STATUS:** ❌ **MUST FIX**

Current issues:
- Private keys set to placeholder values
- Contract addresses not deployed (0x000...000)
- Using test RPC URLs

**Actions Required:**
1. **Deploy Smart Contracts to Mantle Sepolia:**
   ```bash
   cd backend/contracts
   # Add your actual private key to .env with Mantle Sepolia testnet MNT
   pnpm run deploy --network mantleSepolia
   # Copy deployed contract addresses to .env
   ```

2. **Get Mantle Sepolia MNT tokens:**
   - Visit: https://faucet.sepolia.mantle.xyz/
   - Enter your wallet address
   - Receive testnet MNT

3. **Update .env with deployed addresses:**
   ```bash
   LOAN_CORE_ADDRESS=0x<deployed-loan-core-address>
   COLLATERAL_VAULT_ADDRESS=0x<deployed-vault-address>
   ```

### 3. CORS Configuration
**STATUS:** ⚠️ **NEEDS CONFIGURATION**

Current setting: `CORS_ORIGIN=*` (allows ANY origin)

**For Development:**
```env
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

**For Production:**
```env
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
```

Update in [main.ts](backend/src/main.ts#L10-L13):
```typescript
app.enableCors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-KEY'],
  credentials: true, // Add this for cookies/auth
});
```

### 4. Environment File Location
**STATUS:** ✅ **WORKING** (but could be improved)

Currently using root `.env` file. Backend `app.module.ts` correctly looks for it.

**Optional Improvement:**
Create `backend/.env` for backend-specific variables:
```bash
cp .env backend/.env
```

Update `backend/src/app.module.ts`:
```typescript
ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: ['.env.local', '.env'],
  expandVariables: true,
}),
```

### 5. Rate Limiting Configuration
**STATUS:** ✅ **CONFIGURED** (but verify limits)

Current limits in [app.module.ts](backend/src/app.module.ts#L26-L39):
- Short: 3 requests per second
- Medium: 20 requests per 10 seconds
- Long: 100 requests per minute

**Consider adjusting for production:**
```typescript
ThrottlerModule.forRoot([
  {
    name: 'short',
    ttl: 1000,
    limit: 10, // Increased
  },
  {
    name: 'medium',
    ttl: 10000,
    limit: 50, // Increased
  },
  {
    name: 'long',
    ttl: 60000,
    limit: 200, // Increased for authenticated users
  },
]),
```

### 6. Database Security
**STATUS:** ⚠️ **VERIFY CONFIGURATION**

Checks:
- [ ] SSL/TLS enabled for database connections (Supabase has this by default)
- [ ] Connection pooling configured
- [ ] Database password is strong and rotated
- [ ] RLS (Row Level Security) policies configured in Supabase

**Verify Prisma Connection:**
```bash
cd backend
pnpm prisma db pull  # Verify connection
pnpm prisma generate # Regenerate client
```

### 7. JWT Security
**STATUS:** ⚠️ **NEEDS IMPROVEMENT**

Current JWT secret: `28c9f3c1-bd4c-4b5c-93a0-beaa7e5da7c3` (UUID format, but exposed)

**Best Practices:**
```bash
# Generate a stronger secret
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"

# Add to .env
JWT_SECRET=<generated-secret>
JWT_EXPIRATION=7d  # Consider shorter for production
JWT_REFRESH_EXPIRATION=30d  # Add refresh token support
```

**Implement Refresh Tokens:**
See: [auth.service.ts](backend/src/auth/auth.service.ts) - add refresh token logic

---

## 📋 Pre-Deployment Checklist

### Environment Configuration
- [ ] All placeholder values in `.env` replaced with real credentials
- [ ] `.env` file is NOT committed to git (verify: `git ls-files .env` returns nothing)
- [ ] `.env.example` updated with correct variable names and structure
- [ ] Strong JWT secret generated and set
- [ ] CORS origin set to specific domains
- [ ] NODE_ENV=production for production deployments

### Blockchain Setup
- [ ] Smart contracts deployed to Mantle Sepolia
- [ ] Contract addresses updated in `.env`
- [ ] Wallet has sufficient MNT for gas fees
- [ ] Private key stored securely (use AWS Secrets Manager or similar in production)
- [ ] Contract verification on Mantle Explorer completed

### Database
- [ ] Database migrations run successfully
- [ ] Connection string uses connection pooling
- [ ] Backup strategy configured
- [ ] Database password rotated if exposed

### Dependencies
- [ ] All dependencies up to date (`pnpm audit`)
- [ ] No critical vulnerabilities (`pnpm audit --audit-level critical`)
- [ ] Production dependencies only (`pnpm prune --prod`)

### API Security
- [ ] API keys rotated if exposed
- [ ] Rate limiting configured appropriately
- [ ] Authentication middleware applied to protected routes
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (Prisma handles this)
- [ ] XSS protection enabled

### Telegram Bot
- [ ] Bot token not exposed publicly
- [ ] Webhook secret is strong
- [ ] Admin chat ID correct
- [ ] Webhook URL configured with HTTPS

### Monitoring & Logging
- [ ] Error logging configured (consider Sentry)
- [ ] Health check endpoints working (`/health`, `/health/live`, `/health/ready`)
- [ ] Metrics collection enabled
- [ ] Alert system for critical errors

---

## 🚀 Deployment Steps (Production)

### 1. Deploy Smart Contracts
```bash
cd backend/contracts
# Ensure private key is funded with MNT
pnpm run deploy --network mantleSepolia
# Note down contract addresses
```

### 2. Update Environment Variables
```bash
# Update .env with deployed contract addresses
# Rotate all secrets
# Set CORS_ORIGIN to production domain
# Set NODE_ENV=production
```

### 3. Build Application
```bash
cd backend
pnpm install --prod
pnpm run build
pnpm prisma generate
pnpm prisma migrate deploy
```

### 4. Start Services
```bash
# Start Redis (required for BullMQ)
docker-compose up -d redis

# Start ML Service
cd backend/ml-service
docker-compose up -d

# Start Backend
cd backend
pnpm run start:prod
```

### 5. Verify Deployment
```bash
# Health check
curl http://localhost:3000/health

# API documentation
curl http://localhost:3000/docs

# Test authentication
curl -X POST http://localhost:3000/api/v1/auth/wallet/challenge \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"0x..."}'
```

---

## 🔍 Security Audit Recommendations

1. **Code Review:**
   - Review all `@Public()` decorators - ensure they're intentional
   - Check for hardcoded credentials
   - Verify all user inputs are validated

2. **Dependency Audit:**
   ```bash
   pnpm audit
   pnpm outdated
   ```

3. **Infrastructure:**
   - Use environment-specific secrets management
   - Enable firewall rules
   - Use HTTPS everywhere
   - Implement DDoS protection

4. **Monitoring:**
   - Set up application monitoring
   - Configure log aggregation
   - Enable error tracking
   - Set up uptime monitoring

---

## 📞 Incident Response

If credentials are exposed:
1. **Immediately rotate all secrets**
2. **Revoke exposed tokens/keys**
3. **Check logs for unauthorized access**
4. **Update .env with new credentials**
5. **Force logout all users** (invalidate JWT tokens)
6. **Document the incident**

---

## ✅ Quick Verification Script

```bash
#!/bin/bash
# Save as security-check.sh and run before deployment

echo "🔐 LYNQ Security Check"
echo "====================="

# Check if .env is not tracked
if git ls-files .env | grep -q ".env"; then
    echo "❌ .env is tracked by git - REMOVE IT!"
else
    echo "✅ .env not tracked by git"
fi

# Check for placeholder values
if grep -q "your-.*-key" .env 2>/dev/null; then
    echo "⚠️  Found placeholder values in .env"
else
    echo "✅ No obvious placeholders in .env"
fi

# Check contract addresses
if grep -q "0x0000000000000000000000000000000000000000" .env 2>/dev/null; then
    echo "❌ Contract addresses not deployed"
else
    echo "✅ Contract addresses configured"
fi

# Check CORS
if grep -q "CORS_ORIGIN=\*" .env 2>/dev/null; then
    echo "⚠️  CORS allows all origins"
else
    echo "✅ CORS configured"
fi

echo "====================="
echo "Review warnings above before deploying!"
```

Save this and run: `bash security-check.sh`
