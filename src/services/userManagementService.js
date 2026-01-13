const { User, Firm } = require('../models');
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
        payroll_id: userData.payroll_id || null
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
        payroll_id: updateData.payroll_id !== undefined ? updateData.payroll_id : user.payroll_id
      });

      await user.reload();
      return user;
    } catch (error) {
      logger.error('Update user error:', error);
      throw error;
    }
  }

  /**
   * Delete user
   */
  async deleteUser(userId, firmId) {
    try {
      const user = await this.getUserById(userId, firmId);
      await user.destroy();
      return true;
    } catch (error) {
      logger.error('Delete user error:', error);
      throw error;
    }
  }
}

module.exports = new UserManagementService();

