const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const userManagementController = require('../controllers/userManagementController');
const { authenticateAdmin } = require('../middleware/adminAuth');
const validate = require('../middleware/validation');
const { 
  adminLoginSchema, 
  adminCreateUserSchema, 
  adminUpdateUserSchema,
  uuidParamSchema 
} = require('../validators/schemas');

// Admin login (public)
router.post('/login', validate(adminLoginSchema), adminController.login.bind(adminController));

// All routes below require admin authentication
router.use(authenticateAdmin);

// Admin info
router.get('/me', adminController.getCurrentAdmin.bind(adminController));

// User Management (Page 1)
router.post('/users', validate(adminCreateUserSchema), userManagementController.createUser.bind(userManagementController));
router.get('/users', userManagementController.listUsers.bind(userManagementController));
router.get('/users/:id', validate(uuidParamSchema), userManagementController.getUser.bind(userManagementController));
router.patch('/users/:id', validate(adminUpdateUserSchema), userManagementController.updateUser.bind(userManagementController));
router.delete('/users/:id', validate(uuidParamSchema), userManagementController.deleteUser.bind(userManagementController));

module.exports = router;

