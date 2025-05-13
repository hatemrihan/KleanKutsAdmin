// validate-deploy.js - Validates deployment files
const fs = require('fs');
const path = require('path');

console.log('🔍 Validating deployment files...');

const requiredFiles = [
  { path: 'netlify.toml', root: true },
  { path: 'package.json', root: false },
  { path: 'lib/mongodb.ts', root: false },
  { path: 'lib/env.ts', root: false },
  { path: 'app/api/diagnose/route.ts', root: false },
  { path: 'scripts/netlify-deploy.js', root: false },
];

const rootDir = path.resolve(process.cwd(), '..');
const appDir = process.cwd();

let allFilesExist = true;

for (const file of requiredFiles) {
  const filePath = file.root 
    ? path.join(rootDir, file.path)
    : path.join(appDir, file.path);
  
  const exists = fs.existsSync(filePath);
  
  console.log(`${exists ? '✅' : '❌'} ${file.path} ${exists ? 'exists' : 'missing'}`);
  
  if (!exists) {
    allFilesExist = false;
  }
}

// Check MongoDB URI format
if (process.env.MONGODB_URI) {
  const uri = process.env.MONGODB_URI.replace(/["']/g, '');
  const validFormat = uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://');
  console.log(`${validFormat ? '✅' : '❌'} MONGODB_URI format is ${validFormat ? 'valid' : 'invalid'}`);
  
  if (!validFormat) {
    allFilesExist = false;
  }
} else {
  console.log('❌ MONGODB_URI is not set');
  allFilesExist = false;
}

if (allFilesExist) {
  console.log('\n✅ All deployment files are in place');
} else {
  console.log('\n❌ Some required files are missing. Please fix the issues above.');
}

// Check netlify.toml content
try {
  const netlifyTomlPath = path.join(appDir, 'netlify.toml');
  if (fs.existsSync(netlifyTomlPath)) {
    const content = fs.readFileSync(netlifyTomlPath, 'utf-8');
    if (content.includes('npm run netlify-deploy')) {
      console.log('✅ netlify.toml has the correct build command');
    } else {
      console.log('❌ netlify.toml is missing the "npm run netlify-deploy" command');
    }
  }
} catch (error) {
  console.error('Error checking netlify.toml:', error.message);
}

// Print deployment checklist
console.log('\n📋 Deployment checklist:');
console.log('1. MONGODB_URI is set and formatted correctly');
console.log('2. netlify.toml is configured with "npm run netlify-deploy"');
console.log('3. Scripts directory has netlify-deploy.js');
console.log('4. Make sure .npmrc has legacy-peer-deps=true');
console.log('5. After deployment, check /api/diagnose endpoint\n'); 