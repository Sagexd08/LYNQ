# Telegram Webhook Setup Guide

## Quick Setup

### 1. Get Your Bot Token

1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/newbot` and follow the prompts
3. Save the **bot token** you receive (format: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 2. Set Environment Variables

Add to your `.env` file:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
TELEGRAM_WEBHOOK_URL=https://your-domain.com/api/v1/telegram/webhook
TELEGRAM_WEBHOOK_SECRET=your_random_secret_string_32_chars_minimum
TELEGRAM_ADMIN_CHAT_ID=your_telegram_user_id
```

**Important Notes:**
- Your webhook URL **must** use HTTPS (not HTTP)
- The path includes the API prefix: `/api/v1/telegram/webhook`
- Generate a secure random secret: `openssl rand -hex 32`

### 3. Set the Webhook

#### Option A: Using the Setup Script

```bash
cd backend
npm run telegram:setup-webhook
```

#### Option B: Using cURL

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-domain.com/api/v1/telegram/webhook",
    "secret_token": "your_webhook_secret_here",
    "allowed_updates": ["message", "callback_query"]
  }'
```

#### Option C: Using Browser/Postman

POST to: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook`

Body (JSON):
```json
{
  "url": "https://your-domain.com/api/v1/telegram/webhook",
  "secret_token": "your_webhook_secret_here",
  "allowed_updates": ["message", "callback_query"]
}
```

### 4. Verify Webhook is Set

```bash
# Using script
npm run telegram:webhook-info

# Or using cURL
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

### 5. Test Your Bot

1. Open Telegram and search for your bot
2. Send `/start` to your bot
3. Check your backend logs for incoming webhook requests

## Common URLs by Deployment Platform

### Local Development (ngrok)

```bash
# Install ngrok from: https://ngrok.com/download
# Or via apt (Linux): curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null && echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list && sudo apt update && sudo apt install ngrokngrok http 3000
# Use the HTTPS URL provided: https://abc123.ngrok.io/api/v1/telegram/webhook
```

### Railway

```
https://your-app-name.railway.app/api/v1/telegram/webhook
```

### Fly.io

```
https://your-app-name.fly.dev/api/v1/telegram/webhook
```

### Vercel/Netlify

```
https://your-domain.vercel.app/api/v1/telegram/webhook
```

## Troubleshooting

### Webhook Not Receiving Updates

1. **Check URL is HTTPS**: Telegram requires HTTPS for webhooks
2. **Verify secret token**: Must match `TELEGRAM_WEBHOOK_SECRET` in your `.env`
3. **Check endpoint returns 200**: Your endpoint must return HTTP 200 OK
4. **View webhook info**: Use `getWebhookInfo` to see last error message
5. **Check backend logs**: Look for incoming requests to `/telegram/webhook`

### Delete Webhook (Switch Back to Polling)

```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/deleteWebhook"
```

Then update `telegram.service.ts` to use polling mode instead.

### Get Your Telegram User ID

1. Message [@userinfobot](https://t.me/userinfobot) on Telegram
2. It will reply with your user ID
3. Use this as `TELEGRAM_ADMIN_CHAT_ID`

## Current Implementation Status

⚠️ **Note**: Your current implementation uses **polling mode** (checking for updates every second). 

The webhook endpoint exists at `/api/v1/telegram/webhook` but currently just returns `{ ok: true }` without processing updates.

To fully switch to webhook mode, you would need to:
1. Update `telegram.service.ts` to process webhook updates
2. Remove polling mode initialization
3. Set the webhook URL as shown above

For MVP, **polling mode is fine** - it's simpler and works well for development/testing.
