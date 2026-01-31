#!/bin/bash

set -e

echo "🗄️ Setting up LYNQ Database..."

docker exec -it lynq-postgres psql -U postgres -d lynq <<EOF
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    wallet_addresses JSONB,
    reputation_tier VARCHAR(50) DEFAULT 'BRONZE',
    reputation_points INTEGER DEFAULT 0,
    kyc_verified BOOLEAN DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    amount DECIMAL(18,8) NOT NULL,
    outstanding_amount DECIMAL(18,8) NOT NULL,
    chain VARCHAR(50) NOT NULL,
    collateral_token_address VARCHAR(255) NOT NULL,
    collateral_amount DECIMAL(18,8) NOT NULL,
    interest_rate DECIMAL(5,2) NOT NULL,
    duration_days INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    contract_address VARCHAR(255),
    transaction_hash VARCHAR(255),
    start_date TIMESTAMP,
    due_date TIMESTAMP,
    repaid_date TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_loans_user_id ON loans(user_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_users_email ON users(email);

EOF

echo "✅ Database setup complete!"
