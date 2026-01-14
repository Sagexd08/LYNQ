# Railway Deployment Review - LYNQ Backend

**Review Date:** January 14, 2026  
**Status:** ✅ Ready for Deployment

---

## 📋 Configuration Review

### Railway Configuration Files

#### 1. `railway.json` (Root Level)
- **Purpose:** Railway deployment config when deploying from repo root
- **Builder:** NIXPACKS
- **Build Command:** `cd backend && npm install --legacy-peer-deps && npm run build && npm run prisma:generate && npx prisma migrate deploy`
- **Start Command:** `cd backend && npm run start:prod`
- **Restart Policy:** ON_FAILURE (max 10 retries)
- **Status:** ✅ Correctly configured

#### 2. `backend/nixpacks.toml`
- **Purpose:** Nixpacks config when Railway root directory is set to `backend`
- **Node Version:** nodejs_22
- **Build Steps:**
  1. Install dependencies: `npm install --legacy-peer-deps`
  2. Build: `npm run build`
  3. Generate Prisma client: `npm run prisma:generate`
  4. Deploy migrations: `npx prisma migrate deploy`
- **Start Command:** `npm run start:prod`
- **Status:** ✅ Correctly configured

#### 3. `backend/railway.toml`
- **Purpose:** Railway service config
- **Builder:** NIXPACKS
- **Restart Policy:** ON_FAILURE (max 10 retries)
- **Status:** ✅ Correctly configured

---

## ✅ Deployment Readiness Checklist

### Configuration Files
- [x] `railway.json` exists and is properly formatted
- [x] `backend/nixpacks.toml` exists and configured correctly
- [x] `backend/railway.toml` exists
- [x] `backend/Dockerfile` exists (alternative deployment method)
- [x] Build commands are correct
- [x] Start commands are correct

### Build Process
- [x] Dependencies install command: `npm install --legacy-peer-deps`
- [x] Build command: `npm run build`
- [x] Prisma generate: `npm run prisma:generate`
- [x] Migrations deploy: `npx prisma migrate deploy`
- [x] Start command: `npm run start:prod` → `node dist/main`

### Environment Variables
Required environment variables (from `backend/src/config/config.module.ts`):
- [x] `NODE_ENV` (default: development)
- [x] `PORT` (default: 3000)
- [x] `DATABASE_URL` (required)
- [x] `JWT_SECRET` (required, min 32 chars)
- [x] `ML_SERVICE_URL` (default: http://localhost:5000)
- [x] `ML_API_KEY` (required, min 8 chars)
- [x] `REDIS_URL` (default: redis://localhost:6379)
- [x] Optional: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- [x] Optional: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_CHAT_ID`
- [x] Optional: `BLOCKCHAIN_RPC_URL`, `PRIVATE_KEY`, contract addresses
- [x] Optional: `CORS_ORIGIN` (default: *)

### Code Quality
- [x] TypeScript compiles without errors
- [x] All imports resolved
- [x] DTOs properly validated (chainId has @IsPositive())
- [x] CORS configured correctly
- [x] Health endpoints available (`/health`, `/health/live`, `/health/ready`)

---

## 🚀 Deployment Instructions

### Option 1: Root Directory Set to `backend` (Recommended)

1. **In Railway Dashboard:**
   - Go to Service → Settings → Root Directory
   - Set to: `backend`
   - Railway will use `backend/nixpacks.toml`

2. **Build Process:**
   - Railway will run commands from `backend/` directory
   - Uses `backend/nixpacks.toml` configuration
   - No `cd backend` needed in commands

3. **Environment Variables:**
   - Add all required variables in Railway dashboard
   - See `RAILWAY_DEPLOY.md` for complete list

### Option 2: Deploy from Root (Using railway.json)

1. **In Railway Dashboard:**
   - Keep root directory as `/` (default)
   - Railway will use `railway.json` from root

2. **Build Process:**
   - Railway will run commands with `cd backend` prefix
   - Uses `railway.json` configuration

---

## ⚠️ Important Notes

### Root Directory Configuration
- **CRITICAL:** If Railway root directory is set to `backend`, use `backend/nixpacks.toml`
- **CRITICAL:** If Railway root directory is `/`, use `railway.json`
- **Mismatch will cause build failures**

### Build Command Differences
- `railway.json`: Uses `cd backend &&` prefix
- `backend/nixpacks.toml`: No `cd` prefix (assumes root is `backend`)

### Prisma Migrations
- Migrations run automatically during build: `npx prisma migrate deploy`
- Ensure `DATABASE_URL` is set before deployment
- Migrations are production-safe (won't create new migrations)

### Port Configuration
- Application listens on `process.env.PORT || 3000`
- Railway automatically sets `PORT` environment variable
- No manual port configuration needed

---

## 🔍 Verification Steps

After deployment, verify:

1. **Health Check:**
   ```bash
   curl https://your-app.railway.app/health
   ```

2. **API Documentation:**
   ```bash
   curl https://your-app.railway.app/docs
   ```

3. **Database Connection:**
   - Check logs for Prisma connection success
   - Verify migrations ran successfully

4. **ML Service Connection:**
   ```bash
   curl https://your-app.railway.app/api/v1/ml/health \
     -H "X-API-KEY: your-ml-api-key"
   ```

---

## 📝 Recent Changes

### Files Modified (Ready to Commit)
1. **backend/src/main.ts**
   - Simplified CORS configuration
   - Supports comma-separated origins
   - Credentials enabled

2. **backend/contracts/hardhat.config.ts**
   - Fixed localhost URL format

3. **backend/src/loans/dto/activate-loan.dto.ts**
   - Added `@IsPositive()` validator to `chainId`
   - Changed `amount` to string type with `@IsNumberString()`

### Files Created
- `CODEBASE_REVIEW.md` - Comprehensive codebase review
- `RAILWAY_DEPLOYMENT_REVIEW.md` - This file

---

## ✅ Deployment Status

**Status:** ✅ **READY FOR DEPLOYMENT**

All configuration files are correct and properly formatted. The application is ready to be deployed to Railway.

### Next Steps:
1. ✅ Review this document
2. ⚠️ Set Railway root directory appropriately (`backend` recommended)
3. ⚠️ Add all required environment variables
4. 🚀 Push to GitHub (Railway will auto-deploy)
5. ✅ Verify deployment using health checks

---

## 🆘 Troubleshooting

### Build Fails: "Cannot find module"
- **Cause:** Root directory mismatch
- **Fix:** Ensure Railway root directory matches config file location

### Migrations Fail
- **Cause:** DATABASE_URL not set or incorrect
- **Fix:** Verify DATABASE_URL in Railway environment variables

### Application Won't Start
- **Cause:** Missing required environment variables
- **Fix:** Check logs for validation errors, add missing variables

### CORS Errors
- **Cause:** CORS_ORIGIN not configured for production domain
- **Fix:** Set CORS_ORIGIN to your frontend domain(s)

---

**Review Completed:** January 14, 2026  
**Deployment Ready:** ✅ Yes  
**Action Required:** Set Railway root directory and environment variables
