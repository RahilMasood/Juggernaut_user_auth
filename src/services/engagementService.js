const { Engagement, User, AuditClient, EngagementUser } = require('../models');
const policyService = require('./policyService');
const authService = require('./authService');
const logger = require('../utils/logger');

class EngagementService {
  /**
   * Create new engagement
   */
  async createEngagement(engagementData, createdBy) {
    try {
      // Check if user has permission to create engagement
      const canCreate = await policyService.canCreateEngagement(createdBy);
      
      if (!canCreate) {
        throw new Error('User does not have permission to create engagements');
      }

      // Get user's firm
      const user = await User.findByPk(createdBy);
      if (!user) {
        throw new Error('User not found');
      }

      // Create engagement
      const engagement = await Engagement.create({
        firm_id: user.firm_id,
        name: engagementData.name,
        client_name: engagementData.client_name,
        description: engagementData.description,
        start_date: engagementData.start_date,
        end_date: engagementData.end_date,
        status: engagementData.status || 'ACTIVE',
        created_by: createdBy
      });

      // Automatically add creator to engagement team as LEAD
      await this.addUserToEngagement(engagement.id, createdBy, 'LEAD', createdBy);

      // Log engagement creation
      await authService.logAuditEvent(
        createdBy,
        user.firm_id,
        'CREATE_ENGAGEMENT',
        'ENGAGEMENT',
        engagement.id,
        { name: engagement.name, client_name: engagement.client_name },
        null,
        null,
        'SUCCESS'
      );

      return engagement;
    } catch (error) {
      logger.error('Create engagement error:', error);
      throw error;
    }
  }

  /**
   * Get engagement by ID with access check
   */
  async getEngagement(engagementId, userId) {
    try {
      const engagement = await Engagement.findByPk(engagementId, {
        include: [
          {
            model: AuditClient,
            as: 'auditClient',
            attributes: ['id', 'client_name', 'status', 'firm_id']
          },
          {
            model: User,
            as: 'teamMembers',
            attributes: ['id', 'user_name', 'email', 'type'],
            through: { attributes: ['role'] }
          }
        ]
      });

      if (!engagement) {
        throw new Error('Engagement not found');
      }

      // Check if this is a default engagement - don't allow access to default/placeholder engagements
      if (engagement.is_default === true) {
        throw new Error('Engagement not available - default engagement is not accessible');
      }

      // Check if client status is Active - don't allow access to engagements with Pending clients
      if (engagement.auditClient && engagement.auditClient.status !== 'Active') {
        throw new Error('Engagement not available - client status is not Active');
      }

      // Check if user has access to this engagement
      const hasAccess = await this.checkUserAccess(engagementId, userId);
      
      if (!hasAccess) {
        throw new Error('Access denied to this engagement');
      }

      return engagement;
    } catch (error) {
      logger.error('Get engagement error:', error);
      throw error;
    }
  }

  /**
   * List engagements user has access to
   * Returns all engagements where the user is a team member (via engagement_users table)
   */
  async listEngagements(userId, filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 100, sort_by = 'created_at', sort_order = 'DESC' } = pagination;
      const offset = (page - 1) * limit;
      const { Op } = require('sequelize');

      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Build where clause for engagements
      // Exclude default engagements created during client onboarding
      const engagementWhere = {
        is_default: false // Don't display default/placeholder engagements
      };
      if (filters.status) {
        engagementWhere.status = filters.status;
      }

      // Build where clause for audit client (if filtering by client_name)
      // Only show engagements for clients with status 'Active'
      const clientWhere = {
        status: 'Active' // Only display engagements for Active clients
      };
      if (filters.client_name) {
        clientWhere.client_name = { [Op.iLike]: `%${filters.client_name}%` };
      }

      // Get engagements where user is a team member via engagement_users
      const { rows: engagements, count: total } = await Engagement.findAndCountAll({
        where: engagementWhere,
        include: [
          {
            model: AuditClient,
            as: 'auditClient',
            where: clientWhere,
            required: true,
            attributes: ['id', 'client_name', 'status', 'firm_id']
          },
          {
            model: User,
            as: 'teamMembers',
            through: {
              where: {
                user_id: userId
              },
              attributes: ['role'] // Include role from EngagementUser junction table
            },
            attributes: ['id', 'user_name', 'email', 'type'],
            required: true // Only get engagements where user is a team member
          }
        ],
        attributes: ['id', 'audit_client_id', 'status', 'is_default', 'engagement_name', 'created_at', 'updated_at'],
        limit,
        offset,
        order: [[sort_by, sort_order]],
        distinct: true
      });

      // Format the response to include client_name and engagement_name
      const formattedEngagements = engagements.map(engagement => {
        const engagementData = engagement.toJSON();
        // Format teamMembers to include role from through table
        const formattedTeamMembers = (engagementData.teamMembers || []).map(member => ({
          id: member.id,
          user_name: member.user_name,
          email: member.email,
          type: member.type,
          role: member.EngagementUser?.role || null // Extract role from through table
        }));
        
        return {
          id: engagementData.id,
          audit_client_id: engagementData.audit_client_id,
          status: engagementData.status,
          is_default: engagementData.is_default,
          engagement_name: engagementData.engagement_name,
          client_name: engagementData.auditClient?.client_name,
          teamMembers: formattedTeamMembers,
          created_at: engagementData.created_at,
          updated_at: engagementData.updated_at
        };
      });

      return {
        engagements: formattedEngagements,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('List engagements error:', error);
      throw error;
    }
  }

  /**
   * Update engagement
   */
  async updateEngagement(engagementId, updateData, updatedBy) {
    try {
      const engagement = await Engagement.findByPk(engagementId);

      if (!engagement) {
        throw new Error('Engagement not found');
      }

      // Check if user has access
      const hasAccess = await this.checkUserAccess(engagementId, updatedBy);
      
      if (!hasAccess) {
        throw new Error('Access denied to this engagement');
      }

      // Update allowed fields
      const allowedFields = ['name', 'client_name', 'description', 'start_date', 'end_date', 'status'];
      
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          engagement[field] = updateData[field];
        }
      }

      await engagement.save();

      // Log engagement update - get firm_id from auditClient
      const auditClient = await AuditClient.findByPk(engagement.audit_client_id);
      const firmId = auditClient ? auditClient.firm_id : null;
      
      await authService.logAuditEvent(
        updatedBy,
        firmId,
        'UPDATE_ENGAGEMENT',
        'ENGAGEMENT',
        engagement.id,
        updateData,
        null,
        null,
        'SUCCESS'
      );

      return engagement;
    } catch (error) {
      logger.error('Update engagement error:', error);
      throw error;
    }
  }

  /**
   * Add user to engagement team
   * Uses EngagementUser model directly to ensure database is updated
   */
  async addUserToEngagement(engagementId, userIdToAdd, role = 'associate', addedBy) {
    try {
      // Get engagement
      const engagement = await Engagement.findByPk(engagementId);

      if (!engagement) {
        throw new Error('Engagement not found');
      }

      // Get firm_id from engagement's audit client
      const auditClient = await AuditClient.findByPk(engagement.audit_client_id);
      if (!auditClient) {
        throw new Error('Audit client not found for engagement');
      }
      const firmId = auditClient.firm_id;

      // Check if adding user has access (if not system operation)
      // Only allow engagement_partner or engagement_manager to add users
      if (addedBy && addedBy !== userIdToAdd) {
        const hasAccess = await this.checkUserAccess(engagementId, addedBy);
        
        if (!hasAccess) {
          throw new Error('Access denied to this engagement');
        }

        // Additional check: verify user has partner or manager role
        const currentUserMember = await EngagementUser.findOne({
          where: {
            engagement_id: engagementId,
            user_id: addedBy
          }
        });

        if (currentUserMember && 
            currentUserMember.role !== 'engagement_partner' && 
            currentUserMember.role !== 'engagement_manager') {
          throw new Error('Only engagement partners and managers can add users');
        }
      }

      // Verify user to add exists and belongs to same firm
      const userToAdd = await User.findByPk(userIdToAdd);
      
      if (!userToAdd) {
        throw new Error('User to add not found');
      }

      if (userToAdd.firm_id !== firmId) {
        throw new Error('User does not belong to the same firm');
      }

      // Check if user is already in engagement
      const existingMember = await EngagementUser.findOne({
        where: {
          engagement_id: engagementId,
          user_id: userIdToAdd
        }
      });
      
      if (existingMember) {
        throw new Error('User is already a member of this engagement');
      }

      // Add user to engagement by creating EngagementUser record directly in database
      const engagementUser = await EngagementUser.create({
        engagement_id: engagementId,
        user_id: userIdToAdd,
        role: role,
        confirmation_tool: false, // Default false, will be set by confirmation tool when user is added
        sampling_tool: false // Default false, will be set by sampling tool when user is added
      });

      // Log user addition
      if (addedBy) {
        await authService.logAuditEvent(
          addedBy,
          firmId,
          'ADD_USER_TO_ENGAGEMENT',
          'ENGAGEMENT',
          engagement.id,
          { user_id: userIdToAdd, role },
          null,
          null,
          'SUCCESS'
        );
      }

      return engagementUser;
    } catch (error) {
      logger.error('Add user to engagement error:', error);
      throw error;
    }
  }

  /**
   * Remove user from engagement team
   * Uses EngagementUser model directly to ensure database is updated
   */
  async removeUserFromEngagement(engagementId, userIdToRemove, removedBy) {
    try {
      // Get engagement
      const engagement = await Engagement.findByPk(engagementId);

      if (!engagement) {
        throw new Error('Engagement not found');
      }

      // Get firm_id from engagement's audit client
      const auditClient = await AuditClient.findByPk(engagement.audit_client_id);
      if (!auditClient) {
        throw new Error('Audit client not found for engagement');
      }
      const firmId = auditClient.firm_id;

      // Check if removing user has access
      // Only allow engagement_partner or engagement_manager to remove users
      const hasAccess = await this.checkUserAccess(engagementId, removedBy);
      
      if (!hasAccess) {
        throw new Error('Access denied to this engagement');
      }

      // Additional check: verify user has partner or manager role
      const currentUserMember = await EngagementUser.findOne({
        where: {
          engagement_id: engagementId,
          user_id: removedBy
        }
      });

      if (currentUserMember && 
          currentUserMember.role !== 'engagement_partner' && 
          currentUserMember.role !== 'engagement_manager') {
        throw new Error('Only engagement partners and managers can remove users');
      }

      // Verify user to remove exists
      const userToRemove = await User.findByPk(userIdToRemove);
      
      if (!userToRemove) {
        throw new Error('User to remove not found');
      }

      // Check if user is in engagement
      const engagementUser = await EngagementUser.findOne({
        where: {
          engagement_id: engagementId,
          user_id: userIdToRemove
        }
      });

      if (!engagementUser) {
        throw new Error('User is not a member of this engagement');
      }

      // Remove user from engagement by deleting EngagementUser record directly from database
      await EngagementUser.destroy({
        where: {
          engagement_id: engagementId,
          user_id: userIdToRemove
        }
      });

      // Log user removal
      await authService.logAuditEvent(
        removedBy,
        firmId,
        'REMOVE_USER_FROM_ENGAGEMENT',
        'ENGAGEMENT',
        engagement.id,
        { user_id: userIdToRemove },
        null,
        null,
        'SUCCESS'
      );

      return true;
    } catch (error) {
      logger.error('Remove user from engagement error:', error);
      throw error;
    }
  }

  /**
   * Get engagement team members
   */
  async getEngagementTeam(engagementId, userId) {
    try {
      // Check if user has access
      const hasAccess = await this.checkUserAccess(engagementId, userId);
      
      if (!hasAccess) {
        throw new Error('Access denied to this engagement');
      }

      const engagement = await Engagement.findByPk(engagementId, {
        include: [
          {
            model: User,
            as: 'teamMembers',
            attributes: ['id', 'user_name', 'email', 'type'],
            through: { 
              attributes: ['role']
            }
          }
        ]
      });

      if (!engagement) {
        throw new Error('Engagement not found');
      }

      // Format the response to include role from the through table
      // Sequelize stores through table data as member.EngagementUser
      const teamMembers = engagement.teamMembers.map(member => {
        return {
          id: member.id,
          user_name: member.user_name,
          email: member.email,
          type: member.type,
          role: member.EngagementUser ? member.EngagementUser.role : null
        };
      });

      return teamMembers;
    } catch (error) {
      logger.error('Get engagement team error:', error);
      throw error;
    }
  }

  /**
   * Check if user has access to engagement
   */
  async checkUserAccess(engagementId, userId) {
    try {
      const engagement = await Engagement.findByPk(engagementId, {
        include: [
          {
            association: 'teamMembers',
            where: { id: userId },
            required: false
          }
        ]
      });

      if (!engagement) {
        return false;
      }

      // User has access if they are a team member
      return engagement.teamMembers && engagement.teamMembers.length > 0;
    } catch (error) {
      logger.error('Check user access error:', error);
      return false;
    }
  }

  /**
   * Get users with confirmation tool access for engagement's firm
   * Returns users from the same firm who have "confirmation" in their allowed_tools
   */
  async getUsersAvailableForConfirmation(engagementId) {
    try {
      const { Op } = require('sequelize');
      const { sequelize } = require('../config/database');

      logger.info(`Getting users available for confirmation for engagement ${engagementId}`);

      // Get firm_id from engagement using direct SQL query to avoid association issues
      const firmQuery = `
        SELECT ac.firm_id
        FROM engagements e
        INNER JOIN audit_clients ac ON e.audit_client_id = ac.id
        WHERE e.id = :engagementId
      `;

      const [firmResult] = await sequelize.query(firmQuery, {
        replacements: { engagementId },
        type: sequelize.QueryTypes.SELECT
      });

      if (!firmResult || !firmResult.firm_id) {
        logger.error(`Engagement ${engagementId} not found or does not have associated audit client`);
        throw new Error('Engagement not found or does not have associated audit client');
      }

      const firmId = firmResult.firm_id;
      logger.info(`Found firm_id ${firmId} for engagement ${engagementId}`);

      // Query users from the same firm who have "confirmation" in allowed_tools
      const query = `
        SELECT 
          u.id,
          u.user_name,
          u.email,
          u.designation,
          u.type,
          u.is_active,
          u.allowed_tools
        FROM users u
        WHERE u.firm_id = :firmId
          AND u.is_active = true
          AND u.allowed_tools IS NOT NULL
          AND u.allowed_tools::jsonb @> '["confirmation"]'::jsonb
        ORDER BY u.user_name ASC
      `;

      logger.info(`Executing query for firm_id ${firmId}`);
      const users = await sequelize.query(query, {
        replacements: { firmId },
        type: sequelize.QueryTypes.SELECT
      });

      logger.info(`Found ${users.length} users with confirmation tool access for firm ${firmId}`);
      if (users.length > 0) {
        logger.info(`Users: ${users.map(u => `${u.user_name} (${u.email})`).join(', ')}`);
      }

      return users;
    } catch (error) {
      logger.error('Get users available for confirmation error:', error);
      throw error;
    }
  }

  /**
   * Update engagement user (e.g., set confirmation_tool or sampling_tool)
   */
  async updateEngagementUser(engagementId, userId, updateData) {
    try {
      // Find the engagement user record
      const engagementUser = await EngagementUser.findOne({
        where: {
          engagement_id: engagementId,
          user_id: userId
        }
      });

      if (!engagementUser) {
        throw new Error('User is not a member of this engagement');
      }

      // Only allow updating confirmation_tool and sampling_tool
      const allowedFields = ['confirmation_tool', 'sampling_tool'];
      const updates = {};
      
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          updates[field] = updateData[field];
        }
      }

      if (Object.keys(updates).length === 0) {
        throw new Error('No valid fields to update');
      }

      // Update the engagement user
      await engagementUser.update(updates);

      return engagementUser;
    } catch (error) {
      logger.error('Update engagement user error:', error);
      throw error;
    }
  }
}

module.exports = new EngagementService();

