const confirmationService = require('../services/confirmationService');

class ConfirmationController {
  /**
   * Create confirmation request
   * POST /api/v1/engagements/:id/confirmations
   */
  async createConfirmation(req, res, next) {
    try {
      const { id: engagementId } = req.params;
      const confirmationData = req.body;
      const createdBy = req.user.id;

      const result = await confirmationService.createConfirmation(
        engagementId, 
        confirmationData, 
        createdBy
      );

      res.status(201).json({
        success: true,
        data: result
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
   * Get confirmation by ID
   * GET /api/v1/confirmations/:id
   */
  async getConfirmation(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const confirmation = await confirmationService.getConfirmation(id, userId);

      res.json({
        success: true,
        data: { confirmation }
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
   * List confirmations for engagement
   * GET /api/v1/engagements/:id/confirmations
   */
  async listEngagementConfirmations(req, res, next) {
    try {
      const { id: engagementId } = req.params;
      const userId = req.user.id;

      const filters = {
        status: req.query.status,
        party_type: req.query.party_type
      };

      const confirmations = await confirmationService.listConfirmationsForEngagement(
        engagementId, 
        userId, 
        filters
      );

      res.json({
        success: true,
        data: { confirmations }
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
   * List confirmations for logged-in party user
   * GET /api/v1/confirmations/my-confirmations
   */
  async listMyConfirmations(req, res, next) {
    try {
      const userId = req.user.id;

      const confirmations = await confirmationService.listConfirmationsForParty(userId);

      res.json({
        success: true,
        data: { confirmations }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update confirmation (auditor only)
   * PATCH /api/v1/confirmations/:id
   */
  async updateConfirmation(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedBy = req.user.id;

      const confirmation = await confirmationService.updateConfirmation(
        id, 
        updateData, 
        updatedBy
      );

      res.json({
        success: true,
        data: { confirmation }
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
   * Respond to confirmation (client/confirming party)
   * POST /api/v1/confirmations/:id/respond
   */
  async respondToConfirmation(req, res, next) {
    try {
      const { id } = req.params;
      const responseData = req.body;
      const respondedBy = req.user.id;

      const confirmation = await confirmationService.respondToConfirmation(
        id, 
        responseData, 
        respondedBy
      );

      res.json({
        success: true,
        data: { 
          confirmation,
          message: 'Response submitted successfully'
        }
      });
    } catch (error) {
      return res.status(error.message.includes('Only the assigned') ? 403 : 400).json({
        success: false,
        error: {
          code: error.message.includes('Only the assigned') ? 'FORBIDDEN' : 'VALIDATION_ERROR',
          message: error.message
        }
      });
    }
  }
}

module.exports = new ConfirmationController();

