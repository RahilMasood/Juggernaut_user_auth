const { sequelize, Sequelize } = require('../src/config/database');
const logger = require('../src/utils/logger');

/**
 * Main migration script
 * Runs all SQL migrations and syncs Sequelize models
 */

async function migrate() {
  try {
    logger.info('Starting database migration...');
    
    // Import all models to register them with Sequelize
    require('../src/models');
    
    // Check for NULL values in firms table before syncing
    // This prevents NOT NULL constraint errors
    // Check for NULL values in firms table before syncing
    // This prevents NOT NULL constraint errors
    const checkNullsQuery = `
      SELECT COUNT(*)::int as count FROM firms WHERE tenant_id IS NULL
    `;
    const nullTenantResults = await sequelize.query(checkNullsQuery, {
      type: Sequelize.QueryTypes.SELECT
    });
    if (nullTenantResults && nullTenantResults.length > 0 && nullTenantResults[0].count > 0) {
      logger.info(`Found ${nullTenantResults[0].count} firms with NULL tenant_id. Updating...`);
      await sequelize.query(`
        UPDATE firms SET tenant_id = 'tenant_' || id::text WHERE tenant_id IS NULL
      `);
      logger.info('Updated NULL tenant_id values');
    }
    
    // Check and update other required fields
    const fieldsToCheck = ['client_id', 'client_secret', 'admin_id', 'admin_password'];
    for (const field of fieldsToCheck) {
      const results = await sequelize.query(`
        SELECT COUNT(*)::int as count FROM firms WHERE ${field} IS NULL
      `, {
        type: Sequelize.QueryTypes.SELECT
      });
      if (results && results.length > 0 && results[0].count > 0) {
        logger.info(`Found ${results[0].count} firms with NULL ${field}. Updating...`);
        if (field === 'admin_password') {
          // Use a default hash for admin_password
          const bcrypt = require('bcrypt');
          const defaultHash = await bcrypt.hash('changeme', 12);
          await sequelize.query(`
            UPDATE firms SET ${field} = $1 WHERE ${field} IS NULL
          `, { bind: [defaultHash] });
        } else {
          await sequelize.query(`
            UPDATE firms SET ${field} = '${field}_' || id::text WHERE ${field} IS NULL
          `);
        }
        logger.info(`Updated NULL ${field} values`);
      }
    }
    
    // Check if users.type column is already an enum type
    const enumCheck = await sequelize.query(`
      SELECT t.typname enum_name, array_agg(e.enumlabel ORDER BY enumsortorder) enum_value 
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid 
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace 
      WHERE n.nspname = 'public' AND t.typname='enum_users_type' 
      GROUP BY 1
    `, {
      type: Sequelize.QueryTypes.SELECT
    });
    
    const shouldSkipUserSync = enumCheck && enumCheck.length > 0;
    
    // Sync all models with database (alter: true will update schema)
    await sequelize.sync({ alter: true });
    
    if (shouldSkipUserSync) {
      logger.info('Skipped User model sync (type column already correct)');
    }
    
    logger.info('Database migration completed successfully');
    
    // Seed default permissions if Permission model exists
    try {
      const { Permission } = require('../src/models');
      if (Permission) {
        await seedDefaultPermissions();
      }
    } catch (error) {
      logger.warn('Could not seed default permissions:', error.message);
    }
    
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    console.error('Migration error:', error);
    process.exit(1);
  }
}

async function seedDefaultPermissions() {
  try {
    const { Permission } = require('../src/models');
    if (!Permission) {
      logger.warn('Permission model not found, skipping seed');
      return;
    }
    
    const defaultPermissions = [
      { name: 'view_users', description: 'View users' },
      { name: 'create_users', description: 'Create users' },
      { name: 'edit_users', description: 'Edit users' },
      { name: 'delete_users', description: 'Delete users' },
      { name: 'manage_users', description: 'Manage all user operations' },
      { name: 'view_engagements', description: 'View engagements' },
      { name: 'create_engagements', description: 'Create engagements' },
      { name: 'edit_engagements', description: 'Edit engagements' },
      { name: 'delete_engagements', description: 'Delete engagements' },
      { name: 'manage_engagements', description: 'Manage all engagement operations' },
      { name: 'view_clients', description: 'View clients' },
      { name: 'create_clients', description: 'Create clients' },
      { name: 'edit_clients', description: 'Edit clients' },
      { name: 'delete_clients', description: 'Delete clients' },
      { name: 'manage_clients', description: 'Manage all client operations' },
      { name: 'view_reports', description: 'View reports' },
      { name: 'create_reports', description: 'Create reports' },
      { name: 'edit_reports', description: 'Edit reports' },
      { name: 'delete_reports', description: 'Delete reports' },
      { name: 'manage_reports', description: 'Manage all report operations' },
      { name: 'admin_access', description: 'Full admin access' },
      { name: 'view_audit_logs', description: 'View audit logs' },
      { name: 'manage_firm_settings', description: 'Manage firm settings' }
    ];
    
    for (const perm of defaultPermissions) {
      await Permission.findOrCreate({
        where: { name: perm.name },
        defaults: perm
      });
    }
    
    logger.info(`Seeded ${defaultPermissions.length} default permissions`);
  } catch (error) {
    logger.error('Error seeding default permissions:', error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrate();
}

module.exports = { migrate };

