const express = require('express');
const router = express.Router();
const engagementManagementController = require('../controllers/engagementManagementController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validation');
const { adminCreateEngagementSchema } = require('../validators/schemas');
const logger = require('../utils/logger');

// Create engagement route - accessible to all authenticated users (no admin required)
// This route MUST be registered BEFORE engagementManagementRoutes in app.js
router.post('/clients/:clientId/engagements', (req, res, next) => {
  logger.info('POST /clients/:clientId/engagements - Using regular authenticate middleware');
  next();
}, authenticate, validate(adminCreateEngagementSchema), engagementManagementController.createEngagement.bind(engagementManagementController));

module.exports = router;

