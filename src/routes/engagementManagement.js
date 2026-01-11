const express = require('express');
const router = express.Router();
const Joi = require('joi');
const engagementManagementController = require('../controllers/engagementManagementController');
const { authenticateAdmin } = require('../middleware/adminAuth');
const validate = require('../middleware/validation');
const { 
  adminAddUserToEngagementSchema,
  uuidParamSchema 
} = require('../validators/schemas');

// All routes require admin authentication
// NOTE: POST /clients/:clientId/engagements is handled in engagementsPublic.js
router.use(authenticateAdmin);
router.get('/clients/:clientId/engagements', validate({
  params: Joi.object({
    clientId: Joi.string().uuid().required()
  })
}), engagementManagementController.listEngagements.bind(engagementManagementController));
router.get('/engagements/:id', authenticateAdmin, validate(uuidParamSchema), engagementManagementController.getEngagement.bind(engagementManagementController));
router.post('/engagements/:id/users', authenticateAdmin, validate(adminAddUserToEngagementSchema), engagementManagementController.addUser.bind(engagementManagementController));
router.delete('/engagements/:id/users/:userId', authenticateAdmin, validate(uuidParamSchema), engagementManagementController.removeUser.bind(engagementManagementController));

module.exports = router;

