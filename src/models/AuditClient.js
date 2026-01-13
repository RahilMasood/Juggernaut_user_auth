const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * AuditClient Model
 * Represents audit clients of the firm
 */
const AuditClient = sequelize.define('AuditClient', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  firm_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'firms',
      key: 'id'
    }
  },
  client_name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Name of the audit client (must be unique)'
  },
  client_id: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Auto-generated client identifier based on client_name'
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Active', 'Archived'),
    defaultValue: 'Pending',
    allowNull: false
  }
}, {
  tableName: 'audit_clients',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeCreate: async (auditClient) => {
      // Auto-generate client_id from client_name if not provided
      if (!auditClient.client_id && auditClient.client_name) {
        // Generate a clean ID from client name: remove special chars, replace spaces with underscores, uppercase
        auditClient.client_id = auditClient.client_name
          .toUpperCase()
          .replace(/[^A-Z0-9\s]/g, '') // Remove special characters
          .replace(/\s+/g, '_') // Replace spaces with underscores
          .replace(/_+/g, '_') // Replace multiple underscores with single
          .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
      }
    },
    beforeUpdate: async (auditClient) => {
      // Regenerate client_id if client_name changed
      if (auditClient.changed('client_name') && auditClient.client_name) {
        auditClient.client_id = auditClient.client_name
          .toUpperCase()
          .replace(/[^A-Z0-9\s]/g, '')
          .replace(/\s+/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '');
      }
    }
  },
  indexes: [
    { fields: ['firm_id'] },
    { fields: ['status'] },
    { fields: ['client_name'], unique: true }
  ]
});

module.exports = AuditClient;

