#!/usr/bin/env node

/**
 * Verification script to check if the API setup is correct
 * Run with: node scripts/verify.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 Verifying Audit Software API Setup\n');

let allChecks = true;

// Check 1: Node.js version
console.log('1. Checking Node.js version...');
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
if (majorVersion >= 18) {
  console.log(`   ✅ Node.js ${nodeVersion} (meets requirement: 18+)\n`);
} else {
  console.log(`   ❌ Node.js ${nodeVersion} is too old. Required: 18+\n`);
  allChecks = false;
}

// Check 2: Required files exist
console.log('2. Checking required files...');
const requiredFiles = [
  'package.json',
  'server.js',
  'src/app.js',
  'src/config/database.js',
  'src/config/auth.js',
  'src/config/email.js',
  'src/models/index.js',
  'src/services/authService.js',
  'src/services/userService.js',
  'src/services/engagementService.js',
  'src/services/confirmationService.js',
  'src/services/policyService.js',
  'migrations/migrate.js',
  'scripts/setup.js',
  'scripts/seed-admin.js',
  'README.md',
  'GETTING_STARTED.md'
];

let missingFiles = [];
requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) {
    missingFiles.push(file);
    allChecks = false;
  }
});

if (missingFiles.length === 0) {
  console.log(`   ✅ All ${requiredFiles.length} required files exist\n`);
} else {
  console.log(`   ❌ Missing files:\n`);
  missingFiles.forEach(file => console.log(`      - ${file}`));
  console.log('');
}

// Check 3: Dependencies
console.log('3. Checking dependencies...');
const packageJsonPath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const requiredDeps = [
    'express',
    'sequelize',
    'pg',
    'jsonwebtoken',
    'bcrypt',
    'joi',
    'helmet',
    'cors',
    'express-rate-limit',
    'nodemailer',
    'dotenv',
    'winston'
  ];

  let missingDeps = [];
  requiredDeps.forEach(dep => {
    if (!packageJson.dependencies[dep]) {
      missingDeps.push(dep);
      allChecks = false;
    }
  });

  if (missingDeps.length === 0) {
    console.log(`   ✅ All required dependencies listed in package.json\n`);
  } else {
    console.log(`   ❌ Missing dependencies:\n`);
    missingDeps.forEach(dep => console.log(`      - ${dep}`));
    console.log('');
  }
}

// Check 4: node_modules
console.log('4. Checking installed packages...');
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  console.log(`   ✅ node_modules directory exists\n`);
} else {
  console.log(`   ⚠️  node_modules not found. Run: npm install\n`);
}

// Check 5: .env file
console.log('5. Checking environment configuration...');
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  console.log(`   ✅ .env file exists\n`);
  
  // Check for critical variables
  console.log('6. Checking environment variables...');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const criticalVars = [
    'DB_NAME',
    'DB_USER',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'ENCRYPTION_KEY'
  ];
  
  let missingVars = [];
  criticalVars.forEach(varName => {
    if (!envContent.includes(varName + '=')) {
      missingVars.push(varName);
      allChecks = false;
    }
  });
  
  if (missingVars.length === 0) {
    console.log(`   ✅ All critical environment variables present\n`);
  } else {
    console.log(`   ❌ Missing environment variables:\n`);
    missingVars.forEach(v => console.log(`      - ${v}`));
    console.log('');
  }
} else {
  console.log(`   ⚠️  .env file not found. Run: npm run setup\n`);
  allChecks = false;
}

// Check 7: Directory structure
console.log('7. Checking directory structure...');
const requiredDirs = [
  'src/config',
  'src/controllers',
  'src/middleware',
  'src/models',
  'src/routes',
  'src/services',
  'src/utils',
  'src/validators',
  'migrations',
  'scripts'
];

let missingDirs = [];
requiredDirs.forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(dirPath)) {
    missingDirs.push(dir);
    allChecks = false;
  }
});

if (missingDirs.length === 0) {
  console.log(`   ✅ All required directories exist\n`);
} else {
  console.log(`   ❌ Missing directories:\n`);
  missingDirs.forEach(dir => console.log(`      - ${dir}`));
  console.log('');
}

// Summary
console.log('─'.repeat(50));
if (allChecks) {
  console.log('\n✅ All checks passed! Your API setup is correct.\n');
  console.log('Next steps:');
  console.log('1. Ensure PostgreSQL is running');
  console.log('2. Create database: createdb audit_software');
  console.log('3. Run migrations: npm run migrate');
  console.log('4. Seed admin user: npm run seed-admin');
  console.log('5. Start server: npm run dev\n');
} else {
  console.log('\n⚠️  Some checks failed. Please review the issues above.\n');
  console.log('Quick fixes:');
  console.log('- Install dependencies: npm install');
  console.log('- Setup environment: npm run setup');
  console.log('- Review GETTING_STARTED.md for detailed instructions\n');
}

