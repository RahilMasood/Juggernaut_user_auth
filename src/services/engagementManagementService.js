const { Engagement, EngagementUser, AuditClient, User } = require('../models');
const { sequelize } = require('../config/database');
const logger = require('../utils/logger');

class EngagementManagementService {
  /**
   * Create new engagement for an audit client
   * If default engagement exists, replaces it; otherwise creates new engagement
   * Always auto-assigns partner and manager from default/first engagement
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

      // Check if there's a default engagement (created during client onboarding)
      const defaultEngagement = await Engagement.findOne({
        where: { 
          audit_client_id: auditClientId,
          is_default: true
        },
        include: [
          {
            association: 'teamMembers',
            through: {
              where: {
                role: ['engagement_partner', 'engagement_manager']
              }
            }
          }
        ]
      });

      let engagement;
      let engagementPartnerId;
      let engagementManagerId;

      if (defaultEngagement) {
        // This is the first real engagement - replace the default engagement
        // Update the default engagement to remove the default flag
        await defaultEngagement.update({
          is_default: false
        }, { transaction });

        engagement = defaultEngagement;

        // Get partner and manager from default engagement
        const engagementPartner = defaultEngagement.teamMembers.find(
          u => u.EngagementUser && u.EngagementUser.role === 'engagement_partner'
        );
        const engagementManager = defaultEngagement.teamMembers.find(
          u => u.EngagementUser && u.EngagementUser.role === 'engagement_manager'
        );

        if (!engagementPartner || !engagementManager) {
          throw new Error('Default engagement missing partner or manager');
        }

        engagementPartnerId = engagementPartner.id;
        engagementManagerId = engagementManager.id;
      } else {
        // Create new engagement (not the first one)
        engagement = await Engagement.create({
          audit_client_id: auditClientId,
          status: 'Active',
          is_default: false
        }, { transaction });

        // Get partner and manager from the first engagement (or any previous engagement)
        const firstEngagement = await Engagement.findOne({
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
          order: [['created_at', 'ASC']]
        });

        if (!firstEngagement || !firstEngagement.teamMembers || firstEngagement.teamMembers.length < 2) {
          throw new Error('No previous engagement found with partner and manager assigned');
        }

        const engagementPartner = firstEngagement.teamMembers.find(
          u => u.EngagementUser && u.EngagementUser.role === 'engagement_partner'
        );
        const engagementManager = firstEngagement.teamMembers.find(
          u => u.EngagementUser && u.EngagementUser.role === 'engagement_manager'
        );

        if (!engagementPartner || !engagementManager) {
          throw new Error('Previous engagement missing partner or manager');
        }

        engagementPartnerId = engagementPartner.id;
        engagementManagerId = engagementManager.id;
      }

      // Auto-assign partner and manager to engagement (if not already assigned)
      // Check if they're already assigned (for default engagement case)
      const existingPartner = await EngagementUser.findOne({
        where: {
          engagement_id: engagement.id,
          user_id: engagementPartnerId,
          role: 'engagement_partner'
        },
        transaction
      });

      const existingManager = await EngagementUser.findOne({
        where: {
          engagement_id: engagement.id,
          user_id: engagementManagerId,
          role: 'engagement_manager'
        },
        transaction
      });

      if (!existingPartner) {
        await EngagementUser.create({
          engagement_id: engagement.id,
          user_id: engagementPartnerId,
          role: 'engagement_partner'
        }, { transaction });
      }

      if (!existingManager) {
        await EngagementUser.create({
          engagement_id: engagement.id,
          user_id: engagementManagerId,
          role: 'engagement_manager'
        }, { transaction });
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
   * Excludes default engagements (placeholders created during client onboarding)
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
        where: { 
          audit_client_id: auditClientId,
          is_default: false // Exclude default placeholder engagements
        },
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

