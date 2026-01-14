const { sequelize } = require('../src/config/database');
const fs = require('fs');
const path = require('path');
const logger = require('../src/utils/logger');

/**
 * Migration script to add updated_at index to refresh_tokens table for heartbeat mechanism
 * This enables efficient queries to find stale tokens that haven't been updated in X minutes
 * Used for auto-revoking tokens when app crashes or system force shuts down
 * 
 * Run with: node migrations/migrate-add-updated-at-index.js
 */

async function migrate() {
  try {
    logger.info('Starting migration to add updated_at index to refresh_tokens table...');
    
    // Read SQL migration file
    const sqlFile = path.join(__dirname, '010_add_updated_at_index_to_refresh_tokens.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Execute SQL migration
    await sequelize.query(sql);
    
    logger.info('Migration completed successfully');
    logger.info('The updated_at index has been added to refresh_tokens table');
    logger.info('This enables the heartbeat mechanism to auto-revoke stale tokens');
    
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

