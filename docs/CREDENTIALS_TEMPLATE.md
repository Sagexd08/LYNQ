# LYNQ Credentials Template

Fill in this template with your credentials and save securely (DO NOT commit to git).

## Supabase Credentials

```env
# Supabase Project URL
SUPABASE_URL=https://[YOUR_PROJECT_REF].supabase.co

# Supabase Database Connection
DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@db.[YOUR_PROJECT_REF].supabase.co:5432/postgres

# Supabase API Keys
SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR_SERVICE_ROLE_KEY]
```

**Where to find:**
- Project URL: Supabase Dashboard → Settings → API → Project URL
- Database URL: Supabase Dashboard → Settings → Database → Connection string (URI)
- Anon Key: Supabase Dashboard → Settings → API → anon/public key
- Service Role Key: Supabase Dashboard → Settings → API → service_role key (keep secret!)

## AWS Credentials (if using Access Keys)

```env
# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=[YOUR_ACCESS_KEY]
AWS_SECRET_ACCESS_KEY=[YOUR_SECRET_KEY]
S3_BUCKET=lynq-models
S3_KEY=models/credit_model_v1.pkl
```

**Note:** Prefer using IAM roles instead of access keys for EC2 instances.

## Complete Backend .env Template

```env
# ============================================
# LYNQ Backend Environment Variables
# ============================================

# Application
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://your-frontend-domain.com

# Supabase (Fill these in)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
SUPABASE_URL=https://[PROJECT_REF].supabase.co
SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR_SERVICE_ROLE_KEY]

# JWT Authentication
JWT_SECRET=[GENERATE_RANDOM_32_CHAR_STRING]
JWT_EXPIRES_IN=7d

# ML Service (AWS EC2)
ML_SERVICE_URL=http://[YOUR_EC2_IP]:8000
ML_API_KEY=[GENERATE_SECURE_API_KEY]

# Redis
REDIS_URL=redis://[YOUR_REDIS_URL]:6379

# Blockchain
BLOCKCHAIN_RPC_URL=https://sepolia.infura.io/v3/[YOUR_INFURA_KEY]
BLOCKCHAIN_CHAIN_ID=11155111
PRIVATE_KEY=[YOUR_WALLET_PRIVATE_KEY]
LOAN_CORE_ADDRESS=0x[CONTRACT_ADDRESS]
COLLATERAL_VAULT_ADDRESS=0x[CONTRACT_ADDRESS]

# Telegram Bot
TELEGRAM_BOT_TOKEN=[YOUR_BOT_TOKEN]
TELEGRAM_ADMIN_CHAT_ID=[YOUR_CHAT_ID]
TELEGRAM_WEBHOOK_SECRET=[GENERATE_RANDOM_STRING]

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100

# Logging
LOG_LEVEL=info
```

## ML Service .env Template

```env
# Model Configuration
MODEL_SOURCE=s3
S3_BUCKET=lynq-models
S3_KEY=models/credit_model_v1.pkl
AWS_REGION=us-east-1

# AWS Credentials (if not using IAM role)
AWS_ACCESS_KEY_ID=[YOUR_ACCESS_KEY]
AWS_SECRET_ACCESS_KEY=[YOUR_SECRET_KEY]

# API Security
API_KEY=[SAME_AS_BACKEND_ML_API_KEY]

# Feature Flags
ENABLE_SHAP=true
PRELOAD_MODEL=false

# Server Configuration
HOST=0.0.0.0
PORT=8000
LOG_LEVEL=INFO
```

## Security Notes

1. **Never commit credentials to git**
2. **Use environment variables, not hardcoded values**
3. **Rotate keys regularly**
4. **Use IAM roles instead of access keys when possible**
5. **Store secrets in AWS Secrets Manager for production**
6. **Use different keys for development and production**

## Generating Secure Keys

```bash
# Generate JWT secret (32+ characters)
openssl rand -base64 32

# Generate API key
openssl rand -hex 32

# Generate webhook secret
openssl rand -hex 16
```

---

**Fill in your Supabase credentials and save this file securely!**
