const { ExternalUser, Engagement } = require('../models');
const logger = require('../utils/logger');

class ExternalUserController {
  /**
   * Search for external user by email
   * GET /api/v1/external-users/search?email=xxx&engagementId=xxx
   */
  async searchUser(req, res, next) {
    try {
      const { email, engagementId } = req.query;

      if (!email || !engagementId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email and engagementId are required'
          }
        });
      }

      // Check if user exists for this engagement
      const externalUser = await ExternalUser.findOne({
        where: {
          email: email.toLowerCase(),
          engagement_id: engagementId
        }
      });

      if (externalUser) {
        return res.json({
          success: true,
          data: {
            exists: true,
            user: {
              id: externalUser.id,
              email: externalUser.email,
              name: externalUser.name,
              designation: externalUser.designation,
              confirmation_client: externalUser.confirmation_client,
              confirmation_party: externalUser.confirmation_party
            }
          }
        });
      }

      // Check if user exists in any engagement (to pre-fill name/designation)
      const anyUser = await ExternalUser.findOne({
        where: {
          email: email.toLowerCase()
        },
        order: [['created_at', 'DESC']]
      });

      res.json({
        success: true,
        data: {
          exists: false,
          user: anyUser ? {
            name: anyUser.name,
            designation: anyUser.designation
          } : null
        }
      });
    } catch (error) {
      logger.error('Error searching external user:', error);
      next(error);
    }
  }

  /**
   * Create external user
   * POST /api/v1/external-users
   */
  async createUser(req, res, next) {
    try {
      const { email, name, designation, engagementId, confirmationClient, confirmationParty } = req.body;

      if (!email || !name || !engagementId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email, name, and engagementId are required'
          }
        });
      }

      // Verify engagement exists
      const engagement = await Engagement.findByPk(engagementId);
      if (!engagement) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Engagement not found'
          }
        });
      }

      // Check if user already exists for this engagement
      const existingUser = await ExternalUser.findOne({
        where: {
          email: email.toLowerCase(),
          engagement_id: engagementId
        }
      });

      if (existingUser) {
        // Update existing user
        existingUser.name = name;
        existingUser.designation = designation || existingUser.designation;
        if (confirmationClient !== undefined) existingUser.confirmation_client = confirmationClient;
        if (confirmationParty !== undefined) existingUser.confirmation_party = confirmationParty;
        await existingUser.save();

        return res.json({
          success: true,
          data: {
            user: existingUser.toJSON()
          }
        });
      }

      // Create new user with default password
      const defaultPassword = 'Test@1234';
      const newUser = await ExternalUser.create({
        email: email.toLowerCase(),
        name,
        designation: designation || null,
        engagement_id: engagementId,
        confirmation_client: confirmationClient || false,
        confirmation_party: confirmationParty || false,
        password_hash: defaultPassword,
        is_active: true
      });

      res.status(201).json({
        success: true,
        data: {
          user: newUser.toJSON()
        }
      });
    } catch (error) {
      logger.error('Error creating external user:', error);
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_ENTRY',
            message: 'User already exists for this engagement'
          }
        });
      }
      next(error);
    }
  }

  /**
   * Get external users for an engagement
   * GET /api/v1/external-users/engagement/:engagementId
   */
  async getEngagementUsers(req, res, next) {
    try {
      const { engagementId } = req.params;
      const { type } = req.query; // 'client' or 'party'

      const where = { engagement_id: engagementId };
      if (type === 'client') {
        where.confirmation_client = true;
      } else if (type === 'party') {
        where.confirmation_party = true;
      }

      const users = await ExternalUser.findAll({
        where,
        order: [['created_at', 'DESC']]
      });

      res.json({
        success: true,
        data: users.map(u => u.toJSON())
      });
    } catch (error) {
      logger.error('Error getting external users:', error);
      next(error);
    }
  }

  /**
   * Get engagements for an external user (by email)
   * GET /api/v1/external-users/engagements?email=xxx
   */
  async getUserEngagements(req, res, next) {
    try {
      const { email } = req.query;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email is required'
          }
        });
      }

      const users = await ExternalUser.findAll({
        where: {
          email: email.toLowerCase()
        },
        include: [
          {
            model: Engagement,
            as: 'engagement',
            include: [
              {
                model: require('../models/AuditClient'),
                as: 'auditClient'
              }
            ]
          }
        ]
      });

      const engagements = users.map(u => ({
        engagement_id: u.engagement_id,
        engagement_name: u.engagement?.engagement_name,
        client_name: u.engagement?.auditClient?.client_name,
        period_end_date: u.engagement?.period_end_date,
        confirmation_client: u.confirmation_client,
        confirmation_party: u.confirmation_party
      }));

      res.json({
        success: true,
        data: engagements
      });
    } catch (error) {
      logger.error('Error getting user engagements:', error);
      next(error);
    }
  }
}

module.exports = new ExternalUserController();

