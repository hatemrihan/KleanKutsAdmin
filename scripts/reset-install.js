// reset-install.js - Reset package-lock.json and node_modules for a clean install
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Reset npm installation files');

// Delete package-lock.json if it exists
const packageLockPath = path.join(process.cwd(), 'package-lock.json');
if (fs.existsSync(packageLockPath)) {
  console.log('Removing package-lock.json');
  fs.unlinkSync(packageLockPath);
}

// Remove node_modules directory
const nodeModulesPath = path.join(process.cwd(), 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  console.log('Removing node_modules directory');
  try {
    if (process.platform === 'win32') {
      execSync('rmdir /s /q node_modules', { stdio: 'inherit' });
    } else {
      execSync('rm -rf node_modules', { stdio: 'inherit' });
    }
  } catch (error) {
    console.error('Error removing node_modules:', error.message);
  }
}

// Clean npm cache
console.log('Cleaning npm cache');
try {
  execSync('npm cache clean --force', { stdio: 'inherit' });
} catch (error) {
  console.error('Error cleaning npm cache:', error.message);
}

// Set npm registry to official
console.log('Setting npm registry to official npm registry');
try {
  execSync('npm config set registry https://registry.npmjs.org/', { stdio: 'inherit' });
} catch (error) {
  console.error('Error setting npm registry:', error.message);
}

// Create optimal .npmrc if it doesn't exist
const npmrcPath = path.join(process.cwd(), '.npmrc');
if (!fs.existsSync(npmrcPath)) {
  console.log('Creating .npmrc file');
  const npmrcContent = `engine-strict=true
legacy-peer-deps=true
fetch-retry-maxtimeout=60000
fetch-timeout=60000
fetch-retries=5
registry=https://registry.npmjs.org/
prefer-offline=true`;
  fs.writeFileSync(npmrcPath, npmrcContent);
}

console.log('✅ Reset complete. Now run:');
console.log('npm install --legacy-peer-deps --prefer-offline'); 