const clientService = require('../services/clientService');
const logger = require('../utils/logger');

class ClientController {
  /**
   * Create new client
   */
  async createClient(req, res, next) {
    try {
      const client = await clientService.createClient(req.body, req.user.id);

      res.status(201).json({
        success: true,
        data: { client }
      });
    } catch (error) {
      logger.error('Create client controller error:', error);
      next(error);
    }
  }

  /**
   * Get client by ID
   */
  async getClient(req, res, next) {
    try {
      const client = await clientService.getClient(req.params.id, req.user.id);

      res.json({
        success: true,
        data: { client }
      });
    } catch (error) {
      logger.error('Get client controller error:', error);
      next(error);
    }
  }

  /**
   * List clients
   */
  async listClients(req, res, next) {
    try {
      const result = await clientService.listClients(req.user.id, req.query);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('List clients controller error:', error);
      next(error);
    }
  }

  /**
   * Update client
   */
  async updateClient(req, res, next) {
    try {
      const client = await clientService.updateClient(
        req.params.id,
        req.body,
        req.user.id
      );

      res.json({
        success: true,
        data: { client }
      });
    } catch (error) {
      logger.error('Update client controller error:', error);
      next(error);
    }
  }

  /**
   * Get clients where user is partner or manager
   */
  async getMyClients(req, res, next) {
    try {
      const clients = await clientService.getClientsForUser(req.user.id);

      res.json({
        success: true,
        data: { clients }
      });
    } catch (error) {
      logger.error('Get my clients controller error:', error);
      next(error);
    }
  }
}

module.exports = new ClientController();

