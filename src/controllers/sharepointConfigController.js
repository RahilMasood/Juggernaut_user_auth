const { sequelize } = require('../config/database');
const logger = require('../utils/logger');

class SharePointConfigController {
  /**
   * Get SharePoint configuration for an engagement
   * GET /api/v1/sharepoint-config/:engagementId
   * 
   * Flow: engagement_id → engagements.audit_client_id → audit_clients.firm_id → firms (tenant_id, client_id, client_secret, site_hostname, site_path)
   * Also gets: engagements.doc_library, engagements.fy_year
   */
  async getConfig(req, res, next) {
    try {
      const { engagementId } = req.params;

      if (!engagementId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'engagement_id is required'
          }
        });
      }

      // Query to get SharePoint config following the chain:
      // engagement → audit_client → firm
      const query = `
        SELECT 
          e.id as engagement_id,
          e.doc_library,
          e.fy_year,
          f.tenant_id,
          f.client_id,
          f.client_secret,
          f.site_hostname,
          f.site_path
        FROM engagements e
        INNER JOIN audit_clients ac ON e.audit_client_id = ac.id
        INNER JOIN firms f ON ac.firm_id = f.id
        WHERE e.id = :engagementId
      `;

      const [results] = await sequelize.query(query, {
        replacements: { engagementId },
        type: sequelize.QueryTypes.SELECT
      });

      if (!results) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Engagement ${engagementId} not found or does not have associated audit client and firm`
          }
        });
      }

      // Validate all required fields are present
      const requiredFields = ['tenant_id', 'client_id', 'client_secret', 'site_hostname', 'site_path', 'doc_library', 'fy_year'];
      const missingFields = requiredFields.filter(field => !results[field]);

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INCOMPLETE_CONFIG',
            message: `SharePoint configuration incomplete. Missing fields: ${missingFields.join(', ')}`
          }
        });
      }

      // Return configuration
      const config = {
        tenant_id: results.tenant_id,
        client_id: results.client_id,
        client_secret: results.client_secret,
        site_hostname: results.site_hostname,
        site_path: results.site_path,
        doc_library: results.doc_library,
        fy_year: results.fy_year
      };

      logger.info(`SharePoint config loaded for engagement ${engagementId}`);

      res.json({
        success: true,
        data: config
      });
    } catch (error) {
      logger.error('Error loading SharePoint config:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to load SharePoint configuration',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }
      });
    }
  }
}

module.exports = new SharePointConfigController();

