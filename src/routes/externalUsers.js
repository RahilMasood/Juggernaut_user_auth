const express = require('express');
const router = express.Router();
const externalUserController = require('../controllers/externalUserController');

/**
 * @route   GET /api/v1/external-users/search
 * @desc    Search external user by email
 * @access  Public (or add auth middleware if needed)
 */
router.get('/search', externalUserController.searchByEmail.bind(externalUserController));

/**
 * @route   POST /api/v1/external-users
 * @desc    Create external user
 * @access  Public (or add auth middleware if needed)
 */
router.post('/', externalUserController.createUser.bind(externalUserController));

/**
 * @route   POST /api/v1/external-users/:email/add-engagement
 * @desc    Add engagement_id to client's confirmation_client array
 * @access  Public (or add auth middleware if needed)
 */
router.post('/:email/add-engagement', externalUserController.addEngagementToClient.bind(externalUserController));

/**
 * @route   POST /api/v1/external-users/:email/add-engagement-party
 * @desc    Add engagement_id to party's confirmation_party array
 * @access  Public (or add auth middleware if needed)
 */
router.post('/:email/add-engagement-party', externalUserController.addEngagementToParty.bind(externalUserController));

/**
 * @route   PATCH /api/v1/external-users/:email
 * @desc    Update external user
 * @access  Public (or add auth middleware if needed)
 */
router.patch('/:email', externalUserController.updateUser.bind(externalUserController));

module.exports = router;

