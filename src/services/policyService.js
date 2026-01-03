const { User, Role, Permission, Firm } = require('../models');
const logger = require('../utils/logger');

class PolicyService {
  /**
   * Check if user can create engagement based on firm policy
   */
  async canCreateEngagement(userId) {
    try {
      const user = await User.findByPk(userId, {
        include: [
          {
            association: 'firm'
          },
          {
            association: 'roles',
            include: ['permissions']
          },
          {
            association: 'customPermissions'
          }
        ]
      });

      if (!user || !user.is_active) {
        return false;
      }

      // Check custom permissions first (highest priority)
      if (user.customPermissions) {
        const hasCustomPermission = user.customPermissions.some(
          p => p.name === 'create_engagement'
        );
        if (hasCustomPermission) {
          return true;
        }
      }

      // Check role-based permissions
      if (user.roles) {
        for (const role of user.roles) {
          if (role.permissions) {
            const hasRolePermission = role.permissions.some(
              p => p.name === 'create_engagement'
            );
            if (hasRolePermission) {
              return true;
            }
          }
        }
      }

      // Check firm-level policy
      const firmSettings = user.firm.settings || {};
      const engagementPolicy = firmSettings.create_engagement || {};

      // Check if user's roles are in allowed roles
      if (engagementPolicy.allowed_roles && Array.isArray(engagementPolicy.allowed_roles)) {
        const userRoleNames = user.roles.map(r => r.name);
        const hasAllowedRole = engagementPolicy.allowed_roles.some(
          allowedRole => userRoleNames.includes(allowedRole)
        );
        if (hasAllowedRole) {
          return true;
        }
      }

      // Check if user is in custom allowed users
      if (engagementPolicy.custom_users && Array.isArray(engagementPolicy.custom_users)) {
        if (engagementPolicy.custom_users.includes(userId)) {
          return true;
        }
      }

      return false;
    } catch (error) {
      logger.error('Policy check error:', error);
      return false;
    }
  }

  /**
   * Check if user can access specific tool
   */
  async canAccessTool(userId, toolName) {
    try {
      const permissionName = `access_${toolName}_tool`;
      
      const user = await User.findByPk(userId, {
        include: [
          {
            association: 'firm'
          },
          {
            association: 'roles',
            include: ['permissions']
          },
          {
            association: 'customPermissions'
          }
        ]
      });

      if (!user || !user.is_active) {
        return false;
      }

      // Check custom permissions
      if (user.customPermissions) {
        const hasCustomPermission = user.customPermissions.some(
          p => p.name === permissionName
        );
        if (hasCustomPermission) {
          return true;
        }
      }

      // Check role permissions
      if (user.roles) {
        for (const role of user.roles) {
          if (role.permissions) {
            const hasRolePermission = role.permissions.some(
              p => p.name === permissionName
            );
            if (hasRolePermission) {
              return true;
            }
          }
        }
      }

      // Check firm policy
      const firmSettings = user.firm.settings || {};
      const toolPolicy = firmSettings[permissionName] || {};

      if (toolPolicy.allowed_roles && Array.isArray(toolPolicy.allowed_roles)) {
        const userRoleNames = user.roles.map(r => r.name);
        const hasAllowedRole = toolPolicy.allowed_roles.some(
          allowedRole => userRoleNames.includes(allowedRole)
        );
        if (hasAllowedRole) {
          return true;
        }
      }

      if (toolPolicy.custom_users && Array.isArray(toolPolicy.custom_users)) {
        if (toolPolicy.custom_users.includes(userId)) {
          return true;
        }
      }

      return false;
    } catch (error) {
      logger.error('Tool access check error:', error);
      return false;
    }
  }

  /**
   * Assign role to user
   */
  async assignRoleToUser(userId, roleId, assignedBy = null) {
    try {
      const user = await User.findByPk(userId, {
        include: ['roles']
      });

      if (!user) {
        throw new Error('User not found');
      }

      const role = await Role.findByPk(roleId);

      if (!role) {
        throw new Error('Role not found');
      }

      // Check if role belongs to same firm as user
      if (role.firm_id !== user.firm_id) {
        throw new Error('Role does not belong to user\'s firm');
      }

      // Check if user already has this role
      const hasRole = user.roles.some(r => r.id === roleId);
      if (hasRole) {
        throw new Error('User already has this role');
      }

      // Assign role
      await user.addRole(role);

      // Log role assignment
      if (assignedBy) {
        const authService = require('./authService');
        await authService.logAuditEvent(
          assignedBy,
          user.firm_id,
          'ASSIGN_ROLE',
          'USER',
          userId,
          { role_id: roleId, role_name: role.name },
          null,
          null,
          'SUCCESS'
        );
      }

      return true;
    } catch (error) {
      logger.error('Assign role error:', error);
      throw error;
    }
  }

  /**
   * Remove role from user
   */
  async removeRoleFromUser(userId, roleId, removedBy = null) {
    try {
      const user = await User.findByPk(userId, {
        include: ['roles']
      });

      if (!user) {
        throw new Error('User not found');
      }

      const role = await Role.findByPk(roleId);

      if (!role) {
        throw new Error('Role not found');
      }

      // Remove role
      await user.removeRole(role);

      // Log role removal
      if (removedBy) {
        const authService = require('./authService');
        await authService.logAuditEvent(
          removedBy,
          user.firm_id,
          'REMOVE_ROLE',
          'USER',
          userId,
          { role_id: roleId, role_name: role.name },
          null,
          null,
          'SUCCESS'
        );
      }

      return true;
    } catch (error) {
      logger.error('Remove role error:', error);
      throw error;
    }
  }

  /**
   * Grant custom permission to user
   */
  async grantCustomPermission(userId, permissionId, grantedBy = null) {
    try {
      const user = await User.findByPk(userId);

      if (!user) {
        throw new Error('User not found');
      }

      const permission = await Permission.findByPk(permissionId);

      if (!permission) {
        throw new Error('Permission not found');
      }

      // Grant permission
      await user.addCustomPermission(permission);

      // Log permission grant
      if (grantedBy) {
        const authService = require('./authService');
        await authService.logAuditEvent(
          grantedBy,
          user.firm_id,
          'GRANT_PERMISSION',
          'USER',
          userId,
          { permission_id: permissionId, permission_name: permission.name },
          null,
          null,
          'SUCCESS'
        );
      }

      return true;
    } catch (error) {
      logger.error('Grant permission error:', error);
      throw error;
    }
  }

  /**
   * Revoke custom permission from user
   */
  async revokeCustomPermission(userId, permissionId, revokedBy = null) {
    try {
      const user = await User.findByPk(userId);

      if (!user) {
        throw new Error('User not found');
      }

      const permission = await Permission.findByPk(permissionId);

      if (!permission) {
        throw new Error('Permission not found');
      }

      // Revoke permission
      await user.removeCustomPermission(permission);

      // Log permission revocation
      if (revokedBy) {
        const authService = require('./authService');
        await authService.logAuditEvent(
          revokedBy,
          user.firm_id,
          'REVOKE_PERMISSION',
          'USER',
          userId,
          { permission_id: permissionId, permission_name: permission.name },
          null,
          null,
          'SUCCESS'
        );
      }

      return true;
    } catch (error) {
      logger.error('Revoke permission error:', error);
      throw error;
    }
  }

  /**
   * Update firm policy settings
   */
  async updateFirmPolicy(firmId, policySettings, updatedBy = null) {
    try {
      const firm = await Firm.findByPk(firmId);

      if (!firm) {
        throw new Error('Firm not found');
      }

      // Merge new settings with existing settings
      firm.settings = {
        ...firm.settings,
        ...policySettings
      };

      await firm.save();

      // Log policy update
      if (updatedBy) {
        const authService = require('./authService');
        await authService.logAuditEvent(
          updatedBy,
          firmId,
          'UPDATE_FIRM_POLICY',
          'FIRM',
          firmId,
          policySettings,
          null,
          null,
          'SUCCESS'
        );
      }

      return firm;
    } catch (error) {
      logger.error('Update firm policy error:', error);
      throw error;
    }
  }

  /**
   * Create role with permissions
   */
  async createRole(firmId, roleData, createdBy = null) {
    try {
      const { name, description, hierarchy_level, permission_ids } = roleData;

      // Create role
      const role = await Role.create({
        firm_id: firmId,
        name,
        description,
        hierarchy_level: hierarchy_level || 0,
        is_default: false
      });

      // Assign permissions if provided
      if (permission_ids && Array.isArray(permission_ids) && permission_ids.length > 0) {
        const permissions = await Permission.findAll({
          where: { id: permission_ids }
        });

        await role.addPermissions(permissions);
      }

      // Log role creation
      if (createdBy) {
        const authService = require('./authService');
        await authService.logAuditEvent(
          createdBy,
          firmId,
          'CREATE_ROLE',
          'ROLE',
          role.id,
          { name, permission_ids },
          null,
          null,
          'SUCCESS'
        );
      }

      return role;
    } catch (error) {
      logger.error('Create role error:', error);
      throw error;
    }
  }
}

module.exports = new PolicyService();

