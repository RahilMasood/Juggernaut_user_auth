const express = require('express');
const router = express.Router();
const independenceController = require('../controllers/independenceController');
const { authenticate, requireUserType } = require('../middleware/auth');
const validate = require('../middleware/validation');
const { 
  addUserForDeclarationSchema,
  submitDeclarationSchema,
  reviewDeclarationSchema,
  uuidParamSchema 
} = require('../validators/schemas');

// All independence routes require authentication and AUDITOR user type
router.use(authenticate);
router.use(requireUserType('AUDITOR'));

// Get my declarations (for users)
router.get('/my-declarations', independenceController.listMyDeclarations.bind(independenceController));

// Get my engagements (where user is partner or manager)
router.get('/my-engagements', independenceController.getMyEngagements.bind(independenceController));

// Get specific declaration
router.get('/:id', validate(uuidParamSchema), independenceController.getDeclaration.bind(independenceController));

// Submit independence declaration
router.post('/:id/submit', validate(submitDeclarationSchema), independenceController.submitDeclaration.bind(independenceController));

// Review declaration (for partners/managers)
router.patch('/:id/review', validate(reviewDeclarationSchema), independenceController.reviewDeclaration.bind(independenceController));

// Add user to declare independence for an engagement
router.post('/engagements/:engagementId/add-user', validate(addUserForDeclarationSchema), independenceController.addUserForDeclaration.bind(independenceController));

// List declarations for an engagement (for partners/managers)
router.get('/engagements/:engagementId/declarations', independenceController.listEngagementDeclarations.bind(independenceController));

module.exports = router;

