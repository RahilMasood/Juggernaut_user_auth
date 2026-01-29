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

module.exports = router;

