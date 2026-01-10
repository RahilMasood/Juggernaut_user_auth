const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth');
const { Firm } = require('../models');
const logger = require('../utils/logger');

class AdminService {
  /**
   * Admin login using admin_id and admin_password
   */
  async adminLogin(adminId, password, ipAddress, userAgent) {
    try {
      // Find firm by admin_id
      const firm = await Firm.findOne({ 
        where: { admin_id: adminId }
      });

      if (!firm) {
        throw new Error('Invalid credentials');
      }

      // Verify password
      const isValidPassword = await firm.compareAdminPassword(password);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      // Generate tokens
      const accessToken = this.generateAccessToken(firm);

      return {
        firm: firm.toJSON(),
        accessToken
      };
    } catch (error) {
      logger.error('Admin login error:', error);
      throw error;
    }
  }

  /**
   * Generate access token for admin
   */
  generateAccessToken(firm) {
    const payload = {
      firmId: firm.id,
      adminId: firm.admin_id,
      type: 'admin'
    };

    return jwt.sign(payload, authConfig.jwt.accessSecret, {
      expiresIn: authConfig.jwt.accessExpiry
    });
  }

  /**
   * Verify admin token
   */
  verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, authConfig.jwt.accessSecret);
      if (decoded.type !== 'admin') {
        throw new Error('Invalid token type');
      }
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
}

module.exports = new AdminService();

