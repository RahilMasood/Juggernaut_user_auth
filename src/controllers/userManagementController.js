const userManagementService = require('../services/userManagementService');

class UserManagementController {
  /**
   * Create User
   * POST /api/v1/admin/users
   */
  async createUser(req, res, next) {
    try {
      const firmId = req.firm.id;
      const userData = req.body;

      const user = await userManagementService.createUser(firmId, userData);

      res.status(201).json({
        success: true,
        data: { 
          user: user.toJSON(),
          message: 'User created successfully'
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
   * List Users
   * GET /api/v1/admin/users
   */
  async listUsers(req, res, next) {
    try {
      const firmId = req.firm.id;
      const users = await userManagementService.listUsers(firmId);

      res.json({
        success: true,
        data: { users: users.map(u => u.toJSON()) }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get User by ID
   * GET /api/v1/admin/users/:id
   */
  async getUser(req, res, next) {
    try {
      const { id } = req.params;
      const firmId = req.firm.id;

      const user = await userManagementService.getUserById(id, firmId);

      res.json({
        success: true,
        data: { user: user.toJSON() }
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: error.message
        }
      });
    }
  }

  /**
   * Update User
   * PATCH /api/v1/admin/users/:id
   */
  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const firmId = req.firm.id;
      const updateData = req.body;

      const user = await userManagementService.updateUser(id, firmId, updateData);

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
   * Delete User
   * DELETE /api/v1/admin/users/:id
   */
  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      const firmId = req.firm.id;

      await userManagementService.deleteUser(id, firmId);

      res.json({
        success: true,
        data: {
          message: 'User deleted successfully'
        }
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: error.message
        }
      });
    }
  }
}

module.exports = new UserManagementController();

