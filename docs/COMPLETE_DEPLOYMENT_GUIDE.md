# Complete Deployment Guide - LYNQ Platform

## Overview

This guide walks you through deploying the entire LYNQ platform:
1. Supabase (Database + Auth)
2. AWS ML Service (EC2 + S3)
3. Backend (Railway/Fly.io)
4. Frontend (Vercel)

## Quick Links

- **AWS Setup**: See `AWS_DEPLOYMENT_GUIDE.md`
- **Supabase Setup**: See `SUPABASE_SETUP.md`
- **Quick Start**: See `AWS_QUICK_START.md`
- **Credentials**: See `CREDENTIALS_TEMPLATE.md`

## Deployment Order

### Phase 1: Supabase (5 minutes)

1. Create Supabase project
2. Get credentials (you'll provide these)
3. Run Prisma migrations
4. Configure RLS policies

**See**: `SUPABASE_SETUP.md` for details

### Phase 2: AWS ML Service (15 minutes)

1. Create S3 bucket
2. Upload model files
3. Create IAM role
4. Launch EC2 instance
5. Deploy ML service
6. Test health endpoint

**See**: `AWS_DEPLOYMENT_GUIDE.md` for details

### Phase 3: Backend Configuration (5 minutes)

1. Update `.env` with Supabase credentials
2. Update `.env` with ML service URL
3. Test connections
4. Deploy to Railway/Fly.io

### Phase 4: Frontend Configuration (5 minutes)

1. Update `.env` with backend URL
2. Build and deploy
3. Test wallet connection

## Step-by-Step: Complete Setup

### Step 1: Supabase

```bash
# 1. Create project at https://supabase.com
# 2. Get credentials from Project Settings → API
# 3. Update backend/.env with credentials
# 4. Run migrations

cd backend
npm run prisma:migrate
```

### Step 2: AWS S3

```bash
# Create bucket
aws s3 mb s3://lynq-models --region us-east-1

# Upload model (if you have one)
aws s3 cp ./ml-service/models/credit_model.pkl \
  s3://lynq-models/models/credit_model_v1.pkl
```

### Step 3: AWS EC2

```bash
# 1. Create IAM role with S3 read access
# 2. Launch t2.micro instance
# 3. SSH to instance
ssh -i key.pem ec2-user@EC2_IP

# 4. Install Docker
sudo yum install docker -y
sudo service docker start
sudo usermod -a -G docker ec2-user

# 5. Run ML service
docker run -d \
  --name lynq-ml \
  -p 8000:8000 \
  -e MODEL_SOURCE=s3 \
  -e S3_BUCKET=lynq-models \
  -e S3_KEY=models/credit_model_v1.pkl \
  -e AWS_REGION=us-east-1 \
  -e API_KEY=your-api-key \
  YOUR_REGISTRY/lynq-ml-service:latest
```

### Step 4: Backend .env

```env
# Supabase (from your credentials)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
SUPABASE_URL=https://[PROJECT_REF].supabase.co
SUPABASE_ANON_KEY=[YOUR_KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR_KEY]

# ML Service (from EC2)
ML_SERVICE_URL=http://[EC2_IP]:8000
ML_API_KEY=your-api-key

# Other configs...
```

### Step 5: Test Everything

```bash
# Test ML service
curl http://EC2_IP:8000/health

# Test backend
curl http://localhost:3000/health

# Test Supabase connection
cd backend
npx prisma db pull
```

## Environment Variables Summary

### Backend Needs:

1. **Supabase** (you'll provide):
   - DATABASE_URL
   - SUPABASE_URL
   - SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY

2. **AWS ML Service** (from deployment):
   - ML_SERVICE_URL
   - ML_API_KEY

3. **Other** (configure as needed):
   - JWT_SECRET
   - REDIS_URL
   - BLOCKCHAIN_RPC_URL
   - TELEGRAM_BOT_TOKEN
   - etc.

## Testing Checklist

- [ ] Supabase connection works
- [ ] ML service health check passes
- [ ] Backend connects to Supabase
- [ ] Backend connects to ML service
- [ ] Wallet authentication works
- [ ] Loan creation works
- [ ] Risk assessment works

## Troubleshooting

### ML Service Not Responding
- Check EC2 security group (port 8000)
- Check Docker container logs
- Verify S3 bucket access

### Supabase Connection Fails
- Verify DATABASE_URL format
- Check password is correct
- Verify network access

### Backend Can't Connect to ML Service
- Verify ML_SERVICE_URL is correct
- Check API key matches
- Test from backend server: `curl http://EC2_IP:8000/health`

## Next Steps After Setup

1. ✅ Provide Supabase credentials
2. ✅ Deploy ML service to AWS
3. ✅ Configure backend with all credentials
4. ✅ Test end-to-end flow
5. ✅ Deploy to production hosting

---

**Ready for your Supabase credentials!** 🚀
