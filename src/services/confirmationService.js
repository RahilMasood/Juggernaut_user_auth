const { ConfirmationRequest, User, Engagement, Firm } = require('../models');
const userService = require('./userService');
const engagementService = require('./engagementService');
const emailService = require('./emailService');
const authService = require('./authService');
const { generatePassword } = require('../utils/passwordGenerator');
const logger = require('../utils/logger');

class ConfirmationService {
  /**
   * Create confirmation request
   */
  async createConfirmation(engagementId, confirmationData, createdBy) {
    try {
      // Verify engagement exists and user has access
      const engagement = await engagementService.getEngagement(engagementId, createdBy);

      if (!engagement) {
        throw new Error('Engagement not found or access denied');
      }

      const { party_type, party_email, party_name, confirmation_type, description, due_date } = confirmationData;

      // Check if party user already exists
      let partyUser = await User.findOne({
        where: { 
          email: party_email,
          firm_id: engagement.firm_id
        }
      });

      let temporaryPassword = null;
      let isNewUser = false;

      // Create party user if doesn't exist
      if (!partyUser) {
        temporaryPassword = generatePassword();
        
        const [firstName, ...lastNameParts] = party_name.split(' ');
        const lastName = lastNameParts.join(' ') || firstName;

        partyUser = await userService.createUser({
          firm_id: engagement.firm_id,
          email: party_email,
          password: temporaryPassword,
          first_name: firstName,
          last_name: lastName,
          user_type: party_type,
          must_change_password: true,
          is_active: true
        }, createdBy);

        isNewUser = true;
      }

      // Create confirmation request
      const confirmation = await ConfirmationRequest.create({
        engagement_id: engagementId,
        created_by: createdBy,
        party_user_id: partyUser.id,
        party_type,
        confirmation_type,
        description,
        due_date,
        status: 'PENDING'
      });

      // Send credentials email if new user
      if (isNewUser && temporaryPassword) {
        try {
          const firm = await Firm.findByPk(engagement.firm_id);
          const portalUrl = party_type === 'CLIENT' 
            ? process.env.CLIENT_PORTAL_URL 
            : process.env.CONFIRMING_PARTY_PORTAL_URL;

          await emailService.sendCredentialsEmail({
            email: party_email,
            name: party_name,
            temporaryPassword,
            engagementName: engagement.name,
            firmName: firm.name,
            portalUrl
          });

          logger.info('Credentials email sent to new party user:', { email: party_email });
        } catch (emailError) {
          logger.error('Failed to send credentials email:', emailError);
          // Don't fail the entire operation if email fails
        }
      }

      // Log confirmation creation
      await authService.logAuditEvent(
        createdBy,
        engagement.firm_id,
        'CREATE_CONFIRMATION',
        'CONFIRMATION',
        confirmation.id,
        { 
          party_email, 
          party_type, 
          confirmation_type,
          is_new_user: isNewUser
        },
        null,
        null,
        'SUCCESS'
      );

      return {
        confirmation,
        isNewUser,
        credentialsSent: isNewUser
      };
    } catch (error) {
      logger.error('Create confirmation error:', error);
      throw error;
    }
  }

  /**
   * Get confirmation by ID
   */
  async getConfirmation(confirmationId, userId) {
    try {
      const confirmation = await ConfirmationRequest.findByPk(confirmationId, {
        include: [
          {
            association: 'engagement',
            include: ['firm']
          },
          {
            association: 'creator',
            attributes: ['id', 'email', 'first_name', 'last_name']
          },
          {
            association: 'partyUser',
            attributes: ['id', 'email', 'first_name', 'last_name', 'user_type']
          }
        ]
      });

      if (!confirmation) {
        throw new Error('Confirmation request not found');
      }

      // Check access: user must be engagement member, creator, or the party user
      const isEngagementMember = await engagementService.checkUserAccess(
        confirmation.engagement_id, 
        userId
      );
      const isPartyUser = confirmation.party_user_id === userId;

      if (!isEngagementMember && !isPartyUser) {
        throw new Error('Access denied to this confirmation request');
      }

      return confirmation;
    } catch (error) {
      logger.error('Get confirmation error:', error);
      throw error;
    }
  }

  /**
   * List confirmations for engagement
   */
  async listConfirmationsForEngagement(engagementId, userId, filters = {}) {
    try {
      // Check if user has access to engagement
      const hasAccess = await engagementService.checkUserAccess(engagementId, userId);
      
      if (!hasAccess) {
        throw new Error('Access denied to this engagement');
      }

      const where = {
        engagement_id: engagementId
      };

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.party_type) {
        where.party_type = filters.party_type;
      }

      const confirmations = await ConfirmationRequest.findAll({
        where,
        include: [
          {
            association: 'partyUser',
            attributes: ['id', 'email', 'first_name', 'last_name', 'user_type']
          },
          {
            association: 'creator',
            attributes: ['id', 'first_name', 'last_name']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      return confirmations;
    } catch (error) {
      logger.error('List confirmations error:', error);
      throw error;
    }
  }

  /**
   * List confirmations for party user (client/confirming party)
   */
  async listConfirmationsForParty(userId) {
    try {
      const confirmations = await ConfirmationRequest.findAll({
        where: {
          party_user_id: userId
        },
        include: [
          {
            association: 'engagement',
            attributes: ['id', 'name', 'client_name'],
            include: [{
              association: 'firm',
              attributes: ['id', 'name']
            }]
          },
          {
            association: 'creator',
            attributes: ['id', 'first_name', 'last_name', 'email']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      return confirmations;
    } catch (error) {
      logger.error('List party confirmations error:', error);
      throw error;
    }
  }

  /**
   * Update confirmation (auditor)
   */
  async updateConfirmation(confirmationId, updateData, updatedBy) {
    try {
      const confirmation = await ConfirmationRequest.findByPk(confirmationId);

      if (!confirmation) {
        throw new Error('Confirmation request not found');
      }

      // Check if user has access to engagement
      const hasAccess = await engagementService.checkUserAccess(
        confirmation.engagement_id, 
        updatedBy
      );
      
      if (!hasAccess) {
        throw new Error('Access denied to this confirmation request');
      }

      // Update allowed fields
      const allowedFields = ['status', 'notes', 'due_date', 'description'];
      
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          confirmation[field] = updateData[field];
        }
      }

      await confirmation.save();

      // Log update
      const engagement = await Engagement.findByPk(confirmation.engagement_id);
      await authService.logAuditEvent(
        updatedBy,
        engagement.firm_id,
        'UPDATE_CONFIRMATION',
        'CONFIRMATION',
        confirmation.id,
        updateData,
        null,
        null,
        'SUCCESS'
      );

      return confirmation;
    } catch (error) {
      logger.error('Update confirmation error:', error);
      throw error;
    }
  }

  /**
   * Respond to confirmation (client/confirming party)
   */
  async respondToConfirmation(confirmationId, responseData, respondedBy) {
    try {
      const confirmation = await ConfirmationRequest.findByPk(confirmationId);

      if (!confirmation) {
        throw new Error('Confirmation request not found');
      }

      // Check if user is the party user
      if (confirmation.party_user_id !== respondedBy) {
        throw new Error('Only the assigned party can respond to this confirmation');
      }

      // Check if already responded
      if (confirmation.status === 'RESPONDED' || confirmation.status === 'COMPLETED') {
        throw new Error('This confirmation has already been responded to');
      }

      // Update confirmation with response
      confirmation.response = responseData.response;
      confirmation.response_date = new Date();
      confirmation.status = 'RESPONDED';

      if (responseData.attachments) {
        confirmation.attachments = responseData.attachments;
      }

      await confirmation.save();

      // Log response
      const engagement = await Engagement.findByPk(confirmation.engagement_id);
      await authService.logAuditEvent(
        respondedBy,
        engagement.firm_id,
        'RESPOND_CONFIRMATION',
        'CONFIRMATION',
        confirmation.id,
        { has_attachments: !!responseData.attachments },
        null,
        null,
        'SUCCESS'
      );

      return confirmation;
    } catch (error) {
      logger.error('Respond to confirmation error:', error);
      throw error;
    }
  }
}

module.exports = new ConfirmationService();

