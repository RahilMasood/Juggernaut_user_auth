const express = require('express');
const router = express.Router();
const externalUserController = require('../controllers/externalUserController');
const { authenticate } = require('../middleware/auth');
const { uuidParamSchema } = require('../validators/schemas');
const validate = require('../middleware/validation');

// All routes require authentication
router.use(authenticate);

// Search for external user
router.get('/search', externalUserController.searchUser.bind(externalUserController));

// Create external user
router.post('/', externalUserController.createUser.bind(externalUserController));

// Get external users for an engagement
router.get('/engagement/:engagementId', validate(uuidParamSchema), externalUserController.getEngagementUsers.bind(externalUserController));

// Get engagements for an external user
router.get('/engagements', externalUserController.getUserEngagements.bind(externalUserController));

module.exports = router;

