#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔒 Starting security audit and fixes...\n');


const packageJsonPath = path.join(process.cwd(), 'package.json');
const backupPath = path.join(process.cwd(), 'package.json.backup');

if (fs.existsSync(packageJsonPath)) {
  fs.copyFileSync(packageJsonPath, backupPath);
  console.log('✅ Created backup of package.json');
}

try {
  
  console.log('📦 Updating vulnerable packages...');
  
  
  execSync('npm install axios@latest', { stdio: 'inherit' });
  
  
  execSync('npm update', { stdio: 'inherit' });
  
  console.log('✅ Packages updated successfully');
  
  
  console.log('\n🔍 Running security audit...');
  try {
    execSync('npm audit', { stdio: 'inherit' });
    console.log('✅ No vulnerabilities found');
  } catch {
    console.log('⚠️  Some vulnerabilities may still exist. Check manually.');
  }
  
  
  fs.unlinkSync(backupPath);
  console.log('\n🎉 Security fixes completed!');
  
} catch (error) {
  console.error('❌ Error during security fixes:', error.message);
  
  
  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, packageJsonPath);
    fs.unlinkSync(backupPath);
    console.log('🔄 Restored package.json from backup');
  }
  
  process.exit(1);
}
