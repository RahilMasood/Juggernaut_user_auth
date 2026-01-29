const { sequelize } = require('../config/database');
const bcrypt = require('bcrypt');
const authConfig = require('../config/auth');
const logger = require('../utils/logger');

class ExternalUserService {
  /**
   * Search external user by email
   * @param {string} email - Email address to search for
   * @returns {Promise<Object|null>} External user object or null if not found
   */
  async findByEmail(email) {
    try {
      const query = `
        SELECT id, email, name, designation, organization, password_hash, confirmation_client, confirmation_party, created_at, updated_at
        FROM external_users
        WHERE email = :email
        LIMIT 1
      `;
      
      const [results] = await sequelize.query(query, {
        replacements: { email },
        type: sequelize.QueryTypes.SELECT
      });
      
      return results || null;
    } catch (error) {
      logger.error('Error finding external user by email:', error);
      throw error;
    }
  }

  /**
   * Create a new external user
   * @param {Object} userData - User data (email, name, designation)
   * @returns {Promise<Object>} Created user object
   */
  async createUser(userData) {
    try {
      const { email, name, designation, organization } = userData;
      
      // Check if user already exists
      const existingUser = await this.findByEmail(email);
      if (existingUser) {
        throw new Error('External user with this email already exists');
      }

      // Hash password (hardcoded Test@1234 for now)
      const password = 'Test@1234';
      const password_hash = await bcrypt.hash(password, authConfig.bcrypt.rounds);

      // Insert new user with UUID generation
      const insertQuery = `
        INSERT INTO external_users (id, email, name, designation, organization, password_hash, confirmation_client, confirmation_party, created_at, updated_at)
        VALUES (gen_random_uuid(), :email, :name, :designation, :organization, :password_hash, ARRAY[]::TEXT[], ARRAY[]::TEXT[], CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id, email, name, designation, organization, confirmation_client, confirmation_party, created_at, updated_at
      `;
      
      const [results] = await sequelize.query(insertQuery, {
        replacements: {
          email,
          name,
          designation: designation || null,
          organization: organization || null,
          password_hash
        },
        type: sequelize.QueryTypes.INSERT
      });
      
      // Fetch the created user
      const createdUser = await this.findByEmail(email);
      
      logger.info(`Created external user: ${email}`);
      return createdUser;
    } catch (error) {
      logger.error('Error creating external user:', error);
      throw error;
    }
  }

  /**
   * Update external user
   * @param {string} email - Email of user to update
   * @param {Object} updateData - Data to update (name, designation)
   * @returns {Promise<Object>} Updated user object
   */
  async updateUser(email, updateData) {
    try {
      const { name, designation, organization } = updateData;
      
      const updateQuery = `
        UPDATE external_users
        SET name = COALESCE(:name, name),
            designation = COALESCE(:designation, designation),
            organization = COALESCE(:organization, organization),
            updated_at = CURRENT_TIMESTAMP
        WHERE email = :email
        RETURNING id, email, name, designation, organization, confirmation_client, confirmation_party, created_at, updated_at
      `;
      
      await sequelize.query(updateQuery, {
        replacements: {
          email,
          name: name || null,
          designation: designation || null,
          organization: organization || null
        },
        type: sequelize.QueryTypes.UPDATE
      });
      
      const updatedUser = await this.findByEmail(email);
      logger.info(`Updated external user: ${email}`);
      return updatedUser;
    } catch (error) {
      logger.error('Error updating external user:', error);
      throw error;
    }
  }

  /**
   * Add engagement_id to confirmation_client array
   * @param {string} email - Email of user
   * @param {string} engagementId - Engagement ID to add
   * @returns {Promise<Object>} Updated user object
   */
  async addEngagementToClient(email, engagementId) {
    try {
      if (!email || !engagementId) {
        throw new Error('Email and engagementId are required');
      }

      // Get current confirmation_client array
      const user = await this.findByEmail(email);
      if (!user) {
        throw new Error('External user not found');
      }

      // Append engagement_id to array using PostgreSQL array_append function
      // Only append if engagement_id doesn't already exist in the array
      const updateQuery = `
        UPDATE external_users
        SET confirmation_client = CASE 
            WHEN :engagementId = ANY(COALESCE(confirmation_client, ARRAY[]::TEXT[])) 
            THEN confirmation_client
            ELSE array_append(COALESCE(confirmation_client, ARRAY[]::TEXT[]), :engagementId)
          END,
            updated_at = CURRENT_TIMESTAMP
        WHERE email = :email
        RETURNING id, email, name, designation, confirmation_client, created_at, updated_at
      `;
      
      await sequelize.query(updateQuery, {
        replacements: {
          email,
          engagementId
        },
        type: sequelize.QueryTypes.UPDATE
      });
      
      const updatedUser = await this.findByEmail(email);
      logger.info(`Added engagement ${engagementId} to confirmation_client for user ${email}`);
      return updatedUser;
    } catch (error) {
      logger.error('Error adding engagement to client:', error);
      throw error;
    }
  }

  /**
   * Add engagement_id to confirmation_party array
   * @param {string} email - Email of user
   * @param {string} engagementId - Engagement ID to add
   * @returns {Promise<Object>} Updated user object
   */
  async addEngagementToParty(email, engagementId) {
    try {
      if (!email || !engagementId) {
        throw new Error('Email and engagementId are required');
      }

      // Get current confirmation_party array
      const user = await this.findByEmail(email);
      if (!user) {
        throw new Error('External user not found');
      }

      // Append engagement_id to array using PostgreSQL array_append function
      // Only append if engagement_id doesn't already exist in the array
      const updateQuery = `
        UPDATE external_users
        SET confirmation_party = CASE 
            WHEN :engagementId = ANY(COALESCE(confirmation_party, ARRAY[]::TEXT[])) 
            THEN confirmation_party
            ELSE array_append(COALESCE(confirmation_party, ARRAY[]::TEXT[]), :engagementId)
          END,
            updated_at = CURRENT_TIMESTAMP
        WHERE email = :email
        RETURNING id, email, name, designation, organization, confirmation_client, confirmation_party, created_at, updated_at
      `;
      
      await sequelize.query(updateQuery, {
        replacements: {
          email,
          engagementId
        },
        type: sequelize.QueryTypes.UPDATE
      });
      
      const updatedUser = await this.findByEmail(email);
      logger.info(`Added engagement ${engagementId} to confirmation_party for user ${email}`);
      return updatedUser;
    } catch (error) {
      logger.error('Error adding engagement to party:', error);
      throw error;
    }
  }
}

module.exports = new ExternalUserService();

