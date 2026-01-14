const { sequelize } = require('../src/config/database');
const fs = require('fs');
const path = require('path');
const logger = require('../src/utils/logger');

/**
 * Migration script to add 'Pending' value to enum_status enum
 * Run with: node migrations/migrate-add-pending-status.js
 */

async function migrate() {
  try {
    logger.info('Starting migration to add Pending to enum_status...');
    
    // Read SQL migration file
    const sqlFile = path.join(__dirname, '009_add_pending_to_status_enum.sql');
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



