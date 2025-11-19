#!/bin/bash

set -e

echo "🚀 Deploying LYNQ Contracts..."

cd contracts/evm
npm install
npm run compile
npm run deploy:ethereum
npm run deploy:polygon
npm run deploy:bsc

echo "✅ EVM Contracts Deployed"

cd ../aptos
npm install
npm run deploy

echo "✅ Aptos Contracts Deployed"

cd ../flow
npm install
npm run deploy

echo "✅ Flow Contracts Deployed"

echo "🎉 All contracts deployed successfully!"
