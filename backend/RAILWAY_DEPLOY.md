# Railway Deployment Guide for LYNQ Backend

## Prerequisites
- Railway account (https://railway.app)
- GitHub repository connected
- Supabase database configured
- ML Service deployed and accessible

## Step 1: Create Railway Project

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your LYNQ repository
5. Select the `backend` directory as the root directory (or deploy from root with build command)

## Step 2: Add Services

### Add PostgreSQL (if not using Supabase)
- Click "New" → "Database" → "PostgreSQL"
- Railway will automatically create a `DATABASE_URL` variable

### Add Redis
- Click "New" → "Database" → "Redis"
- Railway will automatically create a `REDIS_URL` variable

## Step 3: Configure Environment Variables

In Railway dashboard, go to your service → Variables tab and add:

### Required Variables:
```env
NODE_ENV=production
PORT=3000

# Database (from Supabase or Railway PostgreSQL)
DATABASE_URL=postgresql://user:password@host:5432/database?schema=public

# JWT Authentication
JWT_SECRET=your-secret-key-min-32-characters-long
JWT_EXPIRATION=24h

# ML Service (your deployed ML service URL)
ML_SERVICE_URL=https://your-ml-service.railway.app
# OR if ML service is on different server:
ML_SERVICE_URL=http://your-ml-service-ip:8000

ML_API_KEY=your-ml-api-key-from-ml-service

# Redis (from Railway Redis service)
REDIS_URL=redis://default:password@host:port

# Supabase (if using Supabase features)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# CORS
CORS_ORIGIN=https://your-frontend-domain.com
```

### Optional Variables:
```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_ADMIN_CHAT_ID=your-chat-id

# Blockchain
BLOCKCHAIN_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your-key
BLOCKCHAIN_RPC_URL_POLYGON=https://polygon-mainnet.g.alchemy.com/v2/your-key
PRIVATE_KEY=your-private-key
LOAN_CORE_ADDRESS=0x...
COLLATERAL_VAULT_ADDRESS=0x...
```

## Step 4: Configure Build Settings

Railway will automatically detect the `railway.json` or `railway.toml` file.

**Root directory:** If deploying from repo root, set root directory to `backend` in Railway settings.

**Build command:** Railway will use the buildCommand from railway.json:
```
cd backend && npm ci && npm run build && npm run prisma:generate && npx prisma migrate deploy
```

**Start command:** Railway will use:
```
cd backend && npm run start:prod
```

## Step 5: Deploy

1. Railway will automatically deploy when you push to your main branch
2. Or click "Deploy" in Railway dashboard
3. Watch the build logs to ensure:
   - Dependencies install successfully
   - Build completes
   - Prisma generates client
   - Migrations run successfully

## Step 6: Verify Deployment

After deployment, check:

1. **Health endpoint:**
   ```bash
   curl https://your-app.railway.app/health
   ```

2. **API docs:**
   ```bash
   curl https://your-app.railway.app/docs
   ```

3. **ML Service connection:**
   ```bash
   curl https://your-app.railway.app/api/v1/ml/health \
     -H "X-API-KEY: your-ml-api-key"
   ```

## Troubleshooting

### Build fails:
- Check Railway logs for errors
- Ensure all dependencies are in package.json
- Verify Prisma schema is correct

### Database connection fails:
- Verify DATABASE_URL is correct
- Check Supabase connection settings
- Ensure database is accessible from Railway

### ML Service connection fails:
- Verify ML_SERVICE_URL is accessible
- Check ML_API_KEY matches ML service
- Ensure ML service allows connections from Railway

### Migrations fail:
- Check DATABASE_URL format
- Verify Prisma schema matches database
- Run migrations manually if needed

## Custom Domain (Optional)

1. Go to your service → Settings → Networking
2. Click "Generate Domain" or add custom domain
3. Update CORS_ORIGIN to match your domain
