const express = require('express');
const router = express.Router();
const confirmationController = require('../controllers/confirmationController');
const { authenticate, requireUserType } = require('../middleware/auth');
const validate = require('../middleware/validation');
const { 
  createConfirmationSchema, 
  updateConfirmationSchema, 
  respondConfirmationSchema,
  uuidParamSchema 
} = require('../validators/schemas');

// All confirmation routes require authentication
router.use(authenticate);

// List my confirmations (for clients and confirming parties)
router.get('/my-confirmations', 
  requireUserType('CLIENT', 'CONFIRMING_PARTY'),
  confirmationController.listMyConfirmations.bind(confirmationController)
);

// Get specific confirmation (any authenticated user with access)
router.get('/:id', 
  validate(uuidParamSchema),
  confirmationController.getConfirmation.bind(confirmationController)
);

// Update confirmation (auditors only)
router.patch('/:id',
  requireUserType('AUDITOR'),
  validate(updateConfirmationSchema),
  confirmationController.updateConfirmation.bind(confirmationController)
);

// Respond to confirmation (clients and confirming parties only)
router.post('/:id/respond',
  requireUserType('CLIENT', 'CONFIRMING_PARTY'),
  validate(respondConfirmationSchema),
  confirmationController.respondToConfirmation.bind(confirmationController)
);

module.exports = router;

