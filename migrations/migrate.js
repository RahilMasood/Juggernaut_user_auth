const { sequelize } = require('../src/config/database');
const logger = require('../src/utils/logger');

/**
 * Migration script to create all tables
 * Run with: node migrations/migrate.js
 */

async function migrate() {
  try {
    logger.info('Starting database migration...');
    
    // Import models to register them with Sequelize
    require('../src/models');
    
    // Sync all models with database
    await sequelize.sync({ alter: true });
    
    logger.info('Database migration completed successfully');
    
    // Create default permissions
    await seedDefaultPermissions();
    
    logger.info('Default data seeded successfully');
    
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
}

async function seedDefaultPermissions() {
  const { Permission } = require('../src/models');
  
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
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrate();
}

module.exports = { migrate };

