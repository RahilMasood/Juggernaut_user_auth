const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

// Webhook endpoints (no authentication - verified by signature)
router.post('/payroll-sync', webhookController.handlePayrollSync.bind(webhookController));

module.exports = router;

