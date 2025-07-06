// scripts/update-dependencies.js
// This script adds the required dependencies for wallet integration

const fs = require('fs');
const path = require('path');

// Path to package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');

// Read package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Dependencies to add
const newDependencies = {
  '@particle-network/auth': '^1.2.0',
  '@particle-network/connect-react-ui': '^1.2.0',
  '@particle-network/chains': '^1.2.0',
};

// Add dependencies if they don't exist
let dependenciesAdded = false;
Object.entries(newDependencies).forEach(([name, version]) => {
  if (!packageJson.dependencies[name]) {
    packageJson.dependencies[name] = version;
    dependenciesAdded = true;
    console.log(`Added ${name}@${version}`);
  }
});

if (dependenciesAdded) {
  // Write updated package.json
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('package.json updated. Run npm install to install new dependencies.');
} else {
  console.log('All required dependencies already installed.');
}

console.log('\nAfter installing dependencies, remember to:');
console.log('1. Update your .env file with Particle Network API keys');
console.log('2. Initialize Particle in your main.jsx file');
console.log('3. Configure allowed origins in Particle dashboard');
console.log('\nSee WALLET_SETUP.md for detailed instructions.');
