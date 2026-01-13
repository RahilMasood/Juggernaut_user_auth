const { sequelize } = require('../src/config/database');
const fs = require('fs');
const path = require('path');
const logger = require('../src/utils/logger');

/**
 * Migration script to add composite index for single session enforcement
 * Run with: node migrations/migrate-single-session-index.js
 */

async function migrate() {
  try {
    logger.info('Starting migration to add single session index...');
    
    // Read SQL migration file
    const sqlFile = path.join(__dirname, '007_add_single_session_index.sql');
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

