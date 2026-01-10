const userService = require('../services/userService');
const { getUserPermissions } = require('../middleware/rbac');

class UserController {
  /**
   * Create user
   * POST /api/v1/users
   */
  async createUser(req, res, next) {
    try {
      const userData = req.body;
      const createdBy = req.user.id;

      const result = await userService.createUser(userData, createdBy);

      res.status(201).json({
        success: true,
        data: { 
          user: result.user.toJSON(),
          credentialsSent: result.credentialsSent,
          message: result.credentialsSent 
            ? 'User created successfully. Login credentials have been sent via email.' 
            : 'User created successfully.'
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
   * Get user by ID
   * GET /api/v1/users/:id
   */
  async getUser(req, res, next) {
    try {
      const { id } = req.params;

      const user = await userService.getUserById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'User not found'
          }
        });
      }

      // Check if user has permission to view this user
      // Users can view themselves, or need manage_users permission
      if (req.user.id !== id) {
        const { hasPermission } = require('../middleware/rbac');
        const canManage = await hasPermission(req.user.id, 'manage_users');
        
        if (!canManage) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Insufficient permissions'
            }
          });
        }
      }

      res.json({
        success: true,
        data: { user: user.toJSON() }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List users
   * GET /api/v1/users
   */
  async listUsers(req, res, next) {
    try {
      const filters = {
        firm_id: req.user.firmId, // Users can only see users from their firm
        user_type: req.query.user_type,
        is_active: req.query.is_active,
        search: req.query.search
      };

      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        sort_by: req.query.sort_by || 'created_at',
        sort_order: req.query.sort_order || 'DESC'
      };

      const result = await userService.listUsers(filters, pagination);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user
   * PATCH /api/v1/users/:id
   */
  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedBy = req.user.id;

      const user = await userService.updateUser(id, updateData, updatedBy);

      res.json({
        success: true,
        data: { user: user.toJSON() }
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
   * Deactivate user
   * DELETE /api/v1/users/:id
   */
  async deactivateUser(req, res, next) {
    try {
      const { id } = req.params;
      const deactivatedBy = req.user.id;

      // Prevent self-deactivation
      if (id === req.user.id) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Cannot deactivate your own account'
          }
        });
      }

      const user = await userService.deactivateUser(id, deactivatedBy);

      res.json({
        success: true,
        data: {
          message: 'User deactivated successfully',
          user: user.toJSON()
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
   * Get user permissions
   * GET /api/v1/users/:id/permissions
   */
  async getUserPermissions(req, res, next) {
    try {
      const { id } = req.params;

      // Users can view their own permissions, or need manage_users permission
      if (req.user.id !== id) {
        const { hasPermission } = require('../middleware/rbac');
        const canManage = await hasPermission(req.user.id, 'manage_users');
        
        if (!canManage) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Insufficient permissions'
            }
          });
        }
      }

      const permissions = await getUserPermissions(id);

      res.json({
        success: true,
        data: { permissions }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();

