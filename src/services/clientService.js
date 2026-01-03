const { Client, User, Firm } = require("../models");
const authService = require("./authService");
const policyService = require("./policyService");
const logger = require("../utils/logger");

class ClientService {
  /**
   * Create new client (Client Onboarding Tool)
   * Only users with specific roles (Manager, Partner, etc.) can create clients
   */
  async createClient(clientData, createdBy) {
    try {
      // Check if user has permission to create clients
      const canCreate = await policyService.canCreateEngagement(createdBy);

      if (!canCreate) {
        throw new Error(
          "User does not have permission to create clients. Only Manager, Partner, and above can onboard clients."
        );
      }

      // Get user's firm
      const user = await User.findByPk(createdBy);
      if (!user || user.user_type !== "AUDITOR") {
        throw new Error("Only auditor users can create clients");
      }

      // Validate that partner and manager exist and belong to same firm
      const engagementPartner = await User.findByPk(
        clientData.engagement_partner_id
      );
      const engagementManager = await User.findByPk(
        clientData.engagement_manager_id
      );

      if (!engagementPartner || engagementPartner.firm_id !== user.firm_id) {
        throw new Error(
          "Engagement partner not found or does not belong to the same firm"
        );
      }

      if (!engagementManager || engagementManager.firm_id !== user.firm_id) {
        throw new Error(
          "Engagement manager not found or does not belong to the same firm"
        );
      }

      // Validate optional EQR partner if provided
      if (clientData.eqr_partner_id) {
        const eqrPartner = await User.findByPk(clientData.eqr_partner_id);
        if (!eqrPartner || eqrPartner.firm_id !== user.firm_id) {
          throw new Error(
            "EQR partner not found or does not belong to the same firm"
          );
        }
      }

      // Validate optional concurrent review partner if provided
      if (clientData.concurrent_review_partner_id) {
        const concurrentReviewPartner = await User.findByPk(
          clientData.concurrent_review_partner_id
        );
        if (
          !concurrentReviewPartner ||
          concurrentReviewPartner.firm_id !== user.firm_id
        ) {
          throw new Error(
            "Concurrent review partner not found or does not belong to the same firm"
          );
        }
      }

      // Create client
      const client = await Client.create({
        firm_id: user.firm_id,
        name: clientData.name,
        industry: clientData.industry,
        contact_person: clientData.contact_person,
        contact_email: clientData.contact_email,
        contact_phone: clientData.contact_phone,
        address: clientData.address,
        engagement_partner_id: clientData.engagement_partner_id,
        engagement_manager_id: clientData.engagement_manager_id,
        eqr_partner_id: clientData.eqr_partner_id || null,
        concurrent_review_partner_id:
          clientData.concurrent_review_partner_id || null,
        status: clientData.status || "ACTIVE",
        onboarding_date: clientData.onboarding_date || new Date(),
        metadata: clientData.metadata || {},
        created_by: createdBy,
      });

      // Log client creation
      await authService.logAuditEvent(
        createdBy,
        user.firm_id,
        "CREATE_CLIENT",
        "CLIENT",
        client.id,
        {
          name: client.name,
          engagement_partner_id: client.engagement_partner_id,
          engagement_manager_id: client.engagement_manager_id,
        },
        null,
        null,
        "SUCCESS"
      );

      // Fetch client with associations
      return await this.getClient(client.id, createdBy);
    } catch (error) {
      logger.error("Create client error:", error);
      throw error;
    }
  }

  /**
   * Get client by ID
   */
  async getClient(clientId, userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error("User not found");
      }

      const client = await Client.findOne({
        where: {
          id: clientId,
          firm_id: user.firm_id,
        },
        include: [
          {
            model: User,
            as: "engagementPartner",
            attributes: [
              "id",
              "first_name",
              "last_name",
              "email",
              "designation",
            ],
          },
          {
            model: User,
            as: "engagementManager",
            attributes: [
              "id",
              "first_name",
              "last_name",
              "email",
              "designation",
            ],
          },
          {
            model: User,
            as: "eqrPartner",
            attributes: [
              "id",
              "first_name",
              "last_name",
              "email",
              "designation",
            ],
          },
          {
            model: User,
            as: "concurrentReviewPartner",
            attributes: [
              "id",
              "first_name",
              "last_name",
              "email",
              "designation",
            ],
          },
          {
            model: User,
            as: "creator",
            attributes: ["id", "first_name", "last_name", "email"],
          },
        ],
      });

      if (!client) {
        throw new Error("Client not found");
      }

      return client;
    } catch (error) {
      logger.error("Get client error:", error);
      throw error;
    }
  }

  /**
   * List clients for user's firm
   */
  async listClients(userId, filters = {}) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error("User not found");
      }

      const where = { firm_id: user.firm_id };

      // Apply filters
      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.engagement_partner_id) {
        where.engagement_partner_id = filters.engagement_partner_id;
      }

      if (filters.engagement_manager_id) {
        where.engagement_manager_id = filters.engagement_manager_id;
      }

      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 20;
      const offset = (page - 1) * limit;

      const { count, rows } = await Client.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: "engagementPartner",
            attributes: [
              "id",
              "first_name",
              "last_name",
              "email",
              "designation",
            ],
          },
          {
            model: User,
            as: "engagementManager",
            attributes: [
              "id",
              "first_name",
              "last_name",
              "email",
              "designation",
            ],
          },
        ],
        limit,
        offset,
        order: [["created_at", "DESC"]],
      });

      return {
        clients: rows,
        pagination: {
          total: count,
          page,
          limit,
          pages: Math.ceil(count / limit),
        },
      };
    } catch (error) {
      logger.error("List clients error:", error);
      throw error;
    }
  }

  /**
   * Update client
   */
  async updateClient(clientId, updateData, updatedBy) {
    try {
      const user = await User.findByPk(updatedBy);
      if (!user) {
        throw new Error("User not found");
      }

      const client = await Client.findOne({
        where: {
          id: clientId,
          firm_id: user.firm_id,
        },
      });

      if (!client) {
        throw new Error("Client not found");
      }

      // Check permission
      const canCreate = await policyService.canCreateEngagement(updatedBy);
      if (!canCreate) {
        throw new Error("User does not have permission to update clients");
      }

      // Validate new partner/manager if being updated
      if (updateData.engagement_partner_id) {
        const partner = await User.findByPk(updateData.engagement_partner_id);
        if (!partner || partner.firm_id !== user.firm_id) {
          throw new Error("Invalid engagement partner");
        }
      }

      if (updateData.engagement_manager_id) {
        const manager = await User.findByPk(updateData.engagement_manager_id);
        if (!manager || manager.firm_id !== user.firm_id) {
          throw new Error("Invalid engagement manager");
        }
      }

      const oldData = { ...client.dataValues };
      await client.update(updateData);

      // Log update
      await authService.logAuditEvent(
        updatedBy,
        user.firm_id,
        "UPDATE_CLIENT",
        "CLIENT",
        client.id,
        updateData,
        oldData,
        null,
        "SUCCESS"
      );

      return await this.getClient(clientId, updatedBy);
    } catch (error) {
      logger.error("Update client error:", error);
      throw error;
    }
  }

  /**
   * Get clients where user is engagement partner or manager
   * (Used for Independence Tool access)
   */
  async getClientsForUser(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error("User not found");
      }

      const clients = await Client.findAll({
        where: {
          firm_id: user.firm_id,
          [require("sequelize").Op.or]: [
            { engagement_partner_id: userId },
            { engagement_manager_id: userId },
          ],
        },
        include: [
          {
            model: User,
            as: "engagementPartner",
            attributes: ["id", "first_name", "last_name", "email"],
          },
          {
            model: User,
            as: "engagementManager",
            attributes: ["id", "first_name", "last_name", "email"],
          },
        ],
        order: [["created_at", "DESC"]],
      });

      return clients;
    } catch (error) {
      logger.error("Get clients for user error:", error);
      throw error;
    }
  }
}

module.exports = new ClientService();
