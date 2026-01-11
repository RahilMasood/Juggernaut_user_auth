const { sequelize } = require('../src/config/database');
const fs = require('fs');
const path = require('path');
const logger = require('../src/utils/logger');

/**
 * Migration script to add is_default field to engagements
 * Run with: node migrations/migrate-add-is-default.js
 */

async function migrate() {
  try {
    logger.info('Starting migration to add is_default to engagements...');
    
    // Read SQL migration file
    const sqlFile = path.join(__dirname, '005_add_is_default_to_engagements.sql');
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

