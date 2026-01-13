# LYNQ Deployment Checklist

## Pre-Deployment

### Backend Setup
- [ ] Supabase project created
- [ ] Database credentials obtained
- [ ] Prisma migrations run
- [ ] RLS policies configured
- [ ] Environment variables configured
- [ ] JWT secret generated (32+ chars)
- [ ] CORS origin configured

### ML Service Setup
- [ ] AWS account created
- [ ] S3 bucket created (`lynq-models`)
- [ ] Model files uploaded to S3
- [ ] IAM role created for EC2
- [ ] EC2 instance launched (t2.micro)
- [ ] Security group configured
- [ ] ML service deployed
- [ ] Health check passing
- [ ] API key configured

### Frontend Setup
- [ ] Environment variables configured
- [ ] API URL set to backend
- [ ] Build tested locally
- [ ] Production build created

## Deployment Steps

### 1. Supabase
- [ ] Project created
- [ ] Credentials saved securely
- [ ] Database schema synced
- [ ] RLS policies active

### 2. AWS ML Service
- [ ] EC2 instance running
- [ ] Docker installed
- [ ] ML service container running
- [ ] Port 8000 accessible
- [ ] Model loading from S3
- [ ] Health endpoint responding

### 3. Backend
- [ ] Environment variables set
- [ ] Supabase connected
- [ ] ML service URL configured
- [ ] Redis connected
- [ ] Database migrations applied
- [ ] Service running
- [ ] Health check passing

### 4. Frontend
- [ ] Environment variables set
- [ ] API URL configured
- [ ] Build successful
- [ ] Deployed to hosting
- [ ] CORS configured

## Testing

### Authentication
- [ ] Wallet connection works
- [ ] Challenge generation works
- [ ] Signature verification works
- [ ] JWT token received
- [ ] Profile created in Supabase

### Loan Flow
- [ ] Risk evaluation works
- [ ] Loan creation works
- [ ] Loan appears in database
- [ ] Risk assessment stored
- [ ] Loan list displays correctly

### ML Service
- [ ] Health check responds
- [ ] Credit scoring works
- [ ] Model loads correctly
- [ ] Fallback works if model fails
- [ ] Response time acceptable (<300ms)

## Security

- [ ] API keys not in code
- [ ] Environment variables secure
- [ ] RLS policies active
- [ ] CORS restricted
- [ ] HTTPS enabled (production)
- [ ] Security groups restricted
- [ ] Secrets in Secrets Manager (optional)

## Monitoring

- [ ] CloudWatch logs configured
- [ ] Health checks set up
- [ ] Error tracking enabled
- [ ] Performance monitoring active

## Documentation

- [ ] API documentation accessible
- [ ] Environment variables documented
- [ ] Deployment guide complete
- [ ] Troubleshooting guide available

---

**Status**: Ready for deployment
