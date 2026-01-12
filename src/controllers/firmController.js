const { Firm } = require('../models');
const logger = require('../utils/logger');

class FirmController {
  /**
   * Get firm details for current user
   * GET /api/v1/firms/me
   * Returns firm configuration including SharePoint settings
   */
  async getMyFirm(req, res, next) {
    try {
      const userId = req.user.id;
      const firmId = req.user.firm_id;

      if (!firmId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'User does not have a firm assigned'
          }
        });
      }

      const firm = await Firm.findByPk(firmId, {
        attributes: [
          'id',
          'tenant_id',
          'client_id',
          'client_secret',
          'site_hostname',
          'site_path'
        ],
        raw: false // Keep as instance so we can access get() method
      });

      if (!firm) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Firm not found'
          }
        });
      }

      // Get raw data including client_secret (bypass toJSON which removes it)
      const firmData = firm.get({ plain: true });

      res.json({
        success: true,
        data: { firm: firmData }
      });
    } catch (error) {
      logger.error('Get firm error:', error);
      next(error);
    }
  }
}

module.exports = new FirmController();

