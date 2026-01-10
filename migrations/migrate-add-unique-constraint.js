const fs = require('fs');
const path = require('path');
const { sequelize } = require('../src/config/database');
const logger = require('../src/utils/logger');

async function migrate() {
  try {
    logger.info('Starting migration to add unique constraint to client_name...');
    
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '004_add_unique_constraint_client_name.sql'),
      'utf8'
    );

    logger.debug('Executing migration SQL...');
    await sequelize.query(migrationSQL);

    logger.info('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrate();

