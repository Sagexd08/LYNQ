# Telegram Bot Setup Guide

## 🎯 Overview

Your LYNQ backend is now deployed on Railway and ready to receive Telegram webhook updates.

## 📱 Webhook Configuration

### Webhook URL
```
https://lynq-backend-production-a70a.up.railway.app/api/v1/telegram/webhook
```

This webhook is:
- ✅ Configured in the backend controller (`backend/src/telegram/telegram.controller.ts`)
- ✅ Ready to receive updates from Telegram
- ✅ Protected with optional secret token validation
- ✅ Deployed on Railway production environment

## 🔐 Required Environment Variables

You need to set these environment variables in Railway:

### 1. TELEGRAM_BOT_TOKEN (Required)
Get this from [@BotFather](https://t.me/BotFather) on Telegram.

```bash
railway service link lynq-backend
railway variables --set TELEGRAM_BOT_TOKEN=your_bot_token_here
```

### 2. TELEGRAM_WEBHOOK_SECRET (Recommended)
Generate a secure random string for webhook validation.

```bash
railway variables --set TELEGRAM_WEBHOOK_SECRET=your_secure_random_string
```

### 3. TELEGRAM_ADMIN_CHAT_ID (Optional)
Your Telegram chat ID for receiving admin alerts.

```bash
railway variables --set TELEGRAM_ADMIN_CHAT_ID=your_chat_id
```

## 🚀 Setup Steps

### Step 1: Set Environment Variables

From your local machine:

```bash
cd C:\Users\sohom\OneDrive\Desktop\Blockchain\LYNQ

# Link to service
railway service link lynq-backend

# Set variables
railway variables --set TELEGRAM_BOT_TOKEN=<YOUR_BOT_TOKEN>
railway variables --set TELEGRAM_WEBHOOK_SECRET=<YOUR_SECRET>
```

### Step 2: Configure Webhook

After setting the environment variables, run the setup script:

```bash
cd backend
npm run telegram:setup-webhook
```

This will:
- Register your webhook URL with Telegram
- Configure allowed updates (messages, callback queries)
- Set up the secret token for validation
- Display webhook info

### Step 3: Verify Webhook

Check that the webhook is properly configured:

```bash
npm run telegram:webhook-info
```

You should see output showing:
- Webhook URL: `https://lynq-backend-production-a70a.up.railway.app/api/v1/telegram/webhook`
- Status: Active
- No pending updates or errors

### Step 4: Test Your Bot

1. Open Telegram
2. Search for your bot (the name you gave it when creating with @BotFather)
3. Send `/start` command
4. You should receive a welcome message

## 🤖 Available Bot Commands

Once configured, users can interact with your bot using:

- `/start` - Welcome message and instructions
- `/link <wallet_address>` - Link their wallet to receive notifications
- `/status` - View account overview
- `/loans` - Check active loans
- `/risk` - View risk profile
- `/help` - Show all available commands

## 🔍 Monitoring

### Check Logs

```bash
# View real-time logs
railway logs

# Filter for Telegram-related logs
railway logs | Select-String "Telegram"
```

### Test Webhook Endpoint

```powershell
# Health check
Invoke-WebRequest -Uri "https://lynq-backend-production-a70a.up.railway.app/health"

# Test webhook endpoint (should return 401 without proper auth)
Invoke-WebRequest -Uri "https://lynq-backend-production-a70a.up.railway.app/api/v1/telegram/webhook"
```

## 🛠️ Troubleshooting

### Webhook Not Receiving Updates

1. Verify bot token is correct:
   ```bash
   railway variables | Select-String "TELEGRAM_BOT_TOKEN"
   ```

2. Check webhook info:
   ```bash
   npm run telegram:webhook-info
   ```

3. Look for errors in logs:
   ```bash
   railway logs | Select-String "error" -i
   ```

4. Redeploy the service:
   ```bash
   railway service redeploy
   ```

### Bot Not Responding

1. Check if bot is enabled in logs (should see "Telegram bot initialized")
2. Verify webhook URL is correct
3. Check for rate limiting or API errors
4. Ensure backend is running: `railway service status`

### Database Connection Issues

If users can't link their wallets:

1. Check DATABASE_URL is set:
   ```bash
   railway variables | Select-String "DATABASE_URL"
   ```

2. Verify migrations ran successfully:
   ```bash
   railway logs | Select-String "migration"
   ```

## 📊 Frontend Integration

The frontend should link to the Telegram bot for users to:

1. **Connect Telegram** - Add a "Connect Telegram" button that opens the bot
2. **Deep Linking** - Use Telegram deep links: `https://t.me/YOUR_BOT_NAME?start=<wallet_address>`
3. **Show Status** - Display if user has Telegram notifications enabled

Example deep link format:
```
https://t.me/YOUR_BOT_NAME?start=wallet_0x123456789
```

## 🔗 Related Files

- **Backend Controller**: `backend/src/telegram/telegram.controller.ts`
- **Backend Service**: `backend/src/telegram/telegram.service.ts`
- **Webhook Setup Script**: `backend/scripts/setup-telegram-webhook.ts`
- **Railway Config**: `railway.json` and `nixpacks.toml`

## 📝 Notes

- The backend automatically switches between webhook mode (production) and polling mode (development)
- Webhook is only active when `NODE_ENV=production`
- All Telegram features are optional - the app works without them
- If `TELEGRAM_BOT_TOKEN` is not set, the bot is disabled gracefully

## ✅ Checklist

- [x] Backend deployed to Railway
- [x] Webhook URL configured
- [x] Webhook script created
- [x] Documentation added
- [x] Changes pushed to GitHub
- [ ] Set TELEGRAM_BOT_TOKEN in Railway
- [ ] Run webhook setup script
- [ ] Test bot with `/start` command
- [ ] Update frontend with bot link

---

**Webhook URL**: `https://lynq-backend-production-a70a.up.railway.app/api/v1/telegram/webhook`  
**Last Updated**: January 15, 2026  
**Status**: Ready for token configuration
