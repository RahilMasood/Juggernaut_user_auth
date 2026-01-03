const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, requireUserType } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const validate = require('../middleware/validation');
const { createUserSchema, updateUserSchema, uuidParamSchema, paginationSchema } = require('../validators/schemas');

// All user routes require authentication
router.use(authenticate);

// List users (any authenticated user from same firm)
router.get('/', validate(paginationSchema), userController.listUsers.bind(userController));

// Get specific user
router.get('/:id', validate(uuidParamSchema), userController.getUser.bind(userController));

// Get user permissions
router.get('/:id/permissions', validate(uuidParamSchema), userController.getUserPermissions.bind(userController));

// Create user (requires manage_users permission)
router.post('/', 
  requirePermission('manage_users'),
  validate(createUserSchema),
  userController.createUser.bind(userController)
);

// Update user (requires manage_users permission)
router.patch('/:id',
  requirePermission('manage_users'),
  validate(updateUserSchema),
  userController.updateUser.bind(userController)
);

// Deactivate user (requires manage_users permission)
router.delete('/:id',
  requirePermission('manage_users'),
  validate(uuidParamSchema),
  userController.deactivateUser.bind(userController)
);

module.exports = router;

