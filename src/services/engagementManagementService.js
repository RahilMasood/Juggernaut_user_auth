const { Engagement, AuditClient, EngagementUser, User } = require('../models');
const { sequelize } = require('../config/database');
const logger = require('../utils/logger');

class EngagementManagementService {
  /**
   * Create engagement for a client
   * @param {string} clientId - Audit client ID
   * @param {string} firmId - Firm ID
   * @param {object} engagementData - Engagement data (engagement_name, etc.)
   */
  async createEngagement(clientId, firmId, engagementData) {
    const transaction = await sequelize.transaction();
    
    try {
      // Verify audit client exists and belongs to firm
      const auditClient = await AuditClient.findOne({
        where: {
          id: clientId,
          firm_id: firmId
        }
      });

      if (!auditClient) {
        throw new Error('Audit client not found or does not belong to this firm');
      }

      // Check if client is Active
      if (auditClient.status !== 'Active') {
        throw new Error('Cannot create engagement for inactive client');
      }

      // Create engagement
      const engagement = await Engagement.create({
        audit_client_id: clientId,
        engagement_name: engagementData.engagementName,
        status: 'Active',
        is_default: false
      }, { transaction });

      // Get team members if provided
      let teamMembers = [];
      if (engagementData.teamMembers && Array.isArray(engagementData.teamMembers)) {
        // Add team members
        const engagementUsers = await EngagementUser.bulkCreate(
          engagementData.teamMembers.map(member => ({
            engagement_id: engagement.id,
            user_id: member.user_id,
            role: member.role || 'associate'
          })),
          { transaction }
        );
        teamMembers = engagementUsers;
      }

      await transaction.commit();

      // Return engagement with team members
      const result = await Engagement.findByPk(engagement.id, {
        include: [
          {
            model: User,
            as: 'teamMembers',
            attributes: ['id', 'user_name', 'email', 'type'],
            through: { attributes: ['role'] }
          }
        ]
      });

      logger.info(`Engagement ${engagement.id} created for client ${clientId}`);
      return result;
    } catch (error) {
      await transaction.rollback();
      logger.error('Error creating engagement:', error);
      throw error;
    }
  }

  /**
   * List engagements for a client
   * @param {string} clientId - Audit client ID
   * @param {string} firmId - Firm ID
   */
  async listEngagements(clientId, firmId) {
    try {
      // Verify audit client exists and belongs to firm
      const auditClient = await AuditClient.findOne({
        where: {
          id: clientId,
          firm_id: firmId
        }
      });

      if (!auditClient) {
        throw new Error('Audit client not found or does not belong to this firm');
      }

      const engagements = await Engagement.findAll({
        where: {
          audit_client_id: clientId
        },
        include: [
          {
            model: User,
            as: 'teamMembers',
            attributes: ['id', 'user_name', 'email', 'type'],
            through: { attributes: ['role'] }
          }
        ],
        order: [['created_at', 'DESC']]
      });

      return engagements;
    } catch (error) {
      logger.error('Error listing engagements:', error);
      throw error;
    }
  }

  /**
   * Get engagement by ID
   * @param {string} id - Engagement ID
   * @param {string} firmId - Firm ID
   */
  async getEngagementById(id, firmId) {
    try {
      const engagement = await Engagement.findByPk(id, {
        include: [
          {
            model: AuditClient,
            as: 'auditClient',
            attributes: ['id', 'client_name', 'status', 'firm_id'],
            where: { firm_id: firmId }
          },
          {
            model: User,
            as: 'teamMembers',
            attributes: ['id', 'user_name', 'email', 'type'],
            through: { attributes: ['role'] }
          }
        ]
      });

      if (!engagement || !engagement.auditClient) {
        throw new Error('Engagement not found or does not belong to this firm');
      }

      return engagement;
    } catch (error) {
      logger.error('Error getting engagement:', error);
      throw error;
    }
  }

  /**
   * Add user to engagement
   * @param {string} engagementId - Engagement ID
   * @param {string} firmId - Firm ID
   * @param {string} userId - User ID
   * @param {string} role - User role in engagement
   */
  async addUserToEngagement(engagementId, firmId, userId, role) {
    try {
      // Verify engagement belongs to firm
      const engagement = await Engagement.findByPk(engagementId, {
        include: [
          {
            model: AuditClient,
            as: 'auditClient',
            where: { firm_id: firmId }
          }
        ]
      });

      if (!engagement || !engagement.auditClient) {
        throw new Error('Engagement not found or does not belong to this firm');
      }

      // Verify user belongs to firm
      const user = await User.findOne({
        where: {
          id: userId,
          firm_id: firmId
        }
      });

      if (!user) {
        throw new Error('User not found or does not belong to this firm');
      }

      // Check if user is already in engagement
      const existing = await EngagementUser.findOne({
        where: {
          engagement_id: engagementId,
          user_id: userId
        }
      });

      if (existing) {
        throw new Error('User is already a member of this engagement');
      }

      // Add user to engagement
      const engagementUser = await EngagementUser.create({
        engagement_id: engagementId,
        user_id: userId,
        role: role || 'associate'
      });

      return engagementUser;
    } catch (error) {
      logger.error('Error adding user to engagement:', error);
      throw error;
    }
  }

  /**
   * Remove user from engagement
   * @param {string} engagementId - Engagement ID
   * @param {string} firmId - Firm ID
   * @param {string} userId - User ID
   */
  async removeUserFromEngagement(engagementId, firmId, userId) {
    try {
      // Verify engagement belongs to firm
      const engagement = await Engagement.findByPk(engagementId, {
        include: [
          {
            model: AuditClient,
            as: 'auditClient',
            where: { firm_id: firmId }
          }
        ]
      });

      if (!engagement || !engagement.auditClient) {
        throw new Error('Engagement not found or does not belong to this firm');
      }

      // Remove user from engagement
      const deleted = await EngagementUser.destroy({
        where: {
          engagement_id: engagementId,
          user_id: userId
        }
      });

      if (deleted === 0) {
        throw new Error('User is not a member of this engagement');
      }

      return true;
    } catch (error) {
      logger.error('Error removing user from engagement:', error);
      throw error;
    }
  }
}

module.exports = new EngagementManagementService();

