const independenceService = require('../services/independenceService');
const logger = require('../utils/logger');

class IndependenceController {
  /**
   * Add user to declare independence for an engagement
   */
  async addUserForDeclaration(req, res, next) {
    try {
      const declaration = await independenceService.addUserForDeclaration(
        req.params.engagementId,
        req.body.user_id,
        req.user.id
      );

      res.status(201).json({
        success: true,
        data: { declaration },
        message: 'User added to declare independence. They can now submit their declaration.'
      });
    } catch (error) {
      logger.error('Add user for declaration controller error:', error);
      next(error);
    }
  }

  /**
   * Submit independence declaration
   */
  async submitDeclaration(req, res, next) {
    try {
      const declaration = await independenceService.submitDeclaration(
        req.params.id,
        req.body,
        req.user.id
      );

      res.json({
        success: true,
        data: { declaration },
        message: 'Independence declaration submitted successfully'
      });
    } catch (error) {
      logger.error('Submit declaration controller error:', error);
      next(error);
    }
  }

  /**
   * Get specific declaration
   */
  async getDeclaration(req, res, next) {
    try {
      const declaration = await independenceService.getDeclaration(
        req.params.id,
        req.user.id
      );

      res.json({
        success: true,
        data: { declaration }
      });
    } catch (error) {
      logger.error('Get declaration controller error:', error);
      next(error);
    }
  }

  /**
   * List my declarations (for users)
   */
  async listMyDeclarations(req, res, next) {
    try {
      const declarations = await independenceService.listMyDeclarations(
        req.user.id,
        req.query
      );

      res.json({
        success: true,
        data: { declarations }
      });
    } catch (error) {
      logger.error('List my declarations controller error:', error);
      next(error);
    }
  }

  /**
   * List declarations for an engagement (for partners/managers)
   */
  async listEngagementDeclarations(req, res, next) {
    try {
      const declarations = await independenceService.listEngagementDeclarations(
        req.params.engagementId,
        req.user.id
      );

      res.json({
        success: true,
        data: { declarations }
      });
    } catch (error) {
      logger.error('List engagement declarations controller error:', error);
      next(error);
    }
  }

  /**
   * Review declaration (for partners/managers)
   */
  async reviewDeclaration(req, res, next) {
    try {
      const declaration = await independenceService.reviewDeclaration(
        req.params.id,
        req.body,
        req.user.id
      );

      res.json({
        success: true,
        data: { declaration },
        message: 'Declaration reviewed successfully'
      });
    } catch (error) {
      logger.error('Review declaration controller error:', error);
      next(error);
    }
  }

  /**
   * Get engagements where user is partner or manager
   */
  async getMyEngagements(req, res, next) {
    try {
      const engagements = await independenceService.getEngagementsForUser(req.user.id);

      res.json({
        success: true,
        data: { engagements }
      });
    } catch (error) {
      logger.error('Get my engagements controller error:', error);
      next(error);
    }
  }
}

module.exports = new IndependenceController();

