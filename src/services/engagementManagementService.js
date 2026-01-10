const { Engagement, EngagementUser, AuditClient, User } = require('../models');
const { sequelize } = require('../config/database');
const logger = require('../utils/logger');

class EngagementManagementService {
  /**
   * Create new engagement for an audit client
   * Copies default users from previous engagement or assigns new ones
   */
  async createEngagement(auditClientId, firmId, engagementData) {
    const transaction = await sequelize.transaction();
    
    try {
      // Verify audit client exists and belongs to firm
      const auditClient = await AuditClient.findOne({
        where: { 
          id: auditClientId,
          firm_id: firmId
        }
      });

      if (!auditClient) {
        throw new Error('Audit client not found');
      }

      // Create engagement
      const engagement = await Engagement.create({
        audit_client_id: auditClientId,
        status: 'Active'
      }, { transaction });

      // If users are provided, assign them; otherwise copy from previous engagement
      if (engagementData.engagement_partner_id && engagementData.engagement_manager_id) {
        // Verify users exist and belong to the firm
        const engagementPartner = await User.findOne({
          where: { 
            id: engagementData.engagement_partner_id,
            firm_id: firmId
          }
        });

        const engagementManager = await User.findOne({
          where: { 
            id: engagementData.engagement_manager_id,
            firm_id: firmId
          }
        });

        if (!engagementPartner) {
          throw new Error('Engagement partner not found');
        }

        if (!engagementManager) {
          throw new Error('Engagement manager not found');
        }

        // Assign provided users
        await EngagementUser.bulkCreate([
          {
            engagement_id: engagement.id,
            user_id: engagementData.engagement_partner_id,
            role: 'engagement_partner'
          },
          {
            engagement_id: engagement.id,
            user_id: engagementData.engagement_manager_id,
            role: 'engagement_manager'
          }
        ], { transaction });
      } else {
        // Copy from most recent engagement for this client
        const previousEngagement = await Engagement.findOne({
          where: { audit_client_id: auditClientId },
          include: [
            {
              association: 'teamMembers',
              through: {
                where: {
                  role: ['engagement_partner', 'engagement_manager']
                }
              }
            }
          ],
          order: [['created_at', 'DESC']]
        });

        if (previousEngagement && previousEngagement.teamMembers && previousEngagement.teamMembers.length >= 2) {
          const engagementPartner = previousEngagement.teamMembers.find(
            u => u.EngagementUser && u.EngagementUser.role === 'engagement_partner'
          );
          const engagementManager = previousEngagement.teamMembers.find(
            u => u.EngagementUser && u.EngagementUser.role === 'engagement_manager'
          );

          if (engagementPartner && engagementManager) {
            await EngagementUser.bulkCreate([
              {
                engagement_id: engagement.id,
                user_id: engagementPartner.id,
                role: 'engagement_partner'
              },
              {
                engagement_id: engagement.id,
                user_id: engagementManager.id,
                role: 'engagement_manager'
              }
            ], { transaction });
          }
        }
      }

      await transaction.commit();

      // Reload with associations
      await engagement.reload({
        include: [
          {
            association: 'auditClient'
          },
          {
            association: 'teamMembers',
            attributes: ['id', 'user_name', 'email', 'type']
          }
        ]
      });

      return engagement;
    } catch (error) {
      await transaction.rollback();
      logger.error('Create engagement error:', error);
      throw error;
    }
  }

  /**
   * List engagements for an audit client
   */
  async listEngagements(auditClientId, firmId) {
    try {
      // Verify audit client belongs to firm
      const auditClient = await AuditClient.findOne({
        where: { 
          id: auditClientId,
          firm_id: firmId
        }
      });

      if (!auditClient) {
        throw new Error('Audit client not found');
      }

      const engagements = await Engagement.findAll({
        where: { audit_client_id: auditClientId },
        include: [
          {
            association: 'teamMembers',
            attributes: ['id', 'user_name', 'email', 'type'],
            through: {
              attributes: ['role']
            }
          }
        ],
        order: [['created_at', 'DESC']]
      });

      return engagements;
    } catch (error) {
      logger.error('List engagements error:', error);
      throw error;
    }
  }

  /**
   * Get engagement by ID
   */
  async getEngagementById(engagementId, firmId) {
    try {
      const engagement = await Engagement.findOne({
        where: { id: engagementId },
        include: [
          {
            association: 'auditClient',
            where: { firm_id: firmId }
          },
          {
            association: 'teamMembers',
            attributes: ['id', 'user_name', 'email', 'type'],
            through: {
              attributes: ['role', 'id']
            }
          }
        ]
      });

      if (!engagement) {
        throw new Error('Engagement not found');
      }

      return engagement;
    } catch (error) {
      logger.error('Get engagement error:', error);
      throw error;
    }
  }

  /**
   * Add user to engagement
   */
  async addUserToEngagement(engagementId, firmId, userId, role) {
    try {
      // Verify engagement exists and belongs to firm
      const engagement = await this.getEngagementById(engagementId, firmId);

      // Verify user exists and belongs to firm
      const user = await User.findOne({
        where: { 
          id: userId,
          firm_id: firmId
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Check if user is already assigned
      const existing = await EngagementUser.findOne({
        where: {
          engagement_id: engagementId,
          user_id: userId
        }
      });

      if (existing) {
        throw new Error('User is already assigned to this engagement');
      }

      // Add user
      const engagementUser = await EngagementUser.create({
        engagement_id: engagementId,
        user_id: userId,
        role: role
      });

      return engagementUser;
    } catch (error) {
      logger.error('Add user to engagement error:', error);
      throw error;
    }
  }

  /**
   * Remove user from engagement
   */
  async removeUserFromEngagement(engagementId, firmId, userId) {
    try {
      // Verify engagement exists and belongs to firm
      await this.getEngagementById(engagementId, firmId);

      // Find and remove user
      const engagementUser = await EngagementUser.findOne({
        where: {
          engagement_id: engagementId,
          user_id: userId
        }
      });

      if (!engagementUser) {
        throw new Error('User is not assigned to this engagement');
      }

      await engagementUser.destroy();
      return true;
    } catch (error) {
      logger.error('Remove user from engagement error:', error);
      throw error;
    }
  }
}

module.exports = new EngagementManagementService();

