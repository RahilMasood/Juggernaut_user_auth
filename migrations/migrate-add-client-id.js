const fs = require('fs');
const path = require('path');
const { sequelize } = require('../src/config/database');
const logger = require('../src/utils/logger');

async function migrate() {
  try {
    logger.info('Starting migration to add client_id to audit_clients...');
    
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '003_add_client_id_to_audit_clients.sql'),
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

