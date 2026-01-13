const clientOnboardingService = require('../services/clientOnboardingService');

class ClientOnboardingController {
  /**
   * Create Audit Client with default engagement
   * POST /api/v1/admin/clients
   */
  async createClient(req, res, next) {
    try {
      // Support both admin (req.firm) and regular user (req.user) authentication
      const firmId = req.firm ? req.firm.id : req.user.firm_id;
      const clientData = req.body;

      const client = await clientOnboardingService.createClient(firmId, clientData);

      res.status(201).json({
        success: true,
        data: { 
          client: {
            id: client.id,
            firm_id: client.firm_id,
            client_name: client.client_name,
            status: client.status,
            engagements: client.engagements
          },
          message: 'Client created successfully with default engagement'
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
   * List Audit Clients
   * GET /api/v1/admin/clients
   */
  async listClients(req, res, next) {
    try {
      // Support both admin (req.firm) and regular user (req.user) authentication
      const firmId = req.firm ? req.firm.id : req.user.firm_id;
      const clients = await clientOnboardingService.listClients(firmId);

      res.json({
        success: true,
        data: { clients }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Audit Client by ID
   * GET /api/v1/admin/clients/:id
   */
  async getClient(req, res, next) {
    try {
      const { id } = req.params;
      // Support both admin (req.firm) and regular user (req.user) authentication
      const firmId = req.firm ? req.firm.id : req.user.firm_id;

      const client = await clientOnboardingService.getClientById(id, firmId);

      res.json({
        success: true,
        data: { client }
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
   * Approve Audit Client (change status from Pending to Active)
   * PATCH /api/v1/admin/clients/:id/approve
   */
  async approveClient(req, res, next) {
    try {
      const { id } = req.params;
      const firmId = req.firm ? req.firm.id : req.user.firm_id;

      const client = await clientOnboardingService.approveClient(id, firmId);

      res.json({
        success: true,
        data: { 
          client,
          message: 'Client approved successfully'
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

module.exports = new ClientOnboardingController();

