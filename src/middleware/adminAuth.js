const adminService = require('../services/adminService');
const { Firm } = require('../models');
const logger = require('../utils/logger');

/**
 * Admin authentication middleware
 * Validates admin JWT token and attaches firm info to request
 */
async function authenticateAdmin(req, res, next) {
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
    const decoded = adminService.verifyAccessToken(token);

    const firm = await Firm.findByPk(decoded.firmId);

    if (!firm) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Firm not found'
        }
      });
    }

    req.firm = firm;
    req.auth = decoded;

    next();
  } catch (error) {
    logger.error('Admin authentication error:', error);
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token'
      }
    });
  }
}

module.exports = {
  authenticateAdmin
};

