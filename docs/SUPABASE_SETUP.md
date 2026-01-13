# Supabase Setup Guide for LYNQ

## Overview

This guide covers setting up Supabase for authentication and database for the LYNQ backend.

## Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name**: LYNQ
   - **Database Password**: (save securely)
   - **Region**: Choose closest to your backend
   - **Pricing Plan**: Free tier
5. Click "Create new project"
6. Wait for project to be provisioned (~2 minutes)

## Step 2: Get Project Credentials

### 2.1 Project URL and Keys

1. Go to Project Settings → API
2. Copy:
   - **Project URL**: `https://[project-ref].supabase.co`
   - **anon/public key**: (for client-side)
   - **service_role key**: (for server-side, keep secret!)

### 2.2 Database Connection String

1. Go to Project Settings → Database
2. Under "Connection string", select "URI"
3. Copy the connection string
4. Replace `[YOUR-PASSWORD]` with your database password

Example:
```
postgresql://postgres:[YOUR-PASSWORD]@db.[project-ref].supabase.co:5432/postgres
```

## Step 3: Configure Backend

### 3.1 Update Backend .env

Add to your backend `.env` file:

```env
# Supabase Configuration
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[project-ref].supabase.co:5432/postgres
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# JWT Configuration
JWT_SECRET=your-jwt-secret-minimum-32-characters-long
JWT_EXPIRES_IN=7d
```

### 3.2 Run Migrations

```bash
cd backend

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Or push schema (for development)
npm run prisma:push
```

## Step 4: Configure Row Level Security (RLS)

### 4.1 Enable RLS on Tables

In Supabase SQL Editor, run:

```sql
-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can only see their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid()::text = id);

-- Users can update own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid()::text = id);

-- Enable RLS on loans
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;

-- Users can only see their own loans
CREATE POLICY "Users can view own loans"
  ON loans FOR SELECT
  USING (auth.uid()::text = user_id);

-- Users can create their own loans
CREATE POLICY "Users can create own loans"
  ON loans FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Enable RLS on other tables as needed
ALTER TABLE collaterals ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE repayments ENABLE ROW LEVEL SECURITY;
```

### 4.2 Create Service Role Policy (for Backend)

```sql
-- Allow service role full access (for backend operations)
CREATE POLICY "Service role full access"
  ON profiles FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access"
  ON loans FOR ALL
  USING (auth.role() = 'service_role');
```

## Step 5: Link Wallet Addresses to Supabase Users

The backend will automatically:
1. Create Supabase user on wallet verification
2. Link wallet address to user
3. Store profile in `profiles` table

### 5.1 Verify Integration

Check Supabase Dashboard → Authentication → Users
- Should see users created when wallets connect

Check Supabase Dashboard → Table Editor → profiles
- Should see profile records with wallet addresses

## Step 6: Test Authentication Flow

### 6.1 Test Wallet Authentication

1. Start backend: `npm run start:dev`
2. Use frontend or Postman to:
   - POST `/api/v1/auth/wallet/challenge`
   - Sign message with wallet
   - POST `/api/v1/auth/wallet/verify`
   - Should receive JWT token

### 6.2 Verify in Supabase

- Check `profiles` table for new entry
- Check Authentication → Users for new user

## Step 7: Database Schema Sync

### 7.1 Verify Schema Match

Ensure Prisma schema matches Supabase:

```bash
# Check schema
npx prisma db pull

# Compare with prisma/schema.prisma
```

### 7.2 Sync if Needed

```bash
# Push schema to Supabase
npx prisma db push

# Or create migration
npx prisma migrate dev --name sync_with_supabase
```

## Step 8: Environment Variables Summary

### Backend .env (Complete)

```env
# Application
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://your-frontend-domain.com

# Supabase
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[project-ref].supabase.co:5432/postgres
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# JWT
JWT_SECRET=your-secret-minimum-32-characters-long
JWT_EXPIRES_IN=7d

# ML Service
ML_SERVICE_URL=http://YOUR_EC2_IP:8000
ML_API_KEY=your-ml-api-key

# Redis
REDIS_URL=redis://your-redis-url:6379

# Blockchain
BLOCKCHAIN_RPC_URL=https://sepolia.infura.io/v3/your-key
BLOCKCHAIN_CHAIN_ID=11155111
PRIVATE_KEY=your-private-key
LOAN_CORE_ADDRESS=0x...
COLLATERAL_VAULT_ADDRESS=0x...

# Telegram
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_ADMIN_CHAT_ID=your-chat-id
```

## Step 9: Security Checklist

- ✅ Service role key kept secret (never in frontend)
- ✅ RLS policies configured
- ✅ Database password strong and secure
- ✅ JWT secret is random and long (32+ chars)
- ✅ CORS origin restricted to your domain
- ✅ Environment variables not committed to git

## Step 10: Monitoring

### 10.1 Supabase Dashboard

Monitor:
- Database → Table Editor (data)
- Authentication → Users (auth)
- Logs → API Logs (requests)
- Database → Connection Pooling (performance)

### 10.2 Backend Logs

Check backend logs for:
- Database connection errors
- Authentication failures
- Query performance

## Troubleshooting

### Connection Issues

```bash
# Test connection
psql "postgresql://postgres:[PASSWORD]@db.[project-ref].supabase.co:5432/postgres"

# Check Prisma connection
npx prisma db pull
```

### RLS Blocking Queries

- Check RLS policies in Supabase
- Verify user has correct permissions
- Use service role key for backend operations

### Migration Issues

```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Or manually in Supabase SQL Editor
```

## Next Steps

1. ✅ Provide Supabase credentials
2. ✅ Update backend .env
3. ✅ Run migrations
4. ✅ Test authentication
5. ✅ Deploy to production

---

**Ready for your Supabase credentials!** 🚀
