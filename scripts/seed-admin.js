#!/usr/bin/env node

/**
 * Create initial firm and admin user
 * Run with: node scripts/seed-admin.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Firm, User, Role, Permission } = require('../src/models');
const { generatePassword } = require('../src/utils/passwordGenerator');
const logger = require('../src/utils/logger');

async function seedAdmin() {
  try {
    console.log('\n🌱 Seeding initial firm and admin user...\n');

    // Create a default firm
    let firm = await Firm.findOne({ where: { domain: 'example.com' } });
    
    if (!firm) {
      firm = await Firm.create({
        name: 'Example Audit Firm',
        domain: 'example.com',
        is_active: true,
        settings: {
          create_engagement: {
            allowed_roles: ['Partner', 'Manager'],
            custom_users: []
          },
          access_confirmation_tool: {
            allowed_roles: ['Partner', 'Manager', 'Senior Auditor'],
            custom_users: []
          }
        }
      });
      console.log(`✅ Created firm: ${firm.name}`);
    } else {
      console.log(`ℹ️  Firm already exists: ${firm.name}`);
    }

    // Create Partner role
    let partnerRole = await Role.findOne({ 
      where: { 
        firm_id: firm.id,
        name: 'Partner'
      } 
    });

    if (!partnerRole) {
      partnerRole = await Role.create({
        firm_id: firm.id,
        name: 'Partner',
        description: 'Firm Partner with full access',
        hierarchy_level: 100,
        is_default: true
      });
      console.log(`✅ Created Partner role`);
    } else {
      console.log(`ℹ️  Partner role already exists`);
    }

    // Ensure Partner role has all permissions (update if needed)
    const allPermissions = await Permission.findAll();
    await partnerRole.setPermissions(allPermissions);
    console.log(`✅ Partner role has all ${allPermissions.length} permissions assigned`);

    // Create admin user
    const adminEmail = 'admin@example.com';
    let adminUser = await User.findOne({ where: { email: adminEmail } });

    if (!adminUser) {
      const adminPassword = generatePassword(16);
      
      adminUser = await User.create({
        firm_id: firm.id,
        email: adminEmail,
        password_hash: adminPassword,
        first_name: 'Admin',
        last_name: 'User',
        user_type: 'AUDITOR',
        designation: 'Partner',
        is_active: true,
        must_change_password: true
      });

      // Assign Partner role
      await adminUser.addRole(partnerRole);

      console.log(`\n✅ Created admin user:`);
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
      console.log(`\n⚠️  IMPORTANT: Save this password! You'll need to change it on first login.\n`);
    } else {
      console.log(`\nℹ️  Admin user already exists: ${adminEmail}\n`);
    }

    console.log('✅ Seeding complete!\n');
    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed:', error);
    console.error('\n❌ Seeding failed:', error.message, '\n');
    process.exit(1);
  }
}

seedAdmin();

