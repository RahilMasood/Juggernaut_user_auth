const authService = require('../services/authService');
const logger = require('../utils/logger');
const { User, Firm, Role } = require('../models');


/**
 * Authentication middleware
 * Validates JWT token and attaches user info to request
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No authentication token provided'
        }
      });
    }

    const token = authHeader.substring(7);
    const decoded = authService.verifyAccessToken(token);

    const user = await User.findByPk(decoded.userId, {
      include: [
        { model: Firm, as: 'firm' },
        {
          model: Role,
          as: 'roles',
          include: ['permissions']
        }
      ]
      
    });
    

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not found'
        }
      });
    }

    req.user = user;
    req.auth = decoded; // optional if you want token payload separately

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token'
      }
    });
  }
}


/**
 * Optional authentication middleware
 * Attaches user info if token is present, but doesn't require it
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = authService.verifyAccessToken(token);
      
      req.user = {
        userId: decoded.userId,
        firmId: decoded.firmId,
        email: decoded.email,
        userType: decoded.userType,
        roles: decoded.roles || []
      };
    }
  } catch (error) {
    // Silently fail - authentication is optional
    logger.debug('Optional auth failed:', error.message);
  }
  
  next();
}

/**
 * Require specific user type(s)
 */
function requireUserType(...allowedTypes) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    // Sequelize converts snake_case to camelCase, but check both to be safe
    const userType = req.user.userType || req.user.user_type;
    
    if (!allowedTypes.includes(userType)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions'
        }
      });
    }

    next();
  };
}

module.exports = {
  authenticate,
  optionalAuth,
  requireUserType
};

