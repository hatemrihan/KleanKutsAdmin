const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Function to execute commands with better error handling
function runCommand(command) {
  console.log(`\n> Executing: ${command}`);
  try {
    const output = execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`\n❌ Command failed: ${command}`);
    console.error(`Error details: ${error.message}`);
    return false;
  }
}

// Main deployment script
async function deploy() {
  console.log('🚀 Starting Netlify enhanced deployment process');
  
  // Create diagnostic info
  console.log('\n📊 Environment Diagnostics:');
  console.log(`Node version: ${process.version}`);
  console.log(`NPM version: ${execSync('npm --version').toString().trim()}`);
  console.log(`Working directory: ${process.cwd()}`);
  console.log(`Files in directory: ${fs.readdirSync('.').join(', ')}`);
  
  // Step 1: Clean npm cache thoroughly
  console.log('\n🧹 Cleaning npm cache');
  if (!runCommand('npm cache clean --force')) {
    console.log('⚠️ Cache cleaning had issues but continuing deployment');
  }
  
  // Step 2: Verify .npmrc settings
  console.log('\n📝 Verifying .npmrc settings');
  try {
    if (!fs.existsSync('.npmrc')) {
      console.log('Creating .npmrc file with optimal settings');
      fs.writeFileSync('.npmrc', 'legacy-peer-deps=true\nfetch-retry-maxtimeout=60000\nfetch-timeout=60000\n');
    } else {
      const npmrc = fs.readFileSync('.npmrc', 'utf-8');
      if (!npmrc.includes('legacy-peer-deps=true')) {
        fs.appendFileSync('.npmrc', '\nlegacy-peer-deps=true');
      }
      if (!npmrc.includes('fetch-retry-maxtimeout')) {
        fs.appendFileSync('.npmrc', '\nfetch-retry-maxtimeout=60000\nfetch-timeout=60000\n');
      }
    }
    console.log('.npmrc configuration complete');
  } catch (error) {
    console.error(`Error configuring .npmrc: ${error.message}`);
  }
  
  // Step 3: Create folders if they don't exist
  console.log('\n📁 Verifying required directories');
  try {
    const dirsToCheck = ['lib', 'app/api/diagnose'];
    
    for (const dir of dirsToCheck) {
      const fullPath = path.join(process.cwd(), dir);
      if (!fs.existsSync(fullPath)) {
        console.log(`Creating directory: ${dir}`);
        fs.mkdirSync(fullPath, { recursive: true });
      }
    }
  } catch (dirError) {
    console.error(`Error checking directories: ${dirError.message}`);
  }
  
  // Step 4: Check and create lib files if they don't exist
  try {
    const envPath = path.join(process.cwd(), 'lib', 'env.ts');
    const mongodbPath = path.join(process.cwd(), 'lib', 'mongodb.ts');
    
    // Write basic mongodb file if it doesn't exist
    if (!fs.existsSync(mongodbPath)) {
      console.log('Creating mongodb.ts utility file');
      const mongodbContent = `import { MongoClient } from 'mongodb';

// Get MongoDB URI from environment variables
let MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB = process.env.MONGODB_DB || 'elevee';

// Clean URI - remove any quotes
MONGODB_URI = MONGODB_URI.replace(/["']/g, '');

// Connection cache
let cachedClient = null;
let cachedDb = null;

export async function connectToDatabase() {
  try {
    // If we have a cached connection, use it
    if (cachedClient && cachedDb) {
      return { client: cachedClient, db: cachedDb };
    }
    
    // Create a new connection
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(MONGODB_DB);
    
    // Cache the connection
    cachedClient = client;
    cachedDb = db;
    
    return { client, db };
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}`;
      fs.writeFileSync(mongodbPath, mongodbContent);
    }
  } catch (fileError) {
    console.error(`Error creating utility files: ${fileError.message}`);
  }
  
  // Step 5: Install dependencies with fallback strategies
  console.log('\n📦 Installing dependencies');
  let installSuccess = runCommand('npm install --legacy-peer-deps --no-audit --no-fund');
  
  // If first install fails, try alternative approach
  if (!installSuccess) {
    console.log('\n⚠️ First install attempt failed, trying alternative approach');
    runCommand('npm config set registry https://registry.npmjs.org/');
    installSuccess = runCommand('npm install --legacy-peer-deps --prefer-offline');
    
    if (!installSuccess) {
      console.log('\n⚠️ Second install attempt failed, trying with package-lock reset');
      if (fs.existsSync('package-lock.json')) {
        fs.unlinkSync('package-lock.json');
        console.log('Removed package-lock.json');
      }
      installSuccess = runCommand('npm install --legacy-peer-deps --no-package-lock');
    }
  }
  
  if (!installSuccess) {
    console.error('\n❌ All dependency installation attempts failed');
    process.exit(1);
  }
  
  // Step 6: Install TypeScript and Node types if needed
  console.log('\n📦 Installing TypeScript and Node types');
  runCommand('npm install typescript @types/node --no-save');
  
  // Step 7: Build the application
  console.log('\n🏗️ Building the application');
  if (!runCommand('next build')) {
    console.error('\n❌ Build failed');
    process.exit(1);
  }
  
  console.log('\n✅ Deployment preparation completed successfully!');
}

// Run the deployment script
deploy().catch(error => {
  console.error('Deployment script failed:', error);
  process.exit(1);
}); 