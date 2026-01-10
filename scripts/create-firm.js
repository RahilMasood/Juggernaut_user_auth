const bcrypt = require('bcrypt');
const { sequelize, Firm } = require('../src/models');
const readline = require('readline');
const logger = require('../src/utils/logger');
const authConfig = require('../src/config/auth');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function createFirm() {
  try {
    console.log('\n=== Create New Firm ===\n');

    // Get firm details
    const tenantId = await question('Enter tenant_id: ');
    const clientId = await question('Enter client_id: ');
    const clientSecret = await question('Enter client_secret: ');
    const adminId = await question('Enter admin_id (login username): ');
    const adminPassword = await question('Enter admin_password (will be hashed): ');
    const confirmPassword = await question('Confirm admin_password: ');

    // Validate inputs
    if (!tenantId || !clientId || !clientSecret || !adminId || !adminPassword) {
      console.error('\n❌ All fields are required!');
      process.exit(1);
    }

    if (adminPassword !== confirmPassword) {
      console.error('\n❌ Passwords do not match!');
      process.exit(1);
    }

    // Check if admin_id already exists
    const existingFirm = await Firm.findOne({ where: { admin_id: adminId } });
    if (existingFirm) {
      console.error(`\n❌ Firm with admin_id "${adminId}" already exists!`);
      process.exit(1);
    }

    // Check if tenant_id already exists
    const existingTenant = await Firm.findOne({ where: { tenant_id: tenantId } });
    if (existingTenant) {
      console.error(`\n❌ Firm with tenant_id "${tenantId}" already exists!`);
      process.exit(1);
    }

    // Hash the password
    console.log('\n⏳ Hashing password...');
    const hashedPassword = await bcrypt.hash(adminPassword, authConfig.bcrypt.rounds);

    // Create the firm
    console.log('⏳ Creating firm...');
    const firm = await Firm.create({
      tenant_id: tenantId,
      client_id: clientId,
      client_secret: clientSecret,
      admin_id: adminId,
      admin_password: hashedPassword
    });

    console.log('\n✅ Firm created successfully!');
    console.log('\nFirm Details:');
    console.log('─'.repeat(50));
    console.log(`Firm ID:        ${firm.id}`);
    console.log(`Tenant ID:      ${firm.tenant_id}`);
    console.log(`Client ID:      ${firm.client_id}`);
    console.log(`Admin ID:       ${firm.admin_id}`);
    console.log('─'.repeat(50));
    console.log('\n💡 You can now login using:');
    console.log(`   POST /api/v1/admin/login`);
    console.log(`   Body: { "admin_id": "${adminId}", "password": "${adminPassword}" }`);
    console.log('\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating firm:', error.message);
    logger.error('Create firm error:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run if executed directly
if (require.main === module) {
  createFirm();
}

module.exports = { createFirm };

