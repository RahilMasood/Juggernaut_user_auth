const engagementService = require('../services/engagementService');

class EngagementController {
  /**
   * Create engagement
   * POST /api/v1/engagements
   */
  async createEngagement(req, res, next) {
    try {
      const engagementData = req.body;
      const createdBy = req.user.id;

      const engagement = await engagementService.createEngagement(engagementData, createdBy);

      res.status(201).json({
        success: true,
        data: { engagement }
      });
    } catch (error) {
      return res.status(error.message.includes('permission') ? 403 : 400).json({
        success: false,
        error: {
          code: error.message.includes('permission') ? 'POLICY_VIOLATION' : 'VALIDATION_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * Get engagement by ID
   * GET /api/v1/engagements/:id
   */
  async getEngagement(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const engagement = await engagementService.getEngagement(id, userId);

      res.json({
        success: true,
        data: { engagement }
      });
    } catch (error) {
      return res.status(error.message.includes('Access denied') ? 403 : 404).json({
        success: false,
        error: {
          code: error.message.includes('Access denied') ? 'FORBIDDEN' : 'NOT_FOUND',
          message: error.message
        }
      });
    }
  }

  /**
   * List engagements
   * GET /api/v1/engagements
   */
  async listEngagements(req, res, next) {
    try {
      const userId = req.user.id;
      
      const filters = {
        status: req.query.status,
        client_name: req.query.client_name
      };

      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        sort_by: req.query.sort_by || 'created_at',
        sort_order: req.query.sort_order || 'DESC'
      };

      const result = await engagementService.listEngagements(userId, filters, pagination);

      res.json({
        success: true,
        data: result.engagements || []
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update engagement
   * PATCH /api/v1/engagements/:id
   */
  async updateEngagement(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedBy = req.user.id;

      const engagement = await engagementService.updateEngagement(id, updateData, updatedBy);

      res.json({
        success: true,
        data: { engagement }
      });
    } catch (error) {
      return res.status(error.message.includes('Access denied') ? 403 : 400).json({
        success: false,
        error: {
          code: error.message.includes('Access denied') ? 'FORBIDDEN' : 'VALIDATION_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * Add user to engagement
   * POST /api/v1/engagements/:id/users
   */
  async addUser(req, res, next) {
    try {
      const { id } = req.params;
      const { user_id, role } = req.body;
      const addedBy = req.user.id;

      await engagementService.addUserToEngagement(id, user_id, role, addedBy);

      res.json({
        success: true,
        data: {
          message: 'User added to engagement successfully'
        }
      });
    } catch (error) {
      return res.status(error.message.includes('Access denied') ? 403 : 400).json({
        success: false,
        error: {
          code: error.message.includes('Access denied') ? 'FORBIDDEN' : 'VALIDATION_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * Remove user from engagement
   * DELETE /api/v1/engagements/:id/users/:userId
   */
  async removeUser(req, res, next) {
    try {
      const { id, userId } = req.params;
      const removedBy = req.user.id;

      await engagementService.removeUserFromEngagement(id, userId, removedBy);

      res.json({
        success: true,
        data: {
          message: 'User removed from engagement successfully'
        }
      });
    } catch (error) {
      return res.status(error.message.includes('Access denied') ? 403 : 400).json({
        success: false,
        error: {
          code: error.message.includes('Access denied') ? 'FORBIDDEN' : 'VALIDATION_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * Get engagement team
   * GET /api/v1/engagements/:id/users
   */
  async getEngagementTeam(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const team = await engagementService.getEngagementTeam(id, userId);

      res.json({
        success: true,
        data: { team }
      });
    } catch (error) {
      return res.status(error.message.includes('Access denied') ? 403 : 404).json({
        success: false,
        error: {
          code: error.message.includes('Access denied') ? 'FORBIDDEN' : 'NOT_FOUND',
          message: error.message
        }
      });
    }
  }

  /**
   * Get users with confirmation tool access for engagement's firm
   * GET /api/v1/engagements/:id/users/available-for-confirmation
   */
  async getUsersAvailableForConfirmation(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Check if user has access to engagement
      await engagementService.getEngagement(id, userId);

      const users = await engagementService.getUsersAvailableForConfirmation(id);

      return res.json({
        success: true,
        data: { users }
      });
    } catch (error) {
      const logger = require('../utils/logger');
      logger.error('Error in getUsersAvailableForConfirmation controller:', error);
      return res.status(error.message.includes('Access denied') ? 403 : (error.message.includes('not found') ? 404 : 500)).json({
        success: false,
        error: {
          code: error.message.includes('Access denied') ? 'FORBIDDEN' : (error.message.includes('not found') ? 'NOT_FOUND' : 'INTERNAL_ERROR'),
          message: error.message
        }
      });
    }
  }

  /**
   * Update engagement user (e.g., set confirmation_tool or sampling_tool)
   * PATCH /api/v1/engagements/:id/users/:userId
   */
  async updateEngagementUser(req, res, next) {
    try {
      const { id, userId } = req.params;
      const updateData = req.body;
      const updatedBy = req.user.id;

      // Check if user has access to engagement
      await engagementService.getEngagement(id, updatedBy);

      const updated = await engagementService.updateEngagementUser(id, userId, updateData);

      res.json({
        success: true,
        data: { engagementUser: updated }
      });
    } catch (error) {
      return res.status(error.message.includes('Access denied') ? 403 : error.message.includes('not found') ? 404 : 400).json({
        success: false,
        error: {
          code: error.message.includes('Access denied') ? 'FORBIDDEN' : error.message.includes('not found') ? 'NOT_FOUND' : 'VALIDATION_ERROR',
          message: error.message
        }
      });
    }
  }
}

module.exports = new EngagementController();

