const authService = require('../services/authService');
const validate = require('../middleware/validation');
const { loginSchema, changePasswordSchema } = require('../validators/schemas');
const logger = require('../utils/logger');

class AuthController {
  /**
   * Login
   * POST /api/v1/auth/login
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.get('user-agent');

      const result = await authService.login(email, password, ipAddress, userAgent);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh
   */
  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Refresh token is required'
          }
        });
      }

      const result = await authService.refreshAccessToken(refreshToken);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: error.message
        }
      });
    }
  }

  /**
   * Logout
   * POST /api/v1/auth/logout
   * Handles both JSON requests and sendBeacon blob requests
   */
  async logout(req, res, next) {
    try {
      let refreshToken = null;

      // Try to get refreshToken from body (handles both JSON and parsed blob)
      if (req.body) {
        if (typeof req.body === 'string') {
          // Body is a string (from blob or raw), try to parse it
          try {
            const parsed = JSON.parse(req.body);
            refreshToken = parsed.refreshToken;
          } catch (e) {
            // If JSON parsing fails, body might be the token itself
            logger.debug('Failed to parse logout request body as JSON, trying as direct value');
            refreshToken = req.body.trim();
          }
        } else if (typeof req.body === 'object') {
          // Body is already parsed as object (normal JSON request)
          refreshToken = req.body.refreshToken;
        }
      }

      // If we still don't have refreshToken, try query parameter as fallback
      if (!refreshToken && req.query?.refreshToken) {
        refreshToken = req.query.refreshToken;
      }

      if (refreshToken) {
        try {
          await authService.logout(refreshToken);
        } catch (error) {
          // Log error but don't fail the request
          logger.warn('Error during logout service call:', error.message);
        }
      }

      // Always return success to prevent client errors
      res.json({
        success: true,
        data: {
          message: 'Logged out successfully'
        }
      });
    } catch (error) {
      // Don't throw error for logout - just log it and return success
      logger.warn('Logout error (non-critical):', error.message);
      res.json({
        success: true,
        data: {
          message: 'Logged out successfully'
        }
      });
    }
  }

  /**
   * Change password
   * POST /api/v1/auth/change-password
   */
  async changePassword(req, res, next) {
    try {
      const { old_password, new_password } = req.body;
      const userId = req.user.id;

      await authService.changePassword(userId, old_password, new_password);

      res.json({
        success: true,
        data: {
          message: 'Password changed successfully. Please login again.'
        }
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * Get current user info
   * GET /api/v1/auth/me
   */
  async getCurrentUser(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Not authenticated'
          }
        });
      }
  
      res.json({
        success: true,
        data: { user: req.user.toJSON() }
      });
    } catch (error) {
      next(error);
    }
  }  
}

module.exports = new AuthController();

