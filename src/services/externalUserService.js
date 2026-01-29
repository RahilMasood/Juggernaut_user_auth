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
        SELECT id, email, name, designation, password_hash, created_at, updated_at
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
      const { email, name, designation } = userData;
      
      // Check if user already exists
      const existingUser = await this.findByEmail(email);
      if (existingUser) {
        throw new Error('External user with this email already exists');
      }

      // Hash password (hardcoded Test@1234 for now)
      const password = 'Test@1234';
      const password_hash = await bcrypt.hash(password, authConfig.bcrypt.rounds);

      // Insert new user
      const insertQuery = `
        INSERT INTO external_users (email, name, designation, password_hash, created_at, updated_at)
        VALUES (:email, :name, :designation, :password_hash, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id, email, name, designation, created_at, updated_at
      `;
      
      const [results] = await sequelize.query(insertQuery, {
        replacements: {
          email,
          name,
          designation: designation || '',
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
      const { name, designation } = updateData;
      
      const updateQuery = `
        UPDATE external_users
        SET name = COALESCE(:name, name),
            designation = COALESCE(:designation, designation),
            updated_at = CURRENT_TIMESTAMP
        WHERE email = :email
        RETURNING id, email, name, designation, created_at, updated_at
      `;
      
      await sequelize.query(updateQuery, {
        replacements: {
          email,
          name: name || null,
          designation: designation || null
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
}

module.exports = new ExternalUserService();

