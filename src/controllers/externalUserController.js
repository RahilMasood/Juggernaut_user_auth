const externalUserService = require('../services/externalUserService');
const logger = require('../utils/logger');

class ExternalUserController {
  /**
   * Search external user by email
   * GET /api/v1/external-users/search?email=xxx
   */
  async searchByEmail(req, res, next) {
    try {
      const { email } = req.query;
      
      if (!email) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email query parameter is required'
          }
        });
      }

      const user = await externalUserService.findByEmail(email);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'External user not found'
          }
        });
      }

      // Don't return password_hash
      const { password_hash, ...userData } = user;
      
      res.json({
        success: true,
        data: {
          user: userData
        }
      });
    } catch (error) {
      logger.error('Error searching external user:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * Create external user
   * POST /api/v1/external-users
   */
  async createUser(req, res, next) {
    try {
      const { email, name, designation } = req.body;
      
      if (!email || !name) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email and name are required'
          }
        });
      }

      const user = await externalUserService.createUser({
        email,
        name,
        designation: designation || ''
      });

      // Don't return password_hash
      const { password_hash, ...userData } = user;
      
      res.status(201).json({
        success: true,
        data: {
          user: userData,
          message: 'External user created successfully'
        }
      });
    } catch (error) {
      logger.error('Error creating external user:', error);
      
      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_ENTRY',
            message: error.message
          }
        });
      }
      
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message
        }
      });
    }
  }
}

module.exports = new ExternalUserController();

