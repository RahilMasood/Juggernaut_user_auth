const { User, Firm, RefreshToken, EngagementUser, AuditLog } = require('../models');
const logger = require('../utils/logger');

class UserManagementService {
  /**
   * Create a new user
   */
  async createUser(firmId, userData) {
    try {
      // Verify firm exists
      const firm = await Firm.findByPk(firmId);
      if (!firm) {
        throw new Error('Firm not found');
      }

      // Check user limit (if no_users > 0, enforce limit; if 0, unlimited)
      if (firm.no_users > 0) {
        const currentUserCount = await User.count({
          where: { firm_id: firmId }
        });

        if (currentUserCount >= firm.no_users) {
          throw new Error(`User limit reached. Maximum ${firm.no_users} users allowed for this firm.`);
        }
      }

      // Check if email already exists
      const existingUser = await User.findOne({
        where: { email: userData.email }
      });

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Create user
      const user = await User.create({
        firm_id: firmId,
        user_name: userData.user_name,
        email: userData.email,
        password_hash: userData.password,
        type: userData.type,
        payroll_id: userData.payroll_id || null,
        allowed_tools: userData.allowed_tools || null // Array of tool names user can access
      });

      return user;
    } catch (error) {
      logger.error('Create user error:', error);
      throw error;
    }
  }

  /**
   * Get all users for a firm
   */
  async listUsers(firmId) {
    try {
      const users = await User.findAll({
        where: { firm_id: firmId },
        order: [['created_at', 'DESC']]
      });

      return users;
    } catch (error) {
      logger.error('List users error:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId, firmId) {
    try {
      const user = await User.findOne({
        where: { 
          id: userId,
          firm_id: firmId
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      logger.error('Get user error:', error);
      throw error;
    }
  }

  /**
   * Update user
   */
  async updateUser(userId, firmId, updateData) {
    try {
      const user = await this.getUserById(userId, firmId);

      // If email is being updated, check for duplicates
      if (updateData.email && updateData.email !== user.email) {
        const existingUser = await User.findOne({
          where: { email: updateData.email }
        });

        if (existingUser) {
          throw new Error('User with this email already exists');
        }
      }

      // Update user
      await user.update({
        user_name: updateData.user_name || user.user_name,
        email: updateData.email || user.email,
        password_hash: updateData.password || user.password_hash,
        type: updateData.type || user.type,
        payroll_id: updateData.payroll_id !== undefined ? updateData.payroll_id : user.payroll_id,
        allowed_tools: updateData.allowed_tools !== undefined ? updateData.allowed_tools : user.allowed_tools
      });

      await user.reload();
      return user;
    } catch (error) {
      logger.error('Update user error:', error);
      throw error;
    }
  }

  /**
   * Delete user and remove from all related tables
   */
  async deleteUser(userId, firmId) {
    try {
      const user = await this.getUserById(userId, firmId);
      
      // Delete all related data before deleting the user
      // 1. Delete all refresh tokens for this user
      await RefreshToken.destroy({
        where: { user_id: userId }
      });
      logger.info(`Deleted refresh tokens for user ${userId}`);

      // 2. Remove user from all engagements (engagement_users table)
      // Note: This should cascade automatically, but we'll do it explicitly
      await EngagementUser.destroy({
        where: { user_id: userId }
      });
      logger.info(`Removed user ${userId} from all engagements`);

      // 3. Delete independence declarations for this user
      const IndependenceDeclaration = require('../models/IndependenceDeclaration');
      await IndependenceDeclaration.destroy({
        where: { user_id: userId }
      });
      logger.info(`Deleted independence declarations for user ${userId}`);

      // 4. Delete confirmation requests where user is the party (party_user_id)
      const ConfirmationRequest = require('../models/ConfirmationRequest');
      await ConfirmationRequest.destroy({
        where: { party_user_id: userId }
      });
      logger.info(`Deleted confirmation requests for user ${userId}`);

      // 5. Handle Client model references (clients table)
      try {
        const { Op } = require('sequelize');
        const Client = require('../models/Client');
        
        // Set optional fields to NULL
        await Client.update(
          {
            eqr_partner_id: null,
            concurrent_review_partner_id: null
          },
          {
            where: {
              [Op.or]: [
                { eqr_partner_id: userId },
                { concurrent_review_partner_id: userId }
              ]
            }
          }
        );
        
        // Check if user is assigned to clients with required fields
        // These will cause foreign key constraint errors if we try to delete the user
        const clientsAsPartner = await Client.count({
          where: { engagement_partner_id: userId }
        });
        const clientsAsManager = await Client.count({
          where: { engagement_manager_id: userId }
        });
        const clientsAsCreator = await Client.count({
          where: { created_by: userId }
        });
        
        if (clientsAsPartner > 0 || clientsAsManager > 0 || clientsAsCreator > 0) {
          const totalClients = clientsAsPartner + clientsAsManager + clientsAsCreator;
          logger.warn(`User ${userId} is assigned to ${totalClients} client(s) as required field (partner: ${clientsAsPartner}, manager: ${clientsAsManager}, creator: ${clientsAsCreator}).`);
          // Note: Database foreign key constraints may prevent deletion
          // The deletion will proceed and database will enforce constraints
        }
        
        logger.info(`Updated client assignments for user ${userId}`);
      } catch (err) {
        // Client model might not exist or have different structure, skip
        logger.debug(`Skipping client update: ${err.message}`);
      }

      // 6. Set user_id to NULL in audit logs (keep audit trail but remove user reference)
      // This preserves audit history while removing the user reference
      await AuditLog.update(
        { user_id: null },
        { where: { user_id: userId } }
      );
      logger.info(`Updated audit logs for user ${userId}`);

      // 6. Finally, delete the user
      await user.destroy();
      logger.info(`User ${userId} deleted successfully`);
      
      return true;
    } catch (error) {
      logger.error('Delete user error:', error);
      throw error;
    }
  }
}

module.exports = new UserManagementService();

