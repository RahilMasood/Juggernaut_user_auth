const express = require('express');
const router = express.Router();
const clientOnboardingController = require('../controllers/clientOnboardingController');
const { authenticateAdmin } = require('../middleware/adminAuth');
const validate = require('../middleware/validation');
const { createAuditClientSchema, uuidParamSchema } = require('../validators/schemas');

// All routes require admin authentication
router.use(authenticateAdmin);

// Client Onboarding (Page 2)
router.post('/clients', validate(createAuditClientSchema), clientOnboardingController.createClient.bind(clientOnboardingController));
router.get('/clients', clientOnboardingController.listClients.bind(clientOnboardingController));
router.get('/clients/:id', validate(uuidParamSchema), clientOnboardingController.getClient.bind(clientOnboardingController));

module.exports = router;

