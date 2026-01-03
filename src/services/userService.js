const { User, Firm, AuditLog } = require('../models');
const { generatePassword } = require('../utils/passwordGenerator');
const authService = require('./authService');
const emailService = require('./emailService');
const logger = require('../utils/logger');

class UserService {
  /**
   * Create a new user
   */
  async createUser(userData, createdBy = null) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({
        where: { email: userData.email }
      });

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Verify firm exists
      const firm = await Firm.findByPk(userData.firm_id);
      if (!firm) {
        throw new Error('Firm not found');
      }

      // Generate password if not provided
      let temporaryPassword = null;
      let isNewPassword = false;
      
      if (!userData.password) {
        temporaryPassword = generatePassword();
        userData.password = temporaryPassword;
        userData.must_change_password = true;
        isNewPassword = true;
      }

      // Create user
      const user = await User.create({
        firm_id: userData.firm_id,
        email: userData.email,
        password_hash: userData.password,
        first_name: userData.first_name,
        last_name: userData.last_name,
        user_type: userData.user_type || 'AUDITOR',
        designation: userData.designation,
        payroll_id: userData.payroll_id,
        is_active: userData.is_active !== undefined ? userData.is_active : true,
        must_change_password: userData.must_change_password || false
      });

      // Send credentials email if password was generated
      if (isNewPassword && temporaryPassword) {
        try {
          // Determine portal URL based on user type
          let portalUrl;
          if (user.user_type === 'CLIENT') {
            portalUrl = process.env.CLIENT_PORTAL_URL || process.env.PORTAL_URL || 'http://localhost:3000';
          } else if (user.user_type === 'CONFIRMING_PARTY') {
            portalUrl = process.env.CONFIRMING_PARTY_PORTAL_URL || process.env.PORTAL_URL || 'http://localhost:3000';
          } else {
            // AUDITOR or other types
            portalUrl = process.env.AUDITOR_PORTAL_URL || process.env.PORTAL_URL || 'http://localhost:3000';
          }

          await emailService.sendCredentialsEmail({
            email: user.email,
            name: `${user.first_name} ${user.last_name}`,
            temporaryPassword,
            engagementName: 'N/A', // Not engagement-specific
            firmName: firm.name,
            portalUrl
          });

          logger.info('Credentials email sent to new user:', { email: user.email });
        } catch (emailError) {
          logger.error('Failed to send credentials email:', emailError);
          // Don't fail the entire operation if email fails
        }
      }

      // Log user creation
      if (createdBy) {
        await authService.logAuditEvent(
          createdBy,
          firm.id,
          'CREATE_USER',
          'USER',
          user.id,
          { email: user.email, user_type: user.user_type, credentials_sent: isNewPassword },
          null,
          null,
          'SUCCESS'
        );
      }

      return {
        user,
        temporaryPassword: isNewPassword ? temporaryPassword : undefined,
        credentialsSent: isNewPassword
      };
    } catch (error) {
      logger.error('Create user error:', error);
      throw error;
    }
  }

  /**
   * Update user
   */
  async updateUser(userId, updateData, updatedBy = null) {
    try {
      const user = await User.findByPk(userId);

      if (!user) {
        throw new Error('User not found');
      }

      // Update allowed fields
      const allowedFields = ['first_name', 'last_name', 'designation', 'is_active'];
      
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          user[field] = updateData[field];
        }
      }

      await user.save();

      // Log user update
      if (updatedBy) {
        await authService.logAuditEvent(
          updatedBy,
          user.firm_id,
          'UPDATE_USER',
          'USER',
          user.id,
          updateData,
          null,
          null,
          'SUCCESS'
        );
      }

      return user;
    } catch (error) {
      logger.error('Update user error:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId) {
    try {
      const user = await User.findByPk(userId, {
        include: [
          { association: 'firm' },
          { association: 'roles', include: ['permissions'] },
          { association: 'customPermissions' }
        ]
      });

      return user;
    } catch (error) {
      logger.error('Get user error:', error);
      throw error;
    }
  }

  /**
   * List users with filtering and pagination
   */
  async listUsers(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 20, sort_by = 'created_at', sort_order = 'DESC' } = pagination;
      const offset = (page - 1) * limit;

      const where = {};
      
      if (filters.firm_id) {
        where.firm_id = filters.firm_id;
      }
      
      if (filters.user_type) {
        where.user_type = filters.user_type;
      }
      
      if (filters.is_active !== undefined) {
        where.is_active = filters.is_active;
      }

      if (filters.search) {
        const { Op } = require('sequelize');
        where[Op.or] = [
          { first_name: { [Op.iLike]: `%${filters.search}%` } },
          { last_name: { [Op.iLike]: `%${filters.search}%` } },
          { email: { [Op.iLike]: `%${filters.search}%` } }
        ];
      }

      const { rows: users, count: total } = await User.findAndCountAll({
        where,
        include: [
          { association: 'firm', attributes: ['id', 'name'] },
          { association: 'roles', attributes: ['id', 'name'] }
        ],
        limit,
        offset,
        order: [[sort_by, sort_order]],
        distinct: true
      });

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('List users error:', error);
      throw error;
    }
  }

  /**
   * Sync users from payroll system (webhook handler)
   */
  async syncUsersFromPayroll(payrollData, firmDomain) {
    try {
      // Find firm by domain
      const firm = await Firm.findOne({ where: { domain: firmDomain } });
      
      if (!firm) {
        throw new Error(`Firm not found for domain: ${firmDomain}`);
      }

      const results = {
        created: [],
        updated: [],
        errors: []
      };

      // Process each user from payroll
      for (const payrollUser of payrollData.users) {
        try {
          // Check if user exists by payroll_id or email
          let user = await User.findOne({
            where: {
              firm_id: firm.id,
              payroll_id: payrollUser.payroll_id
            }
          });

          if (user) {
            // Update existing user
            user.email = payrollUser.email;
            user.first_name = payrollUser.first_name;
            user.last_name = payrollUser.last_name;
            user.designation = payrollUser.designation;
            user.is_active = payrollUser.is_active !== undefined ? payrollUser.is_active : true;
            await user.save();
            
            results.updated.push(user.id);
          } else {
            // Create new user
            const tempPassword = generatePassword();
            
            user = await User.create({
              firm_id: firm.id,
              email: payrollUser.email,
              password_hash: tempPassword,
              first_name: payrollUser.first_name,
              last_name: payrollUser.last_name,
              user_type: 'AUDITOR',
              designation: payrollUser.designation,
              payroll_id: payrollUser.payroll_id,
              is_active: payrollUser.is_active !== undefined ? payrollUser.is_active : true,
              must_change_password: true
            });
            
            results.created.push(user.id);
          }
        } catch (userError) {
          logger.error('Error processing payroll user:', userError);
          results.errors.push({
            payroll_id: payrollUser.payroll_id,
            error: userError.message
          });
        }
      }

      // Log sync event
      await authService.logAuditEvent(
        null,
        firm.id,
        'PAYROLL_SYNC',
        'USER',
        null,
        {
          created: results.created.length,
          updated: results.updated.length,
          errors: results.errors.length
        },
        null,
        null,
        results.errors.length === 0 ? 'SUCCESS' : 'FAILURE'
      );

      return results;
    } catch (error) {
      logger.error('Payroll sync error:', error);
      throw error;
    }
  }

  /**
   * Deactivate user
   */
  async deactivateUser(userId, deactivatedBy = null) {
    try {
      const user = await User.findByPk(userId);

      if (!user) {
        throw new Error('User not found');
      }

      user.is_active = false;
      await user.save();

      // Revoke all refresh tokens
      const { RefreshToken } = require('../models');
      await RefreshToken.update(
        { is_revoked: true, revoked_at: new Date() },
        { where: { user_id: userId, is_revoked: false } }
      );

      // Log deactivation
      if (deactivatedBy) {
        await authService.logAuditEvent(
          deactivatedBy,
          user.firm_id,
          'DEACTIVATE_USER',
          'USER',
          user.id,
          {},
          null,
          null,
          'SUCCESS'
        );
      }

      return user;
    } catch (error) {
      logger.error('Deactivate user error:', error);
      throw error;
    }
  }
}

module.exports = new UserService();

