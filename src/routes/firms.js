const express = require('express');
const router = express.Router();
const firmController = require('../controllers/firmController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Get current user's firm details
router.get('/me', firmController.getMyFirm.bind(firmController));

module.exports = router;

