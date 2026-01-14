require('dotenv').config();
const app = require('./src/app');
const logger = require('./src/utils/logger');
const { sequelize } = require('./src/config/database');
const authService = require('./src/services/authService');

const PORT = process.env.PORT || 3000;

// Test database connection
sequelize.authenticate()
  .then(() => {
    logger.info('Database connection established successfully');
    
    // Start server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    });

    // Start background job to auto-revoke stale tokens
    // Runs every 2 minutes to check for tokens that haven't been updated in 5+ minutes
    // This handles cases where app crashes or system force shuts down
    const STALE_TOKEN_CHECK_INTERVAL = 2 * 60 * 1000; // 2 minutes
    
    setInterval(async () => {
      try {
        await authService.revokeStaleTokens();
      } catch (error) {
        logger.error('Error in stale token revocation job:', error);
      }
    }, STALE_TOKEN_CHECK_INTERVAL);

    logger.info('Stale token auto-revocation job started (runs every 2 minutes)');
  })
  .catch(err => {
    logger.error('Unable to connect to the database:', err);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  sequelize.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  sequelize.close();
  process.exit(0);
});

