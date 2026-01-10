#!/usr/bin/env node

/**
 * Fix Partner role permissions - ensures Partner role has all permissions
 * Run with: node scripts/fix-partner-permissions.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Firm, Role, Permission } = require('../src/models');
const logger = require('../src/utils/logger');

async function fixPartnerPermissions() {
  try {
    console.log('\n🔧 Fixing Partner role permissions...\n');

    // Find the example firm
    const firm = await Firm.findOne({ where: { domain: 'example.com' } });
    
    if (!firm) {
      console.log('❌ Firm not found. Please run seed-admin.js first.\n');
      process.exit(1);
    }

    // Find Partner role
    const partnerRole = await Role.findOne({ 
      where: { 
        firm_id: firm.id,
        name: 'Partner'
      } 
    });

    if (!partnerRole) {
      console.log('❌ Partner role not found. Please run seed-admin.js first.\n');
      process.exit(1);
    }

    // Get all permissions
    const allPermissions = await Permission.findAll();
    
    if (allPermissions.length === 0) {
      console.log('❌ No permissions found. Please run migrations first.\n');
      process.exit(1);
    }

    // Update Partner role to have all permissions
    await partnerRole.setPermissions(allPermissions);
    
    console.log(`✅ Partner role now has all ${allPermissions.length} permissions assigned\n`);
    console.log('Permissions:');
    allPermissions.forEach(perm => {
      console.log(`  - ${perm.name}`);
    });
    console.log('\n✅ Done! You can now test the engagements endpoint.\n');
    
    process.exit(0);
  } catch (error) {
    logger.error('Fix permissions failed:', error);
    console.error('\n❌ Fix failed:', error.message, '\n');
    process.exit(1);
  }
}

fixPartnerPermissions();

