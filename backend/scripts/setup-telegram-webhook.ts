import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(__dirname, '../.env') });

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
const BACKEND_URL = process.env.BACKEND_URL || 'https://lynq-backend-production-a70a.up.railway.app';

async function setupWebhook() {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN is not set');
    process.exit(1);
  }

  const webhookUrl = `${BACKEND_URL}/api/v1/telegram/webhook`;
  
  console.log('🔧 Setting up Telegram webhook...');
  console.log(`📍 Webhook URL: ${webhookUrl}`);

  try {
    const params: any = {
      url: webhookUrl,
      allowed_updates: ['message', 'callback_query'],
      drop_pending_updates: true,
    };

    if (TELEGRAM_WEBHOOK_SECRET) {
      params.secret_token = TELEGRAM_WEBHOOK_SECRET;
      console.log('🔐 Using webhook secret token');
    }

    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      }
    );

    const result = await response.json();

    if (result.ok) {
      console.log('✅ Webhook set successfully!');
      console.log(`📝 Description: ${result.description}`);
    } else {
      console.error('❌ Failed to set webhook');
      console.error(result);
      process.exit(1);
    }

    // Get webhook info to verify
    const infoResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`
    );
    const info = await infoResponse.json();

    console.log('\n📊 Webhook Info:');
    console.log(`  URL: ${info.result.url}`);
    console.log(`  Has custom certificate: ${info.result.has_custom_certificate}`);
    console.log(`  Pending update count: ${info.result.pending_update_count}`);
    console.log(`  Last error date: ${info.result.last_error_date || 'None'}`);
    console.log(`  Last error message: ${info.result.last_error_message || 'None'}`);

  } catch (error) {
    console.error('❌ Error setting up webhook:', error);
    process.exit(1);
  }
}

setupWebhook();
