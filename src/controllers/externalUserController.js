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
   * Add engagement to client's confirmation_client array
   * POST /api/v1/external-users/:email/add-engagement
   */
  async addEngagementToClient(req, res, next) {
    try {
      const { email } = req.params;
      const { engagement_id } = req.body;
      
      if (!email || !engagement_id) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email and engagement_id are required'
          }
        });
      }

      const user = await externalUserService.addEngagementToClient(email, engagement_id);

      // Don't return password_hash
      const { password_hash, ...userData } = user;
      
      res.json({
        success: true,
        data: {
          user: userData,
          message: 'Engagement added to client successfully'
        }
      });
    } catch (error) {
      logger.error('Error adding engagement to client:', error);
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
   * Add engagement to party's confirmation_party array
   * POST /api/v1/external-users/:email/add-engagement-party
   */
  async addEngagementToParty(req, res, next) {
    try {
      const { email } = req.params;
      const { engagement_id } = req.body;
      
      if (!email || !engagement_id) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email and engagement_id are required'
          }
        });
      }

      const user = await externalUserService.addEngagementToParty(email, engagement_id);

      // Don't return password_hash
      const { password_hash, ...userData } = user;
      
      res.json({
        success: true,
        data: {
          user: userData,
          message: 'Engagement added to party successfully'
        }
      });
    } catch (error) {
      logger.error('Error adding engagement to party:', error);
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
      const { email, name, designation, organization } = req.body;
      
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
        designation: designation || null,
        organization: organization || null
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

  /**
   * Update external user
   * PATCH /api/v1/external-users/:email
   */
  async updateUser(req, res, next) {
    try {
      const { email } = req.params;
      const { name, designation, organization } = req.body;
      
      if (!email) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email is required'
          }
        });
      }

      const user = await externalUserService.updateUser(email, {
        name,
        designation,
        organization
      });

      // Don't return password_hash
      const { password_hash, ...userData } = user;
      
      res.json({
        success: true,
        data: {
          user: userData,
          message: 'External user updated successfully'
        }
      });
    } catch (error) {
      logger.error('Error updating external user:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
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

