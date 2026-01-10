const { sequelize } = require('../src/config/database');
const fs = require('fs');
const path = require('path');
const logger = require('../src/utils/logger');

/**
 * Migration script to restructure database schema
 * Run with: node migrations/migrate-new-schema.js
 */

async function migrate() {
  try {
    logger.info('Starting database schema migration...');
    
    // Read SQL migration file
    const sqlFile = path.join(__dirname, '002_restructure_schema.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Execute SQL migration
    await sequelize.query(sql);
    
    logger.info('SQL migration completed');
    
    // Import models to register them with Sequelize
    require('../src/models');
    
    // Sync all models with database (this will create any missing tables/indexes)
    await sequelize.sync({ alter: false }); // Don't alter, we've done manual migration
    
    logger.info('Database migration completed successfully');
    
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

