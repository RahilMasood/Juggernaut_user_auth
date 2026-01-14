#!/usr/bin/env node

/**
 * Generate all required secrets for Railway deployment
 * Run: node scripts/generate-secrets.js
 */

const crypto = require('crypto');

console.log('\n🔐 Generating Secrets for Railway Deployment\n');
console.log('=' .repeat(60));
console.log('\nCopy these values to your Railway environment variables:\n');

// JWT Access Secret (64+ characters)
const jwtAccessSecret = crypto.randomBytes(64).toString('hex');
console.log('JWT_ACCESS_SECRET=');
console.log(jwtAccessSecret);
console.log('');

// JWT Refresh Secret (64+ characters)
const jwtRefreshSecret = crypto.randomBytes(64).toString('hex');
console.log('JWT_REFRESH_SECRET=');
console.log(jwtRefreshSecret);
console.log('');

// Encryption Key (exactly 32 characters)
const encryptionKey = crypto.randomBytes(16).toString('hex');
console.log('ENCRYPTION_KEY=');
console.log(encryptionKey);
console.log('');

// Webhook Secret (32+ characters)
const webhookSecret = crypto.randomBytes(32).toString('hex');
console.log('PAYROLL_WEBHOOK_SECRET=');
console.log(webhookSecret);
console.log('');

console.log('=' .repeat(60));
console.log('\n✅ All secrets generated successfully!');
console.log('\n⚠️  IMPORTANT:');
console.log('   - Save these secrets securely');
console.log('   - Never commit them to Git');
console.log('   - Add them to Railway environment variables');
console.log('   - Keep them safe - you\'ll need them for production\n');

