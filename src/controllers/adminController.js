const adminService = require('../services/adminService');

class AdminController {
  /**
   * Admin Login
   * POST /api/v1/admin/login
   */
  async login(req, res, next) {
    try {
      const { admin_id, password } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.get('user-agent');

      const result = await adminService.adminLogin(admin_id, password, ipAddress, userAgent);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: error.message || 'Invalid credentials'
        }
      });
    }
  }

  /**
   * Get current admin info
   * GET /api/v1/admin/me
   */
  async getCurrentAdmin(req, res, next) {
    try {
      if (!req.firm) {
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
        data: { firm: req.firm.toJSON() }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController();

