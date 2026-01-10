const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth');
const { User, RefreshToken, AuditLog } = require('../models');
const { generatePassword } = require('../utils/passwordGenerator');
const logger = require('../utils/logger');

class AuthService {
  /**
   * Authenticate user and generate tokens
   */
  async login(email, password, ipAddress, userAgent) {
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

      // Reset failed login attempts
      await user.resetFailedLogins();

      // Generate tokens
      const accessToken = this.generateAccessToken(user);
      const refreshToken = await this.generateRefreshToken(user, ipAddress, userAgent);

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
   */
  async generateRefreshToken(user, ipAddress, userAgent) {
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
      user_agent: userAgent
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
}

module.exports = new AuthService();

