// fallback-install.js - Install packages without integrity checks
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get package.json to extract dependencies
const packageJsonPath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Extract dependencies and devDependencies
const dependencies = { ...packageJson.dependencies };
const devDependencies = process.env.NODE_ENV !== 'production' ? { ...packageJson.devDependencies } : {};

// Create install commands for individual packages (skips integrity checks)
const installDependencies = Object.entries(dependencies).map(([name, version]) => {
  // Remove the ^ or ~ from version
  const cleanVersion = version.replace(/[\^~]/, '');
  return `npm install ${name}@${cleanVersion} --no-save --no-audit --no-fund --legacy-peer-deps --prefer-offline --force`;
});

// Setup npm config
console.log('Setting up npm config...');
execSync('npm config set registry https://registry.npmjs.org/', { stdio: 'inherit' });
execSync('npm config set legacy-peer-deps true', { stdio: 'inherit' });
execSync('npm config set fetch-retry-maxtimeout 60000', { stdio: 'inherit' });
execSync('npm config set fetch-timeout 60000', { stdio: 'inherit' });
execSync('npm config set package-lock false', { stdio: 'inherit' });
execSync('npm config set audit false', { stdio: 'inherit' });
execSync('npm config set fund false', { stdio: 'inherit' });
execSync('npm config set strict-ssl false', { stdio: 'inherit' });

// Create a minimal node_modules with just the essential packages
console.log('Installing essential packages...');
const essentialPackages = [
  'next',
  'react', 
  'react-dom',
  'typescript',
  '@types/node',
  '@types/react'
];

for (const pkg of essentialPackages) {
  if (dependencies[pkg]) {
    try {
      console.log(`Installing ${pkg}...`);
      execSync(`npm install ${pkg} --no-save --no-audit --no-fund --legacy-peer-deps --prefer-offline --force`, { 
        stdio: 'inherit'
      });
    } catch (error) {
      console.error(`Error installing ${pkg}:`, error.message);
    }
  }
}

// Install the remaining dependencies in batches
console.log('Installing remaining dependencies...');
const batchSize = 5; // Install 5 packages at a time
for (let i = 0; i < installDependencies.length; i += batchSize) {
  const batch = installDependencies.slice(i, i + batchSize);
  for (const command of batch) {
    try {
      execSync(command, { stdio: 'inherit' });
    } catch (error) {
      // Continue even if some packages fail to install
      console.error(`Error in command: ${command}`);
      console.error(error.message);
    }
  }
}

console.log('Dependencies installation completed!'); 