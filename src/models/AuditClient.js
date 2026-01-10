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
    comment: 'Name of the audit client'
  },
  status: {
    type: DataTypes.ENUM('Active', 'Archived'),
    defaultValue: 'Active',
    allowNull: false
  }
}, {
  tableName: 'audit_clients',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['firm_id'] },
    { fields: ['status'] },
    { fields: ['client_name'] }
  ]
});

module.exports = AuditClient;

