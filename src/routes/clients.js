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

// All client routes require authentication and AUDITOR user type
router.use(authenticate);
router.use(requireUserType('AUDITOR'));

// List clients
router.get('/', validate(paginationSchema), clientController.listClients.bind(clientController));

// Get my clients (where user is partner or manager)
router.get('/my-clients', clientController.getMyClients.bind(clientController));

// Get specific client
router.get('/:id', validate(uuidParamSchema), clientController.getClient.bind(clientController));

// Create client (requires permission to create engagements - Manager, Partner, etc.)
router.post('/', validate(createClientSchema), clientController.createClient.bind(clientController));

// Update client
router.patch('/:id', validate(updateClientSchema), clientController.updateClient.bind(clientController));

module.exports = router;

