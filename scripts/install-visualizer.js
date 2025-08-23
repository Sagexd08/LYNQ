// scripts/install-visualizer.js
// This script helps install the visualizer plugin for bundle analysis

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');

// Read package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Check if rollup-plugin-visualizer is already installed
if (!packageJson.devDependencies?.['rollup-plugin-visualizer']) {
  console.log('Installing rollup-plugin-visualizer...');
  
  try {
    // Install the package
    execSync('npm install --save-dev rollup-plugin-visualizer', { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    
    console.log('\nVisualizer plugin installed successfully!');
    
    // Update vite.config.js to use the plugin
    const viteConfigPath = path.join(__dirname, '..', 'vite.config.js');
    let viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
    
    // Check if we need to add the import for visualizer
    if (!viteConfig.includes('rollup-plugin-visualizer')) {
      const analyzeBlock = `  // Add visualization plugin in analyze mode
  if (mode === 'analyze') {
    // You'll need to install rollup-plugin-visualizer:
    // npm install --save-dev rollup-plugin-visualizer
    console.log('Running in analyze mode. Visualization will be generated.');
  }`;
      
      const updatedAnalyzeBlock = `  // Add visualization plugin in analyze mode
  if (mode === 'analyze') {
    try {
      const visualizer = require('rollup-plugin-visualizer').visualizer;
      config.plugins.push(
        visualizer({
          open: true,
          filename: 'dist/stats.html',
          gzipSize: true,
          brotliSize: true
        })
      );
      console.log('Bundle analyzer plugin enabled. A visualization will be generated after build.');
    } catch (e) {
      console.warn('Could not load visualizer plugin:', e.message);
    }
  }`;
      
      viteConfig = viteConfig.replace(analyzeBlock, updatedAnalyzeBlock);
      fs.writeFileSync(viteConfigPath, viteConfig);
      
      console.log('Updated vite.config.js to use the visualizer plugin.');
    }
    
    console.log('\nYou can now analyze your bundle with:');
    console.log('npm run build:analyze');
    
  } catch (error) {
    console.error('Failed to install visualizer plugin:', error.message);
    process.exit(1);
  }
} else {
  console.log('rollup-plugin-visualizer is already installed.');
}

// Add a script to analyze the bundle if it doesn't exist
if (!packageJson.scripts['build:analyze']) {
  packageJson.scripts['build:analyze'] = 'vite build --mode analyze';
  
  // Write the updated package.json
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('Added build:analyze script to package.json');
}

console.log('\nTo analyze your bundle size, run:');
console.log('npm run build:analyze');
