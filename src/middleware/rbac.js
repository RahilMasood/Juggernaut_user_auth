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
            association: 'permissions'
            // Don't filter here - load all permissions and check below
          }]
        },
        {
          association: 'customPermissions'
          // Don't filter here - load all permissions and check below
        }
      ]
    });

    if (!user) {
      return false;
    }

    // Check custom permissions (direct user permissions)
    if (user.customPermissions && Array.isArray(user.customPermissions)) {
      for (const perm of user.customPermissions) {
        const permName = perm?.name || perm?.dataValues?.name || (typeof perm.get === 'function' ? perm.get('name') : null);
        if (permName === permissionName) {
          return true;
        }
      }
    }

    // Check role permissions
    if (user.roles && Array.isArray(user.roles)) {
      for (const role of user.roles) {
        if (role.permissions && Array.isArray(role.permissions)) {
          for (const perm of role.permissions) {
            const permName = perm?.name || perm?.dataValues?.name || (typeof perm.get === 'function' ? perm.get('name') : null);
            if (permName === permissionName) {
              return true;
            }
          }
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
 * Check permissions from already-loaded user object (optimized for middleware)
 */
function checkUserPermissions(user, permissionNames) {
  if (!user) {
    return false;
  }
  
  // Try to get user object - handle Sequelize instances
  let userObj = user;
  try {
    if (typeof user.toJSON === 'function') {
      userObj = user.toJSON();
      logger.debug('checkUserPermissions: Converted user using toJSON()');
    } else if (user.dataValues) {
      userObj = user.dataValues;
      logger.debug('checkUserPermissions: Using user.dataValues');
    }
  } catch (e) {
    logger.error('checkUserPermissions: Error converting user object', e);
  }

  const userPermissions = new Set();

  // Check role permissions (from already-loaded user object)
  logger.debug(`checkUserPermissions: User has ${userObj.roles?.length || 0} roles`);
  if (userObj.roles && Array.isArray(userObj.roles)) {
    for (const role of userObj.roles) {
      if (!role) continue;
      
      // Convert role to plain object if needed
      let roleObj = role;
      try {
        if (typeof role.toJSON === 'function') {
          roleObj = role.toJSON();
        } else if (role.dataValues) {
          roleObj = role.dataValues;
        }
      } catch (e) {
        logger.error('checkUserPermissions: Error converting role object', e);
        continue;
      }
      
      logger.debug(`checkUserPermissions: Processing role ${roleObj.name || 'unknown'}, has ${roleObj.permissions?.length || 0} permissions`);
      
      if (roleObj.permissions) {
        const permissions = Array.isArray(roleObj.permissions) 
          ? roleObj.permissions 
          : [roleObj.permissions];
        
        permissions.forEach(p => {
          // Convert permission to plain object if needed
          let permObj = p;
          try {
            if (typeof p.toJSON === 'function') {
              permObj = p.toJSON();
            } else if (p.dataValues) {
              permObj = p.dataValues;
            }
          } catch (e) {
            logger.error('checkUserPermissions: Error converting permission object', e);
            return;
          }
          
          const permName = permObj?.name;
          if (permName) {
            logger.debug(`checkUserPermissions: Found permission: ${permName}`);
            userPermissions.add(permName);
          } else {
            logger.warn(`checkUserPermissions: Permission object has no name property:`, permObj);
          }
        });
      } else {
        logger.debug(`checkUserPermissions: Role ${roleObj.name || 'unknown'} has no permissions property`);
      }
    }
  } else {
    logger.debug('checkUserPermissions: User has no roles or roles is not an array');
  }

  // Check custom permissions (from already-loaded user object)
  if (userObj.customPermissions) {
    const customPerms = Array.isArray(userObj.customPermissions) 
      ? userObj.customPermissions 
      : [userObj.customPermissions];
    
    customPerms.forEach(p => {
      let permObj = p;
      if (typeof p.toJSON === 'function') {
        permObj = p.toJSON();
      } else if (p.dataValues) {
        permObj = p.dataValues;
      }
      
      const permName = permObj?.name;
      if (permName) {
        userPermissions.add(permName);
      }
    });
  }

  // Check if user has any of the required permissions
  for (const permissionName of permissionNames) {
    if (userPermissions.has(permissionName)) {
      return true;
    }
  }

  return false;
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

    logger.info(`requirePermission: Checking permissions for user ${req.user.id}`);

    try {
      // First try to check from already-loaded user object (faster)
      const hasAccessFromLoaded = checkUserPermissions(req.user, permissionNames);
      
      if (hasAccessFromLoaded) {
        return next();
      }

      // If user object doesn't have permissions loaded, fall back to database query
      // This can happen if user was loaded elsewhere without includes
      for (const permissionName of permissionNames) {
        const hasAccess = await hasPermission(req.user.id, permissionName);
        if (hasAccess) {
          return next();
        }
      }

      // User doesn't have any of the required permissions
      logger.warn(`Permission denied for user ${req.user.id}. Required: ${permissionNames.join(' or ')}`);
      
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions'
        }
      });
    } catch (error) {
      logger.error('requirePermission: Permission middleware error:', error);
      logger.error('requirePermission: Error stack:', error.stack);
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
        const hasAccess = await hasPermission(req.user.id, permissionName);
        if (!hasAccess) {
          logger.warn(`Permission denied for user ${req.user.id}. Missing: ${permissionName}`);
          
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

