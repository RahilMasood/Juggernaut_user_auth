const engagementManagementService = require('../services/engagementManagementService');

class EngagementManagementController {
  /**
   * Create Engagement
   * POST /api/v1/admin/clients/:clientId/engagements
   */
  async createEngagement(req, res, next) {
    try {
      const { clientId } = req.params;
      // Get firm_id from user (if regular auth) or firm (if admin auth)
      const firmId = req.user?.firm_id || req.firm?.id;
      if (!firmId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Firm ID not found'
          }
        });
      }
      const engagementData = req.body;

      const engagement = await engagementManagementService.createEngagement(
        clientId, 
        firmId, 
        engagementData
      );

      res.status(201).json({
        success: true,
        data: { 
          engagement: {
            id: engagement.id,
            audit_client_id: engagement.audit_client_id,
            status: engagement.status,
            teamMembers: engagement.teamMembers
          },
          message: 'Engagement created successfully'
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
   * List Engagements for a Client
   * GET /api/v1/admin/clients/:clientId/engagements
   */
  async listEngagements(req, res, next) {
    try {
      const { clientId } = req.params;
      const firmId = req.firm.id;

      const engagements = await engagementManagementService.listEngagements(clientId, firmId);

      res.json({
        success: true,
        data: { engagements }
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
   * Get Engagement by ID
   * GET /api/v1/admin/engagements/:id
   */
  async getEngagement(req, res, next) {
    try {
      const { id } = req.params;
      const firmId = req.firm.id;

      const engagement = await engagementManagementService.getEngagementById(id, firmId);

      res.json({
        success: true,
        data: { engagement }
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
   * Add User to Engagement
   * POST /api/v1/admin/engagements/:id/users
   */
  async addUser(req, res, next) {
    try {
      const { id } = req.params;
      const firmId = req.firm.id;
      const { user_id, role } = req.body;

      const engagementUser = await engagementManagementService.addUserToEngagement(
        id, 
        firmId, 
        user_id, 
        role
      );

      res.status(201).json({
        success: true,
        data: { 
          engagementUser,
          message: 'User added to engagement successfully'
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
   * Remove User from Engagement
   * DELETE /api/v1/admin/engagements/:id/users/:userId
   */
  async removeUser(req, res, next) {
    try {
      const { id, userId } = req.params;
      const firmId = req.firm.id;

      await engagementManagementService.removeUserFromEngagement(id, firmId, userId);

      res.json({
        success: true,
        data: {
          message: 'User removed from engagement successfully'
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
}

module.exports = new EngagementManagementController();

