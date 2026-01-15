# Railway Deployment Guide for LYNQ

## 🚀 Deployment Information

### Production URLs
- **Backend API**: https://lynq-backend-production-a70a.up.railway.app
- **API Documentation**: https://lynq-backend-production-a70a.up.railway.app/docs
- **Health Check**: https://lynq-backend-production-a70a.up.railway.app/health

### Railway Project
- **Project**: friendly-perception
- **Service**: lynq-backend
- **Environment**: production

## 📋 Services

The deployment includes the following Railway services:
1. **lynq-backend** - Main NestJS application
2. **Postgres** - PostgreSQL database
3. **Redis** - Redis cache for sessions and queues

## 🔧 Environment Variables

The following environment variables are configured:

### Required (Already Set)
- `DATABASE_URL` - Auto-provided by Railway Postgres service
- `REDIS_URL` - Auto-provided by Railway Redis service
- `JWT_SECRET` - Auto-generated secure secret
- `NODE_ENV` - Set to `production`
- `BACKEND_URL` - Backend URL for webhook setup

### Optional (To Be Set If Needed)
- `TELEGRAM_BOT_TOKEN` - Your Telegram bot token
- `TELEGRAM_WEBHOOK_SECRET` - Secret token for webhook validation
- `TELEGRAM_ADMIN_CHAT_ID` - Admin Telegram chat ID for alerts
- `ML_SERVICE_URL` - URL for ML service (if deployed separately)
- `ETHEREUM_RPC_URL` - Ethereum RPC endpoint
- `POLYGON_RPC_URL` - Polygon RPC endpoint
- `MANTLE_RPC_URL` - Mantle RPC endpoint
- `PRIVATE_KEY` - Private key for blockchain transactions (⚠️ Keep secure!)

## 🔐 Setting Environment Variables

To set environment variables:

```bash
# Switch to your service
railway service link lynq-backend

# Set a variable
railway variables --set KEY=value

# View all variables
railway variables
```

## 📱 Telegram Bot Setup

### 1. Set Telegram Environment Variables

```bash
railway variables --set TELEGRAM_BOT_TOKEN=your_bot_token_here
railway variables --set TELEGRAM_WEBHOOK_SECRET=your_webhook_secret_here
railway variables --set TELEGRAM_ADMIN_CHAT_ID=your_admin_chat_id
```

### 2. Configure Webhook

After setting the environment variables, run the webhook setup script:

```bash
# From your local machine
cd backend
npm run telegram:setup-webhook

# Or via Railway
railway run npm run telegram:setup-webhook
```

### 3. Verify Webhook

```bash
# Check webhook status
npm run telegram:webhook-info
```

The webhook URL will be: `https://lynq-backend-production-a70a.up.railway.app/api/v1/telegram/webhook`

## 🔄 Redeployment

### Automatic Deployment
Railway automatically deploys when you push to GitHub (if connected).

### Manual Deployment via CLI

```bash
# From project root
railway up

# Or with verbose logging
railway up --verbose

# Detached mode
railway up --detach
```

### Check Deployment Status

```bash
# Service status
railway service status

# View logs
railway logs

# View recent logs
railway logs | Select-Object -Last 50
```

## 🛠️ Common Commands

```bash
# Link to project
railway link

# Link to service
railway service link lynq-backend

# Get project info
railway status

# Open project in browser
railway open

# Connect to database
railway connect Postgres

# Run command in Railway environment
railway run <command>

# View environment variables
railway variables
```

## 🗄️ Database Management

### Running Migrations

Migrations are automatically run on deployment via the `fix-migration.js` script.

### Manual Migration Operations

```bash
# Via Railway CLI
railway run npm run prisma:migrate

# Generate Prisma client
railway run npx prisma generate

# Push schema changes (development)
railway run npx prisma db push

# Open Prisma Studio
railway run npx prisma studio
```

## 🔍 Monitoring & Debugging

### View Logs

```bash
# Real-time logs
railway logs

# Service-specific logs
railway logs --service lynq-backend

# Filtered logs
railway logs | Select-String "ERROR"
```

### Health Checks

```bash
# Check API health
Invoke-WebRequest -Uri "https://lynq-backend-production-a70a.up.railway.app/health"

# Check specific endpoint
Invoke-WebRequest -Uri "https://lynq-backend-production-a70a.up.railway.app/api/v1/loans"
```

### Database Connection

```bash
# Connect to production database
railway connect Postgres

# Then run SQL queries
\dt  # List tables
SELECT * FROM users LIMIT 10;
```

## 🚨 Troubleshooting

### Failed Migrations

If you encounter migration errors:

1. The `fix-migration.js` script automatically handles failed migrations
2. Check logs: `railway logs | Select-String "migration"`
3. Manually resolve if needed:
   ```bash
   railway run npx prisma migrate resolve --applied "migration_name"
   railway run npx prisma migrate resolve --rolled-back "migration_name"
   ```

### Service Not Starting

1. Check logs: `railway logs`
2. Verify environment variables: `railway variables`
3. Check service status: `railway service status`
4. Restart deployment: `railway service redeploy`

### Database Connection Issues

1. Verify DATABASE_URL is set: `railway variables | Select-String "DATABASE_URL"`
2. Check Postgres service status
3. Test connection: `railway run npx prisma db push --skip-generate`

## 📦 Project Structure

```
LYNQ/
├── backend/
│   ├── fix-migration.js      # Migration fix script
│   ├── scripts/
│   │   └── setup-telegram-webhook.ts
│   └── ...
├── nixpacks.toml             # Nixpacks build config
├── railway.json              # Railway deployment config
└── RAILWAY_DEPLOYMENT.md     # This file
```

## 🔐 Security Best Practices

1. **Never commit secrets** - Use Railway environment variables
2. **Rotate JWT secrets** regularly in production
3. **Use webhook secrets** for Telegram bot
4. **Enable health checks** - Already configured at `/health`
5. **Monitor logs** for security issues

## 🎯 Next Steps

1. ✅ Backend deployed successfully
2. ⏳ Deploy frontend (landing-v2) to Railway or Vercel
3. ⏳ Set up Telegram bot token and configure webhook
4. ⏳ Configure blockchain RPC URLs for smart contract interactions
5. ⏳ Set up ML service (optional)
6. ⏳ Configure domain name (optional)

## 📞 Support

For Railway-specific issues:
- Documentation: https://docs.railway.app
- Discord: https://discord.gg/railway
- Status: https://status.railway.app

## 🔄 CI/CD Integration

To enable automatic deployments from GitHub:

1. Go to Railway dashboard
2. Connect GitHub repository
3. Select branch to deploy (e.g., `main`)
4. Railway will auto-deploy on every push

---

**Last Updated**: January 15, 2026  
**Deployment Status**: ✅ Active and Running
