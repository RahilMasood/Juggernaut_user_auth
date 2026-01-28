const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Engagement Model
 * Represents an audit engagement
 */
const Engagement = sequelize.define('Engagement', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  audit_client_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'audit_clients',
      key: 'id'
    },
    comment: 'Reference to the audit client'
  },
  engagement_name: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Name of the engagement (e.g., Test10_FY26)'
  },
  status: {
    type: DataTypes.ENUM('Active', 'Archived'),
    defaultValue: 'Active',
    allowNull: false,
    comment: 'Status of the engagement'
  },
  is_default: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    comment: 'Whether this is the default engagement for the client'
  },
  doc_library: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Document library name for SharePoint'
  },
  fy_year: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Fiscal year identifier (e.g., Test15_FY25)'
  }
}, {
  tableName: 'engagements',
  timestamps: true,
  underscored: true,
  // Sequelize will ignore extra fields not in the model definition
  // This allows backward compatibility with code that might try to set old fields
  indexes: [
    { fields: ['audit_client_id'] },
    { fields: ['status'] },
    { fields: ['is_default'] }
  ]
});

module.exports = Engagement;

