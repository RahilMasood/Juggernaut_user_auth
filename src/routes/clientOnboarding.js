const express = require('express');
const router = express.Router();
const clientOnboardingController = require('../controllers/clientOnboardingController');
const { authenticateAdmin } = require('../middleware/adminAuth');
const { authenticate, requireUserType } = require('../middleware/auth');
const validate = require('../middleware/validation');
const { createAuditClientSchema, uuidParamSchema } = require('../validators/schemas');

// Admin routes (for admin portal)
router.post('/clients', authenticateAdmin, validate(createAuditClientSchema), clientOnboardingController.createClient.bind(clientOnboardingController));
router.get('/clients', authenticateAdmin, clientOnboardingController.listClients.bind(clientOnboardingController));
router.get('/clients/:id', authenticateAdmin, validate(uuidParamSchema), clientOnboardingController.getClient.bind(clientOnboardingController));

// Regular user routes (for client onboarding portal - partner/manager only)
// These routes allow authenticated users (partner/manager) to create clients
router.post('/user/clients', authenticate, requireUserType('partner', 'manager'), validate(createAuditClientSchema), clientOnboardingController.createClient.bind(clientOnboardingController));
router.get('/user/clients', authenticate, requireUserType('partner', 'manager'), clientOnboardingController.listClients.bind(clientOnboardingController));
router.get('/user/clients/:id', authenticate, requireUserType('partner', 'manager'), validate(uuidParamSchema), clientOnboardingController.getClient.bind(clientOnboardingController));

module.exports = router;

