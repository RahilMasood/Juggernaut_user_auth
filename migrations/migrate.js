const { sequelize } = require('../src/config/database');
const logger = require('../src/utils/logger');

/**
 * Migration script to create all tables
 * Run with: node migrations/migrate.js
 */

async function migrate() {
  try {
    logger.info('Starting database migration...');
    
    // Handle NULL values in required fields before syncing
    const [tenantResults] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM firms 
      WHERE tenant_id IS NULL
    `);
    
    const tenantNullCount = parseInt(tenantResults[0].count);
    if (tenantNullCount > 0) {
      logger.info(`Found ${tenantNullCount} firms with NULL tenant_id. Updating...`);
      await sequelize.query(`
        UPDATE firms 
        SET tenant_id = 'tenant_' || id::text 
        WHERE tenant_id IS NULL
      `);
      logger.info('Updated NULL tenant_id values');
    }
    
    // Handle NULL values in client_id
    const [clientIdResults] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM firms 
      WHERE client_id IS NULL
    `);
    
    const clientIdNullCount = parseInt(clientIdResults[0].count);
    if (clientIdNullCount > 0) {
      logger.info(`Found ${clientIdNullCount} firms with NULL client_id. Updating...`);
      await sequelize.query(`
        UPDATE firms 
        SET client_id = 'client_' || id::text 
        WHERE client_id IS NULL
      `);
      logger.info('Updated NULL client_id values');
    }
    
    // Handle NULL values in client_secret
    const [clientSecretResults] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM firms 
      WHERE client_secret IS NULL
    `);
    
    const clientSecretNullCount = parseInt(clientSecretResults[0].count);
    if (clientSecretNullCount > 0) {
      logger.info(`Found ${clientSecretNullCount} firms with NULL client_secret. Updating...`);
      await sequelize.query(`
        UPDATE firms 
        SET client_secret = 'secret_' || id::text 
        WHERE client_secret IS NULL
      `);
      logger.info('Updated NULL client_secret values');
    }
    
    // Handle NULL values in admin_id
    const [adminIdResults] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM firms 
      WHERE admin_id IS NULL
    `);
    
    const adminIdNullCount = parseInt(adminIdResults[0].count);
    if (adminIdNullCount > 0) {
      logger.info(`Found ${adminIdNullCount} firms with NULL admin_id. Updating...`);
      await sequelize.query(`
        UPDATE firms 
        SET admin_id = 'admin_' || id::text 
        WHERE admin_id IS NULL
      `);
      logger.info('Updated NULL admin_id values');
    }
    
    // Handle NULL values in admin_password
    const [adminPasswordResults] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM firms 
      WHERE admin_password IS NULL
    `);
    
    const adminPasswordNullCount = parseInt(adminPasswordResults[0].count);
    if (adminPasswordNullCount > 0) {
      logger.info(`Found ${adminPasswordNullCount} firms with NULL admin_password. Updating...`);
      // Generate a temporary password hash (you'll need to update these later)
      const bcrypt = require('bcrypt');
      const tempPassword = await bcrypt.hash('TempPassword123!', 10);
      await sequelize.query(`
        UPDATE firms 
        SET admin_password = $1
        WHERE admin_password IS NULL
      `, { bind: [tempPassword] });
      logger.info('Updated NULL admin_password values');
    }
    
    // Handle enum type conversion for users.type before syncing
    try {
      // Check if users table exists
      const [tableCheck] = await sequelize.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = 'users'
        ) as exists
      `);
      
      if (tableCheck[0].exists) {
        // Create enum type if it doesn't exist
        const [enumCheck] = await sequelize.query(`
          SELECT EXISTS (
            SELECT 1 FROM pg_type WHERE typname = 'enum_users_type'
          ) as exists
        `);
        
        if (!enumCheck[0].exists) {
          logger.info('Creating enum_users_type...');
          await sequelize.query(`
            CREATE TYPE enum_users_type AS ENUM('partner', 'manager', 'associate', 'article')
          `);
        }
        
        // Check current type of the column
        const [typeColumnCheck] = await sequelize.query(`
          SELECT 
            c.data_type,
            c.udt_name,
            pg_type.typname as enum_name
          FROM information_schema.columns c
          LEFT JOIN pg_type ON pg_type.typname = c.udt_name
          WHERE c.table_name = 'users' AND c.column_name = 'type'
        `);
        
        if (typeColumnCheck.length > 0) {
          const currentType = typeColumnCheck[0].data_type;
          const udtName = typeColumnCheck[0].udt_name;
          
          // If it's not already the enum type, convert it
          if (udtName !== 'enum_users_type') {
            logger.info('Converting users.type column to enum...');
            
            // First ensure all values are valid enum values
            await sequelize.query(`
              UPDATE users 
              SET type = 'associate' 
              WHERE type IS NULL 
                 OR type NOT IN ('partner', 'manager', 'associate', 'article')
            `);
            
            // Convert column type to enum
            await sequelize.query(`
              ALTER TABLE users 
              ALTER COLUMN type TYPE enum_users_type 
              USING type::text::enum_users_type
            `);
            
            logger.info('Successfully converted users.type to enum');
          } else {
            logger.info('users.type column is already an enum type');
          }
        }
      }
    } catch (error) {
      logger.warn('Enum conversion warning (may already be done):', error.message);
    }
    
    // Ensure comment exists on users.type column before Sequelize sync
    // This prevents Sequelize from trying to add it in a way that conflicts
    try {
      const [hasComment] = await sequelize.query(`
        SELECT COUNT(*) as count
        FROM pg_catalog.pg_description d
        JOIN pg_catalog.pg_class c ON d.objoid = c.oid
        JOIN pg_catalog.pg_attribute a ON d.objoid = a.attrelid AND d.objsubid = a.attnum
        WHERE c.relname = 'users' 
        AND a.attname = 'type'
        AND d.description IS NOT NULL
      `);
      
      if (parseInt(hasComment[0].count) === 0) {
        logger.info('Adding comment to users.type column...');
        await sequelize.query(`
          COMMENT ON COLUMN users.type IS 'Organizational seniority level'
        `);
      }
    } catch (error) {
      logger.warn('Comment check warning:', error.message);
    }
    
    // Check if users.type is already enum BEFORE importing models
    const [typeCheck] = await sequelize.query(`
      SELECT udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'type'
    `);
    
    const userTypeIsEnum = typeCheck.length > 0 && typeCheck[0].udt_name === 'enum_users_type';
    
    // Import models to register them with Sequelize
    const models = require('../src/models');
    
    // Also import Permission model if it exists
    let Permission;
    try {
      Permission = require('../src/models/Permission');
    } catch (error) {
      logger.warn('Permission model not found, will skip permission seeding');
    }
    
    if (userTypeIsEnum) {
      logger.info('users.type is already enum, syncing all models except User to avoid conflicts');
      // Sync all models except User
      const { User, ...otherModels } = models;
      for (const [modelName, model] of Object.entries(otherModels)) {
        if (model && typeof model.sync === 'function') {
          try {
            await model.sync({ alter: true });
          } catch (error) {
            logger.warn(`Warning syncing ${modelName}:`, error.message);
          }
        }
      }
      // Sync Permission model if it exists
      if (Permission && typeof Permission.sync === 'function') {
        try {
          await Permission.sync({ alter: true });
        } catch (error) {
          logger.warn('Warning syncing Permission:', error.message);
        }
      }
      logger.info('Skipped User model sync (type column already correct)');
    } else {
      // Sync all models normally
      await sequelize.sync({ alter: true });
      // Also sync Permission if it exists but wasn't included in models
      if (Permission && typeof Permission.sync === 'function') {
        try {
          await Permission.sync({ alter: true });
        } catch (error) {
          logger.warn('Warning syncing Permission:', error.message);
        }
      }
    }
    
    logger.info('Database migration completed successfully');
    
    // Create default permissions
    try {
      await seedDefaultPermissions();
      logger.info('Default data seeded successfully');
    } catch (error) {
      logger.warn('Warning seeding default permissions:', error.message);
      // Don't fail the migration if permission seeding fails
    }
    
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
}

async function seedDefaultPermissions() {
  try {
    // Try to require Permission model directly
    const Permission = require('../src/models/Permission');
    
    if (!Permission || typeof Permission.findOrCreate !== 'function') {
      logger.info('Permission model not available, skipping permission seeding');
      return;
    }
    
    const permissions = [
      // Engagement permissions
      { name: 'create_engagement', description: 'Create new engagements', category: 'engagement' },
      { name: 'edit_engagement', description: 'Edit engagement details', category: 'engagement' },
      { name: 'delete_engagement', description: 'Delete engagements', category: 'engagement' },
      { name: 'view_engagement', description: 'View engagement details', category: 'engagement' },
      { name: 'manage_engagement_team', description: 'Add/remove users from engagement', category: 'engagement' },
      
      // Tool permissions
      { name: 'access_confirmation_tool', description: 'Access confirmation tool', category: 'tool' },
      { name: 'create_confirmation', description: 'Create confirmation requests', category: 'tool' },
      { name: 'view_confirmation', description: 'View confirmation requests', category: 'tool' },
      { name: 'respond_confirmation', description: 'Respond to confirmation requests', category: 'tool' },
      
      // Client onboarding permissions
      { name: 'create_client', description: 'Onboard new clients', category: 'client' },
      { name: 'edit_client', description: 'Edit client details', category: 'client' },
      { name: 'view_client', description: 'View client details', category: 'client' },
      
      // Independence tool permissions
      { name: 'access_independence_tool', description: 'Access independence tool', category: 'independence' },
      { name: 'add_user_for_independence', description: 'Add users to declare independence', category: 'independence' },
      { name: 'declare_independence', description: 'Submit independence declaration', category: 'independence' },
      { name: 'review_independence', description: 'Review independence declarations', category: 'independence' },
      
      // User management permissions
      { name: 'manage_users', description: 'Manage user accounts', category: 'admin' },
      { name: 'manage_roles', description: 'Manage roles and permissions', category: 'admin' },
      { name: 'view_audit_logs', description: 'View audit logs', category: 'admin' },
      { name: 'manage_firm_settings', description: 'Manage firm settings', category: 'admin' }
    ];
    
    for (const perm of permissions) {
      await Permission.findOrCreate({
        where: { name: perm.name },
        defaults: perm
      });
    }
    
    logger.info(`Seeded ${permissions.length} default permissions`);
  } catch (error) {
    logger.warn('Error seeding permissions:', error.message);
    throw error;
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrate();
}

module.exports = { migrate };

