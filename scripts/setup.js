#!/usr/bin/env node

/**
 * Setup script for first-time configuration
 * Run with: node scripts/setup.js
 */

require('dotenv').config();
const readline = require('readline');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function generateSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

async function setup() {
  console.log('\n🔧 Audit Software API - Initial Setup\n');
  console.log('This script will help you configure your environment.\n');

  const envPath = path.join(__dirname, '..', '.env');
  const envExamplePath = path.join(__dirname, '..', '.env.example');

  // Check if .env already exists
  if (fs.existsSync(envPath)) {
    const overwrite = await question('.env file already exists. Overwrite? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('\n✅ Setup cancelled. Using existing .env file.\n');
      rl.close();
      return;
    }
  }

  console.log('\n📝 Database Configuration\n');
  const dbHost = await question('PostgreSQL Host (localhost): ') || 'localhost';
  const dbPort = await question('PostgreSQL Port (5432): ') || '5432';
  const dbName = await question('Database Name (audit_software): ') || 'audit_software';
  const dbUser = await question('Database User (postgres): ') || 'postgres';
  const dbPassword = await question('Database Password: ');

  console.log('\n🔐 Security Configuration\n');
  console.log('Generating secure JWT secrets...');
  const jwtAccessSecret = generateSecret();
  const jwtRefreshSecret = generateSecret();
  const encryptionKey = crypto.randomBytes(32).toString('hex').slice(0, 32);
  const webhookSecret = generateSecret(32);

  console.log('\n📧 Email Configuration\n');
  const smtpHost = await question('SMTP Host: ');
  const smtpPort = await question('SMTP Port (587): ') || '587';
  const smtpUser = await question('SMTP Username: ');
  const smtpPass = await question('SMTP Password: ');
  const emailFrom = await question('From Email Address: ');

  console.log('\n🌐 Application URLs\n');
  const port = await question('API Port (3000): ') || '3000';
  const clientPortalUrl = await question('Client Portal URL (http://localhost:3001): ') || 'http://localhost:3001';
  const confirmingPartyUrl = await question('Confirming Party Portal URL (http://localhost:3002): ') || 'http://localhost:3002';

  // Create .env content
  const envContent = `NODE_ENV=development
PORT=${port}

# Database
DB_HOST=${dbHost}
DB_PORT=${dbPort}
DB_NAME=${dbName}
DB_USER=${dbUser}
DB_PASSWORD=${dbPassword}

# JWT
JWT_ACCESS_SECRET=${jwtAccessSecret}
JWT_REFRESH_SECRET=${jwtRefreshSecret}
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Email
SMTP_HOST=${smtpHost}
SMTP_PORT=${smtpPort}
SMTP_USER=${smtpUser}
SMTP_PASS=${smtpPass}
EMAIL_FROM=${emailFrom}

# Webhook Security
PAYROLL_WEBHOOK_SECRET=${webhookSecret}

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ENCRYPTION_KEY=${encryptionKey}

# Application
CLIENT_PORTAL_URL=${clientPortalUrl}
CONFIRMING_PARTY_PORTAL_URL=${confirmingPartyUrl}
`;

  // Write .env file
  fs.writeFileSync(envPath, envContent);

  console.log('\n✅ Configuration saved to .env\n');
  console.log('📋 Next steps:\n');
  console.log('1. Create the database:');
  console.log(`   createdb ${dbName}\n`);
  console.log('2. Run migrations:');
  console.log('   npm run migrate\n');
  console.log('3. Start the server:');
  console.log('   npm run dev\n');
  console.log('⚠️  Important: Keep your .env file secure and never commit it to version control!\n');
  console.log('📝 Your webhook secret for payroll integration:');
  console.log(`   ${webhookSecret}\n`);

  rl.close();
}

setup().catch(err => {
  console.error('Setup failed:', err);
  rl.close();
  process.exit(1);
});

