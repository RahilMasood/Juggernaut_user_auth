const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { authenticate, requireUserType } = require('../middleware/auth');
const validate = require('../middleware/validation');
const { 
  createClientSchema, 
  updateClientSchema, 
  uuidParamSchema,
  paginationSchema 
} = require('../validators/schemas');

// All client routes require authentication
router.use(authenticate);

// Get my clients (where user is partner or manager) - no specific user type required
// This endpoint is accessible to all authenticated users
router.get('/my-clients', clientController.getMyClients.bind(clientController));

// Other routes require AUDITOR user type
router.use(requireUserType('AUDITOR'));

// List clients
router.get('/', validate(paginationSchema), clientController.listClients.bind(clientController));

// Get specific client
router.get('/:id', validate(uuidParamSchema), clientController.getClient.bind(clientController));

// Create client (requires permission to create engagements - Manager, Partner, etc.)
router.post('/', validate(createClientSchema), clientController.createClient.bind(clientController));

// Update client
router.patch('/:id', validate(updateClientSchema), clientController.updateClient.bind(clientController));

module.exports = router;

