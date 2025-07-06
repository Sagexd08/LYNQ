#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔒 Starting security audit and fixes...\n');

// Step 1: Backup package.json
const packageJsonPath = path.join(process.cwd(), 'package.json');
const backupPath = path.join(process.cwd(), 'package.json.backup');

if (fs.existsSync(packageJsonPath)) {
  fs.copyFileSync(packageJsonPath, backupPath);
  console.log('✅ Created backup of package.json');
}

try {
  // Step 2: Update vulnerable packages manually
  console.log('📦 Updating vulnerable packages...');
  
  // Update axios to latest secure version
  execSync('npm install axios@latest', { stdio: 'inherit' });
  
  // Update other potentially vulnerable packages
  execSync('npm update', { stdio: 'inherit' });
  
  console.log('✅ Packages updated successfully');
  
  // Step 3: Run audit again
  console.log('\n🔍 Running security audit...');
  try {
    execSync('npm audit', { stdio: 'inherit' });
    console.log('✅ No vulnerabilities found');
  } catch (error) {
    console.log('⚠️  Some vulnerabilities may still exist. Check manually.');
  }
  
  // Step 4: Clean up
  fs.unlinkSync(backupPath);
  console.log('\n🎉 Security fixes completed!');
  
} catch (error) {
  console.error('❌ Error during security fixes:', error.message);
  
  // Restore backup if something went wrong
  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, packageJsonPath);
    fs.unlinkSync(backupPath);
    console.log('🔄 Restored package.json from backup');
  }
  
  process.exit(1);
}
