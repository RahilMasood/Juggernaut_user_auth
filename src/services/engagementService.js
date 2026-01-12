const { Engagement, User, AuditClient } = require('../models');
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
          { association: 'firm', attributes: ['id', 'name'] },
          { association: 'creator', attributes: ['id', 'email', 'first_name', 'last_name'] },
          {
            association: 'teamMembers',
            attributes: ['id', 'email', 'first_name', 'last_name', 'user_type'],
            through: { attributes: ['role'] }
          }
        ]
      });

      if (!engagement) {
        throw new Error('Engagement not found');
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
      const engagementWhere = {};
      if (filters.status) {
        engagementWhere.status = filters.status;
      }

      // Build where clause for audit client (if filtering by client_name)
      const clientWhere = {};
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
              }
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
        return {
          id: engagementData.id,
          audit_client_id: engagementData.audit_client_id,
          status: engagementData.status,
          is_default: engagementData.is_default,
          engagement_name: engagementData.engagement_name,
          client_name: engagementData.auditClient?.client_name,
          teamMembers: engagementData.teamMembers || [],
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

      // Log engagement update
      await authService.logAuditEvent(
        updatedBy,
        engagement.firm_id,
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
   */
  async addUserToEngagement(engagementId, userIdToAdd, role = 'MEMBER', addedBy) {
    try {
      const engagement = await Engagement.findByPk(engagementId);

      if (!engagement) {
        throw new Error('Engagement not found');
      }

      // Check if adding user has access (if not system operation)
      if (addedBy && addedBy !== userIdToAdd) {
        const hasAccess = await this.checkUserAccess(engagementId, addedBy);
        
        if (!hasAccess) {
          throw new Error('Access denied to this engagement');
        }
      }

      // Verify user to add exists and belongs to same firm
      const userToAdd = await User.findByPk(userIdToAdd);
      
      if (!userToAdd) {
        throw new Error('User to add not found');
      }

      if (userToAdd.firm_id !== engagement.firm_id) {
        throw new Error('User does not belong to the same firm');
      }

      // Check if user is already in engagement
      const existingMember = await engagement.hasTeamMember(userToAdd);
      
      if (existingMember) {
        throw new Error('User is already a member of this engagement');
      }

      // Add user to engagement with role
      await engagement.addTeamMember(userToAdd, {
        through: { role }
      });

      // Log user addition
      if (addedBy) {
        await authService.logAuditEvent(
          addedBy,
          engagement.firm_id,
          'ADD_USER_TO_ENGAGEMENT',
          'ENGAGEMENT',
          engagement.id,
          { user_id: userIdToAdd, role },
          null,
          null,
          'SUCCESS'
        );
      }

      return true;
    } catch (error) {
      logger.error('Add user to engagement error:', error);
      throw error;
    }
  }

  /**
   * Remove user from engagement team
   */
  async removeUserFromEngagement(engagementId, userIdToRemove, removedBy) {
    try {
      const engagement = await Engagement.findByPk(engagementId);

      if (!engagement) {
        throw new Error('Engagement not found');
      }

      // Check if removing user has access
      const hasAccess = await this.checkUserAccess(engagementId, removedBy);
      
      if (!hasAccess) {
        throw new Error('Access denied to this engagement');
      }

      // Cannot remove engagement creator
      if (userIdToRemove === engagement.created_by) {
        throw new Error('Cannot remove engagement creator');
      }

      const userToRemove = await User.findByPk(userIdToRemove);
      
      if (!userToRemove) {
        throw new Error('User to remove not found');
      }

      // Remove user from engagement
      await engagement.removeTeamMember(userToRemove);

      // Log user removal
      await authService.logAuditEvent(
        removedBy,
        engagement.firm_id,
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
            association: 'teamMembers',
            attributes: ['id', 'email', 'first_name', 'last_name', 'user_type', 'designation'],
            through: { attributes: ['role'] }
          }
        ]
      });

      if (!engagement) {
        throw new Error('Engagement not found');
      }

      return engagement.teamMembers;
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
}

module.exports = new EngagementService();

