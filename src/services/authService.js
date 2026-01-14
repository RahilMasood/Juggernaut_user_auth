const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const authConfig = require('../config/auth');
const { User, RefreshToken, AuditLog } = require('../models');
const { generatePassword } = require('../utils/passwordGenerator');
const logger = require('../utils/logger');

class AuthService {
  /**
   * Authenticate user and generate tokens
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} ipAddress - IP address
   * @param {string} userAgent - User agent
   * @param {string} applicationType - Type of application: 'main', 'confirmation', 'sampling', 'clientonboard'
   */
  async login(email, password, ipAddress, userAgent, applicationType = 'main') {
    try {
      // Find user
      const user = await User.findOne({ 
        where: { email },
        include: [
          { association: 'firm' }
        ]
      });

      if (!user) {
        await this.logAuditEvent(null, null, 'LOGIN', null, null, 
          { email }, ipAddress, userAgent, 'FAILURE', 'User not found');
        throw new Error('Invalid credentials');
      }

      // Check if account is locked
      if (user.isLocked()) {
        await this.logAuditEvent(user.id, user.firm_id, 'LOGIN', 'USER', user.id,
          { reason: 'Account locked' }, ipAddress, userAgent, 'FAILURE', 'Account locked');
        throw new Error('Account is locked due to too many failed login attempts');
      }

      // Check if account is active
      if (!user.is_active) {
        await this.logAuditEvent(user.id, user.firm_id, 'LOGIN', 'USER', user.id,
          { reason: 'Account inactive' }, ipAddress, userAgent, 'FAILURE', 'Account inactive');
        throw new Error('Account is inactive');
      }

      // Verify password
      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        await user.incrementFailedLogins();
        await this.logAuditEvent(user.id, user.firm_id, 'LOGIN', 'USER', user.id,
          { reason: 'Invalid password' }, ipAddress, userAgent, 'FAILURE', 'Invalid password');
        throw new Error('Invalid credentials');
      }

      // Tool-based session enforcement: Check if user is already logged in for THIS SPECIFIC TOOL
      // ClientOnboard always allows login (skip session check)
      if (applicationType !== 'clientonboard') {
        const activeTokens = await RefreshToken.findAll({
          where: {
            user_id: user.id,
            application_type: applicationType,
            is_revoked: false,
            expires_at: {
              [Op.gt]: new Date() // Not expired
            }
          }
        });

        if (activeTokens.length > 0) {
          // User is already logged in for this specific tool on another system - reject this login attempt
          await this.logAuditEvent(
            user.id,
            user.firm_id,
            'LOGIN',
            'USER',
            user.id,
            { 
              reason: `User already logged in on another system for ${applicationType}`, 
              active_sessions: activeTokens.length,
              application_type: applicationType
            },
            ipAddress,
            userAgent,
            'FAILURE',
            `User is already logged in on another system for ${applicationType}. Please log out from the other system first.`
          );
          throw new Error(`User is already logged in on another system for ${applicationType}. Please log out from the other system first.`);
        }
      }

      // Check if user has access to this tool (if not clientonboard)
      if (applicationType !== 'clientonboard' && applicationType !== 'main') {
        // Check user's allowed_tools
        const allowedTools = user.allowed_tools || [];
        if (!allowedTools.includes(applicationType) && !allowedTools.includes('main')) {
          await this.logAuditEvent(
            user.id,
            user.firm_id,
            'LOGIN',
            'USER',
            user.id,
            { reason: `User does not have access to ${applicationType}` },
            ipAddress,
            userAgent,
            'FAILURE',
            `User does not have access to ${applicationType}`
          );
          throw new Error(`User does not have access to ${applicationType}`);
        }
      }

      // Reset failed login attempts
      await user.resetFailedLogins();

      // Generate tokens
      const accessToken = this.generateAccessToken(user);
      const refreshToken = await this.generateRefreshToken(user, ipAddress, userAgent, applicationType);

      // Log successful login
      await this.logAuditEvent(user.id, user.firm_id, 'LOGIN', 'USER', user.id,
        {}, ipAddress, userAgent, 'SUCCESS');

      return {
        user: user.toJSON(),
        accessToken,
        refreshToken,
        mustChangePassword: user.must_change_password
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Generate access token (JWT)
   */
  generateAccessToken(user) {
    const payload = {
      userId: user.id,
      firmId: user.firm_id,
      email: user.email,
      type: user.type
    };

    return jwt.sign(payload, authConfig.jwt.accessSecret, {
      expiresIn: authConfig.jwt.accessExpiry
    });
  }

  /**
   * Generate refresh token and store in database
   * @param {Object} user - User object
   * @param {string} ipAddress - IP address
   * @param {string} userAgent - User agent
   * @param {string} applicationType - Type of application: 'main', 'confirmation', 'sampling', 'clientonboard'
   */
  async generateRefreshToken(user, ipAddress, userAgent, applicationType = 'main') {
    const token = jwt.sign(
      { userId: user.id },
      authConfig.jwt.refreshSecret,
      { expiresIn: authConfig.jwt.refreshExpiry }
    );

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    // Store in database
    await RefreshToken.create({
      user_id: user.id,
      token,
      expires_at: expiresAt,
      ip_address: ipAddress,
      user_agent: userAgent,
      application_type: applicationType
    });

    return token;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshTokenValue) {
    try {
      // Verify token signature
      const decoded = jwt.verify(refreshTokenValue, authConfig.jwt.refreshSecret);

      // Find token in database
      const tokenRecord = await RefreshToken.findOne({
        where: { token: refreshTokenValue },
        include: [{
          association: 'user',
          include: ['firm']
        }]
      });

      if (!tokenRecord || !tokenRecord.isValid()) {
        throw new Error('Invalid or expired refresh token');
      }

      const user = tokenRecord.user;

      // Check if user is still active
      if (!user.is_active) {
        throw new Error('User account is inactive');
      }

      // Generate new access token
      const accessToken = this.generateAccessToken(user);

      return {
        user: user.toJSON(),
        accessToken,
        mustChangePassword: user.must_change_password
      };
    } catch (error) {
      logger.error('Token refresh error:', error);
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * Logout user (revoke refresh token)
   */
  async logout(refreshTokenValue) {
    try {
      const tokenRecord = await RefreshToken.findOne({
        where: { token: refreshTokenValue }
      });

      if (tokenRecord) {
        tokenRecord.is_revoked = true;
        tokenRecord.revoked_at = new Date();
        await tokenRecord.save();

        // Log logout
        await this.logAuditEvent(tokenRecord.user_id, null, 'LOGOUT', 'USER', tokenRecord.user_id,
          {}, null, null, 'SUCCESS');
      }

      return true;
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Change password
   */
  async changePassword(userId, oldPassword, newPassword) {
    try {
      const user = await User.findByPk(userId);

      if (!user) {
        throw new Error('User not found');
      }

      // Verify old password
      const isValidPassword = await user.comparePassword(oldPassword);
      if (!isValidPassword) {
        await this.logAuditEvent(userId, user.firm_id, 'CHANGE_PASSWORD', 'USER', userId,
          {}, null, null, 'FAILURE', 'Invalid old password');
        throw new Error('Invalid old password');
      }

      // Update password
      user.password_hash = newPassword;
      user.must_change_password = false;
      await user.save();

      // Revoke all refresh tokens to force re-login
      await RefreshToken.update(
        { is_revoked: true, revoked_at: new Date() },
        { where: { user_id: userId, is_revoked: false } }
      );

      // Log password change
      await this.logAuditEvent(userId, user.firm_id, 'CHANGE_PASSWORD', 'USER', userId,
        {}, null, null, 'SUCCESS');

      return true;
    } catch (error) {
      logger.error('Change password error:', error);
      throw error;
    }
  }

  /**
   * Log audit event
   */
  async logAuditEvent(userId, firmId, action, resourceType, resourceId, details, ipAddress, userAgent, status = 'SUCCESS', errorMessage = null) {
    try {
      await AuditLog.create({
        user_id: userId,
        firm_id: firmId,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details,
        ip_address: ipAddress,
        user_agent: userAgent,
        status,
        error_message: errorMessage
      });
    } catch (error) {
      logger.error('Failed to log audit event:', error);
      // Don't throw - logging failure shouldn't break the main operation
    }
  }

  /**
   * Verify JWT token
   */
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, authConfig.jwt.accessSecret);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Update refresh token heartbeat (last seen timestamp)
   * Called when user makes authenticated requests to keep session alive
   * If heartbeat stops (force shutdown, crash), token will be auto-revoked
   * @param {string} userId - User ID
   * @param {string} applicationType - Type of application (optional, defaults to 'main')
   */
  async updateTokenHeartbeat(userId, applicationType = 'main') {
    try {
      // Find the active refresh token for this user and application type
      const tokenRecord = await RefreshToken.findOne({
        where: {
          user_id: userId,
          application_type: applicationType,
          is_revoked: false,
          expires_at: {
            [Op.gt]: new Date() // Not expired
          }
        },
        order: [['created_at', 'DESC']] // Get the most recent token
      });

      if (tokenRecord) {
        // Update the updated_at timestamp (Sequelize handles this automatically on save)
        // But we'll explicitly touch it to ensure it updates
        await tokenRecord.save();
        logger.debug(`Token heartbeat updated for user ${userId}`);
      }
    } catch (error) {
      logger.error('Error updating token heartbeat:', error);
      // Don't throw - heartbeat failure shouldn't break the request
    }
  }

  /**
   * Auto-revoke stale tokens (tokens that haven't been updated in 5+ minutes)
   * This handles cases where app crashes or system force shuts down
   * Should be called periodically (e.g., every 2 minutes)
   */
  async revokeStaleTokens() {
    try {
      const STALE_THRESHOLD_MINUTES = 5;
      const staleThreshold = new Date();
      staleThreshold.setMinutes(staleThreshold.getMinutes() - STALE_THRESHOLD_MINUTES);

      // Sequelize automatically maps updatedAt (model) to updated_at (database) due to underscored: true
      // Revoke stale tokens for all application types
      const result = await RefreshToken.update(
        {
          is_revoked: true,
          revoked_at: new Date()
        },
        {
          where: {
            is_revoked: false,
            expires_at: {
              [Op.gt]: new Date() // Not expired
            },
            updatedAt: {
              [Op.lt]: staleThreshold // Not updated in last 5 minutes
            }
          }
        }
      );

      if (result[0] > 0) {
        logger.info(`Auto-revoked ${result[0]} stale refresh token(s)`);
      }
    } catch (error) {
      logger.error('Error revoking stale tokens:', error);
    }
  }
}

module.exports = new AuthService();

