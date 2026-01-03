const { User, Permission } = require('../models');
const logger = require('../utils/logger');

/**
 * Check if user has specific permission
 */
async function hasPermission(userId, permissionName) {
  try {
    const user = await User.findByPk(userId, {
      include: [
        {
          association: 'roles',
          include: [{
            association: 'permissions',
            where: { name: permissionName },
            required: false
          }]
        },
        {
          association: 'customPermissions',
          where: { name: permissionName },
          required: false
        }
      ]
    });

    if (!user) {
      return false;
    }

    // Check custom permissions (direct user permissions)
    if (user.customPermissions && user.customPermissions.length > 0) {
      return true;
    }

    // Check role permissions
    if (user.roles) {
      for (const role of user.roles) {
        if (role.permissions && role.permissions.length > 0) {
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    logger.error('Permission check error:', error);
    return false;
  }
}

/**
 * Get all effective permissions for a user
 */
async function getUserPermissions(userId) {
  try {
    const user = await User.findByPk(userId, {
      include: [
        {
          association: 'roles',
          include: ['permissions']
        },
        {
          association: 'customPermissions'
        }
      ]
    });

    if (!user) {
      return [];
    }

    const permissionSet = new Set();

    // Add role permissions
    if (user.roles) {
      for (const role of user.roles) {
        if (role.permissions) {
          role.permissions.forEach(p => permissionSet.add(p.name));
        }
      }
    }

    // Add custom permissions (these can override or add to role permissions)
    if (user.customPermissions) {
      user.customPermissions.forEach(p => permissionSet.add(p.name));
    }

    return Array.from(permissionSet);
  } catch (error) {
    logger.error('Get user permissions error:', error);
    return [];
  }
}

/**
 * Middleware to require specific permission(s)
 */
function requirePermission(...permissionNames) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    try {
      // Check if user has any of the required permissions
      for (const permissionName of permissionNames) {
        const hasAccess = await hasPermission(req.user.userId, permissionName);
        if (hasAccess) {
          return next();
        }
      }

      // User doesn't have any of the required permissions
      logger.warn(`Permission denied for user ${req.user.userId}. Required: ${permissionNames.join(' or ')}`);
      
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions'
        }
      });
    } catch (error) {
      logger.error('Permission middleware error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Error checking permissions'
        }
      });
    }
  };
}

/**
 * Middleware to require all specified permissions
 */
function requireAllPermissions(...permissionNames) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    try {
      // Check if user has all required permissions
      for (const permissionName of permissionNames) {
        const hasAccess = await hasPermission(req.user.userId, permissionName);
        if (!hasAccess) {
          logger.warn(`Permission denied for user ${req.user.userId}. Missing: ${permissionName}`);
          
          return res.status(403).json({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Insufficient permissions'
            }
          });
        }
      }

      next();
    } catch (error) {
      logger.error('Permission middleware error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Error checking permissions'
        }
      });
    }
  };
}

module.exports = {
  hasPermission,
  getUserPermissions,
  requirePermission,
  requireAllPermissions
};

