import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
const envPaths = [
    path.join(__dirname, '../../.env'),        
    path.join(process.cwd(), '.env'),          
    path.join(__dirname, '../.env'),        
];

let envLoaded = false;
let loadedPath = '';

for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
        const result = dotenv.config({ path: envPath, override: false });
        if (!result.error) {
            envLoaded = true;
            loadedPath = envPath;
            console.log(`📄 Loaded .env from: ${envPath}`);
            break;
        }
    }
}

if (!envLoaded) {
    console.warn('⚠️  No .env file found. Make sure to set environment variables.');
    console.warn('   Checked locations:');
    envPaths.forEach(p => console.warn(`   - ${p}`));
}

async function setupWebhook() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

    if (!token) {
        console.error('❌ TELEGRAM_BOT_TOKEN not set in environment variables');
        process.exit(1);
    }

    if (!webhookUrl) {
        console.error('❌ TELEGRAM_WEBHOOK_URL not set in environment variables');
        console.error('   Set it to: https://your-domain.com/api/v1/telegram/webhook');
        process.exit(1);
    }

    console.log('🔧 Setting up Telegram webhook...');
    console.log(`   URL: ${webhookUrl}`);
    console.log(`   Secret: ${secret ? '***' : 'not set'}\n`);

    try {
        const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: webhookUrl,
                secret_token: secret || undefined,
                allowed_updates: ['message', 'callback_query'],
                drop_pending_updates: true, // Clear old updates
            }),
        });

        const result = await response.json();

        if (result.ok) {
            console.log('✅ Webhook set successfully!\n');
            
            // Get webhook info to verify
            const infoResponse = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
            const info = await infoResponse.json();
            
            if (info.ok) {
                console.log('📋 Webhook Info:');
                console.log(`   URL: ${info.result.url || 'not set'}`);
                console.log(`   Pending updates: ${info.result.pending_update_count || 0}`);
                console.log(`   Last error: ${info.result.last_error_message || 'none'}`);
                console.log(`   Last error date: ${info.result.last_error_date ? new Date(info.result.last_error_date * 1000).toISOString() : 'never'}`);
            }
        } else {
            console.error('❌ Failed to set webhook:', result.description);
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

setupWebhook();
