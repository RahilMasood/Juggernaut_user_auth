const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  firm_id: {
    type: DataTypes.UUID,
    references: {
      model: 'firms',
      key: 'id'
    }
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Action performed (e.g., LOGIN, CREATE_ENGAGEMENT, DELETE_USER)'
  },
  resource_type: {
    type: DataTypes.STRING,
    comment: 'Type of resource affected (e.g., USER, ENGAGEMENT, CONFIRMATION)'
  },
  resource_id: {
    type: DataTypes.UUID,
    comment: 'ID of the affected resource'
  },
  details: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Additional details about the action'
  },
  ip_address: {
    type: DataTypes.STRING
  },
  user_agent: {
    type: DataTypes.STRING
  },
  status: {
    type: DataTypes.ENUM('SUCCESS', 'FAILURE'),
    defaultValue: 'SUCCESS'
  },
  error_message: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'audit_logs',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['firm_id'] },
    { fields: ['action'] },
    { fields: ['resource_type', 'resource_id'] },
    { fields: ['created_at'] },
    { fields: ['status'] }
  ],
  updatedAt: false // Audit logs should never be updated
});

module.exports = AuditLog;

