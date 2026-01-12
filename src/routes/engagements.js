const express = require('express');
const router = express.Router();
const engagementController = require('../controllers/engagementController');
const { authenticate, requireUserType } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const validate = require('../middleware/validation');
const { 
  createEngagementSchema, 
  updateEngagementSchema, 
  addUserToEngagementSchema,
  uuidParamSchema,
  paginationSchema 
} = require('../validators/schemas');

// All engagement routes require authentication
router.use(authenticate);

// List engagements - accessible to all authenticated users
// Returns engagements where the user is a team member
router.get('/', validate(paginationSchema), engagementController.listEngagements.bind(engagementController));

// Get specific engagement
router.get('/:id', validate(uuidParamSchema), engagementController.getEngagement.bind(engagementController));

// Create engagement (policy check done in service)
router.post('/', validate(createEngagementSchema), engagementController.createEngagement.bind(engagementController));

// Update engagement
router.patch('/:id', validate(updateEngagementSchema), engagementController.updateEngagement.bind(engagementController));

// Get engagement team
router.get('/:id/users', validate(uuidParamSchema), engagementController.getEngagementTeam.bind(engagementController));

// Add user to engagement
router.post('/:id/users', validate(addUserToEngagementSchema), engagementController.addUser.bind(engagementController));

// Remove user from engagement
router.delete('/:id/users/:userId', engagementController.removeUser.bind(engagementController));

// Confirmation routes for specific engagement
const confirmationController = require('../controllers/confirmationController');
const { createConfirmationSchema } = require('../validators/schemas');

// List confirmations for engagement
router.get('/:id/confirmations', confirmationController.listEngagementConfirmations.bind(confirmationController));

// Create confirmation for engagement
router.post('/:id/confirmations', 
  validate(createConfirmationSchema),
  confirmationController.createConfirmation.bind(confirmationController)
);

module.exports = router;

