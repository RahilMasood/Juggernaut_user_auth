const { sequelize, Sequelize } = require('../src/config/database');
const logger = require('../src/utils/logger');

/**
 * Helper function to check if a column is already an enum type
 */
async function isColumnEnum(tableName, columnName) {
  const result = await sequelize.query(`
    SELECT 
      c.udt_name as current_type
    FROM information_schema.columns c
    WHERE c.table_name = $1
      AND c.column_name = $2
      AND c.table_schema = 'public'
  `, {
    bind: [tableName, columnName],
    type: Sequelize.QueryTypes.SELECT
  });
  
  return result && result.length > 0 && result[0].current_type && result[0].current_type.includes('enum');
}

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
    
    // Check if enum columns already exist (to skip syncing models with enums)
    const shouldSkipAuditClientSync = await isColumnEnum('audit_clients', 'status');
    const shouldSkipEngagementSync = await isColumnEnum('engagements', 'status');
    const shouldSkipEngagementUserSync = await isColumnEnum('engagement_users', 'role');
    const shouldSkipAuditLogSync = await isColumnEnum('audit_logs', 'status');
    const shouldSkipClientSync = await isColumnEnum('clients', 'status');
    const shouldSkipConfirmationRequestSync = await isColumnEnum('confirmation_requests', 'status') || await isColumnEnum('confirmation_requests', 'party_type');
    const shouldSkipIndependenceDeclarationSync = await isColumnEnum('independence_declarations', 'status');
    
    // Sync models individually, skipping User, AuditClient, Engagement, and EngagementUser if enums already exist
    const { Firm, AuditClient, Engagement, EngagementUser, RefreshToken, AuditLog, Permission, Role, Client, ConfirmationRequest, IndependenceDeclaration } = require('../src/models');
    
    // Sync all models except User, AuditClient, Engagement, and EngagementUser (if enums exist)
    await Firm.sync({ alter: true });
    
    if (!shouldSkipAuditClientSync) {
      await AuditClient.sync({ alter: true });
      logger.info('AuditClient model synced');
    } else {
      logger.info('Skipped AuditClient model sync (status column already an enum)');
    }
    
    if (!shouldSkipEngagementSync) {
      await Engagement.sync({ alter: true });
      logger.info('Engagement model synced');
    } else {
      logger.info('Skipped Engagement model sync (status column already an enum)');
    }
    
    if (!shouldSkipEngagementUserSync) {
      await EngagementUser.sync({ alter: true });
      logger.info('EngagementUser model synced');
    } else {
      logger.info('Skipped EngagementUser model sync (role column already an enum)');
    }
    
    await RefreshToken.sync({ alter: true });
    
    if (!shouldSkipAuditLogSync) {
      await AuditLog.sync({ alter: true });
      logger.info('AuditLog model synced');
    } else {
      logger.info('Skipped AuditLog model sync (status column already an enum)');
    }
    
    await Permission.sync({ alter: true });
    await Role.sync({ alter: true });
    
    if (!shouldSkipClientSync) {
      await Client.sync({ alter: true });
      logger.info('Client model synced');
    } else {
      logger.info('Skipped Client model sync (status column already an enum)');
    }
    
    if (!shouldSkipConfirmationRequestSync) {
      await ConfirmationRequest.sync({ alter: true });
      logger.info('ConfirmationRequest model synced');
    } else {
      logger.info('Skipped ConfirmationRequest model sync (enum columns already exist)');
    }
    
    if (!shouldSkipIndependenceDeclarationSync) {
      await IndependenceDeclaration.sync({ alter: true });
      logger.info('IndependenceDeclaration model synced');
    } else {
      logger.info('Skipped IndependenceDeclaration model sync (status column already an enum)');
    }
    
    // Only sync User if enum doesn't exist yet
    if (!shouldSkipUserSync) {
      const { User } = require('../src/models');
      await User.sync({ alter: true });
      logger.info('User model synced');
    } else {
      logger.info('Skipped User model sync (type column already an enum)');
      // Still ensure comment is added if missing
      try {
        await sequelize.query(`
          COMMENT ON COLUMN users.type IS 'Organizational seniority level'
        `);
      } catch (error) {
        // Ignore if comment already exists
      }
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

