# Telegram Bot Setup Guide for LYNQ

This guide will walk you through setting up the Telegram notification system for LYNQ.

## Prerequisites

- A Telegram account
- Access to the LYNQ backend server
- (Optional) A public URL for webhook-based updates (ngrok for local development)

## Step 1: Create a Telegram Bot

1. Open Telegram and search for **@BotFather**
2. Start a conversation and send `/newbot`
3. Follow the prompts:
   - Enter a **name** for your bot (e.g., "LYNQ Notifications")
   - Enter a **username** for your bot (e.g., "LYNQBot" - must end with 'bot')
4. BotFather will give you an **API token** that looks like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`
5. **Save this token** - you'll need it for the backend configuration

## Step 2: Configure the Backend

Add these environment variables to your `.env` file in `apps/backend/`:

```bash
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here

# (Optional) Webhook URL for production
# TELEGRAM_WEBHOOK_URL=https://your-domain.com/api/v1/telegram/webhook
```

## Step 3: Configure the Frontend

Add the bot username to your frontend `.env` file in `apps/web/frontend/`:

```bash
# Telegram Bot Username (without @)
VITE_TELEGRAM_BOT_USERNAME=LYNQBot
```

## Step 4: Set Up Webhook (Production)

For production deployments, set up a webhook to receive messages:

1. Ensure your server is publicly accessible via HTTPS
2. Set the `TELEGRAM_WEBHOOK_URL` environment variable
3. Call the webhook setup endpoint:

```bash
curl -X POST https://your-api.com/api/v1/telegram/webhook/set \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"url": "https://your-api.com/api/v1/telegram/webhook"}'
```

For local development, you can use ngrok:

```bash
# Start ngrok tunnel
ngrok http 3000

# Use the ngrok URL for webhook
TELEGRAM_WEBHOOK_URL=https://xxxx.ngrok.io/api/v1/telegram/webhook
```

## Step 5: Database Migration

Run the following SQL to add the telegram_subscriptions table:

```sql
-- Create Telegram Subscriptions Table
CREATE TABLE "telegram_subscriptions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "chatId" CHARACTER VARYING NOT NULL,
    "walletAddress" CHARACTER VARYING NOT NULL,
    "username" CHARACTER VARYING,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "preferences" JSONB NOT NULL DEFAULT '{"loanAlerts":true,"healthFactorAlerts":true,"creditScoreAlerts":true,"transactionAlerts":true,"dailySummary":false,"priceAlerts":false,"marketingMessages":false}',
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "PK_telegram_subscriptions" PRIMARY KEY ("id"),
    CONSTRAINT "UQ_telegram_userId" UNIQUE ("userId"),
    CONSTRAINT "UQ_telegram_chatId" UNIQUE ("chatId")
);

-- Add Foreign Key
ALTER TABLE "telegram_subscriptions" 
    ADD CONSTRAINT "FK_telegram_users" 
    FOREIGN KEY ("userId") REFERENCES "users"("id") 
    ON DELETE CASCADE ON UPDATE NO ACTION;

-- Create index for wallet lookup
CREATE INDEX "IDX_telegram_walletAddress" ON "telegram_subscriptions" ("walletAddress");

-- Enable RLS
ALTER TABLE "telegram_subscriptions" ENABLE ROW LEVEL SECURITY;
```

## Step 6: Test the Integration

1. **Start the backend**:
   ```bash
   cd apps/backend
   pnpm dev
   ```

2. **Check bot status**:
   ```bash
   curl http://localhost:3000/api/v1/telegram/status
   ```
   
   You should see:
   ```json
   {
     "enabled": true,
     "bot": {
       "id": 123456789,
       "is_bot": true,
       "first_name": "LYNQ Notifications",
       "username": "LYNQBot"
     },
     "timestamp": "2026-01-05T12:00:00.000Z"
   }
   ```

3. **Get your Chat ID**:
   - Open Telegram and message your bot
   - Send `/start`
   - The bot will reply with your Chat ID

4. **Send a test notification** (via API):
   ```bash
   curl -X POST http://localhost:3000/api/v1/telegram/test \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{"chatId": "YOUR_CHAT_ID"}'
   ```

## User Flow

1. User opens LYNQ frontend settings
2. Clicks "Connect Telegram"
3. Follows instructions to message the bot and get Chat ID
4. Enters Chat ID in the app
5. App registers the user for notifications
6. User receives a welcome message on Telegram

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/telegram/status` | GET | Check bot status |
| `/telegram/register` | POST | Register for notifications |
| `/telegram/unregister` | DELETE | Disable notifications |
| `/telegram/preferences` | GET | Get notification preferences |
| `/telegram/preferences` | PUT | Update notification preferences |
| `/telegram/test` | POST | Send test notification |
| `/telegram/webhook` | POST | Receive Telegram updates |
| `/telegram/webhook/set` | POST | Set webhook URL |
| `/telegram/webhook` | DELETE | Delete webhook |
| `/telegram/webhook/info` | GET | Get webhook info |

## Notification Types

The system sends notifications for:

- 📝 **Loan Events**: Created, Approved, Activated, Repaid, Liquidated
- ⚠️ **Health Factor Alerts**: Warnings and critical alerts
- 📊 **Credit Score Updates**: Score changes and tier changes
- 🤝 **Vouch Events**: Received and utilized vouches
- 💰 **Transaction Confirmations**: Deposits and withdrawals
- 📈 **Daily Summaries**: Portfolio overview (if enabled)
- 📉 **Price Alerts**: Significant price movements (if enabled)

## Troubleshooting

### Bot not connecting
- Verify the `TELEGRAM_BOT_TOKEN` is correct
- Check if the token has any extra whitespace
- Ensure the backend can reach `api.telegram.org`

### Messages not sending
- Check if the user is registered (`/telegram/preferences`)
- Verify the Chat ID is correct
- Check notification preferences

### Webhook issues
- Ensure the URL is HTTPS
- Verify the endpoint is publicly accessible
- Check server logs for errors

## Security Considerations

- Never expose the bot token in frontend code
- Use the backend API for all Telegram operations
- Chat IDs are stored securely in the database
- Webhook endpoint validates Telegram updates
