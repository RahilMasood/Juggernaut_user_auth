const { Engagement, Firm } = require('../models');
const logger = require('../utils/logger');

class SharePointConfigController {
  /**
   * Get SharePoint configuration for an engagement
   * GET /api/v1/sharepoint-config/:engagementId
   */
  async getConfig(req, res, next) {
    try {
      const { engagementId } = req.params;
      const userId = req.user.id;

      // Get engagement with firm details
      const engagement = await Engagement.findByPk(engagementId, {
        include: [
          {
            model: require('../models/AuditClient'),
            as: 'auditClient',
            include: [
              {
                model: Firm,
                as: 'firm',
                attributes: ['id', 'tenant_id', 'client_id', 'client_secret', 'site_hostname', 'site_path']
              }
            ]
          }
        ]
      });

      if (!engagement) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Engagement not found'
          }
        });
      }

      // Check if user has access to this engagement
      const { EngagementUser } = require('../models');
      const userAccess = await EngagementUser.findOne({
        where: {
          engagement_id: engagementId,
          user_id: userId
        }
      });

      if (!userAccess) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied to this engagement'
          }
        });
      }

      const firm = engagement.auditClient?.firm;

      if (!firm) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Firm not found for this engagement'
          }
        });
      }

      // Return SharePoint configuration
      const config = {
        tenant_id: firm.tenant_id,
        client_id: firm.client_id,
        client_secret: firm.client_secret,
        site_hostname: firm.site_hostname || engagement.site_hostname,
        site_path: firm.site_path || engagement.site_path,
        doc_library: engagement.doc_library,
        fy_year: engagement.fy_year,
        engagement_name: engagement.engagement_name
      };

      res.json({
        success: true,
        data: config
      });
    } catch (error) {
      logger.error('Error getting SharePoint config:', error);
      next(error);
    }
  }
}

module.exports = new SharePointConfigController();

