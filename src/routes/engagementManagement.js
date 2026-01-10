const express = require('express');
const router = express.Router();
const Joi = require('joi');
const engagementManagementController = require('../controllers/engagementManagementController');
const { authenticateAdmin } = require('../middleware/adminAuth');
const validate = require('../middleware/validation');
const { 
  adminCreateEngagementSchema, 
  adminAddUserToEngagementSchema,
  uuidParamSchema 
} = require('../validators/schemas');

// All routes require admin authentication
router.use(authenticateAdmin);

// Engagement Management (Page 3)
router.post('/clients/:clientId/engagements', validate(adminCreateEngagementSchema), engagementManagementController.createEngagement.bind(engagementManagementController));
router.get('/clients/:clientId/engagements', validate({
  params: Joi.object({
    clientId: Joi.string().uuid().required()
  })
}), engagementManagementController.listEngagements.bind(engagementManagementController));
router.get('/engagements/:id', validate(uuidParamSchema), engagementManagementController.getEngagement.bind(engagementManagementController));
router.post('/engagements/:id/users', validate(adminAddUserToEngagementSchema), engagementManagementController.addUser.bind(engagementManagementController));
router.delete('/engagements/:id/users/:userId', validate(uuidParamSchema), engagementManagementController.removeUser.bind(engagementManagementController));

module.exports = router;

