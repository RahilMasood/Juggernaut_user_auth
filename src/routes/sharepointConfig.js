const express = require('express');
const router = express.Router();
const sharepointConfigController = require('../controllers/sharepointConfigController');

/**
 * GET /api/v1/sharepoint-config/:engagementId
 * Get SharePoint configuration for an engagement
 */
router.get('/:engagementId', sharepointConfigController.getConfig.bind(sharepointConfigController));

module.exports = router;

