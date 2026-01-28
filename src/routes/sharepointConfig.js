const express = require('express');
const router = express.Router();
const sharepointConfigController = require('../controllers/sharepointConfigController');
const { authenticate } = require('../middleware/auth');
const { uuidParamSchema } = require('../validators/schemas');
const validate = require('../middleware/validation');

// All routes require authentication
router.use(authenticate);

// Get SharePoint config for an engagement
router.get('/:engagementId', validate(uuidParamSchema), sharepointConfigController.getConfig.bind(sharepointConfigController));

module.exports = router;

