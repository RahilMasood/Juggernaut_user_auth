const userService = require('../services/userService');
const logger = require('../utils/logger');
const crypto = require('crypto');

class WebhookController {
  /**
   * Handle payroll sync webhook
   * POST /api/v1/webhooks/payroll-sync
   */
  async handlePayrollSync(req, res, next) {
    try {
      // Verify webhook signature
      const signature = req.headers['x-webhook-signature'];
      const expectedSignature = this.generateWebhookSignature(req.body);

      if (signature !== expectedSignature) {
        logger.warn('Invalid webhook signature received', {
          ip: req.ip,
          signature
        });
        
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid webhook signature'
          }
        });
      }

      const { firm_domain, users } = req.body;

      if (!firm_domain || !users || !Array.isArray(users)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid webhook payload. Required: firm_domain, users (array)'
          }
        });
      }

      // Process payroll sync
      const results = await userService.syncUsersFromPayroll({ users }, firm_domain);

      res.json({
        success: true,
        data: {
          message: 'Payroll sync completed',
          results
        }
      });
    } catch (error) {
      logger.error('Payroll sync webhook error:', error);
      return res.status(400).json({
        success: false,
        error: {
          code: 'SYNC_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * Generate webhook signature for verification
   */
  generateWebhookSignature(payload) {
    const secret = process.env.PAYROLL_WEBHOOK_SECRET;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }
}

module.exports = new WebhookController();

