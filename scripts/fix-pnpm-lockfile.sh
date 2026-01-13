#!/bin/bash

# Fix pnpm lockfile sync issue
# This script regenerates the pnpm-lock.yaml to match package.json

set -e

echo "🔧 Fixing pnpm lockfile..."

# Remove old lockfile if exists
if [ -f "pnpm-lock.yaml" ]; then
    echo "Removing old pnpm-lock.yaml..."
    rm pnpm-lock.yaml
fi

# Install dependencies to regenerate lockfile
echo "Installing dependencies to regenerate lockfile..."
pnpm install

echo "✅ Lockfile regenerated successfully!"
echo ""
echo "Next steps:"
echo "1. Commit the new pnpm-lock.yaml"
echo "2. Push to your repository"
echo "3. Redeploy"
