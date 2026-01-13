const { sequelize } = require('../src/config/database');
const fs = require('fs');
const path = require('path');
const logger = require('../src/utils/logger');

/**
 * Migration script to add no_users field to firms table
 * Run with: node migrations/migrate-add-no-users.js
 */

async function migrate() {
  try {
    logger.info('Starting migration to add no_users to firms...');
    
    // Read SQL migration file
    const sqlFile = path.join(__dirname, '008_add_no_users_to_firms.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Execute SQL migration
    await sequelize.query(sql);
    
    logger.info('Migration completed successfully');
    
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    console.error('Migration error:', error);
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrate();
}

module.exports = { migrate };

