const { sequelize } = require('../src/config/database');
const fs = require('fs');
const path = require('path');
const logger = require('../src/utils/logger');

async function migrate() {
  try {
    logger.info('Starting migration to add tool-based session management...');
    
    const sqlFile = path.join(__dirname, '011_add_tool_based_sessions.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    await sequelize.query(sql);
    
    logger.info('Migration completed successfully');
    
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    console.error('Migration error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  migrate();
}

module.exports = { migrate };

