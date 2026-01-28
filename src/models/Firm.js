const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Firm Model
 * Represents an audit firm
 */
const Firm = sequelize.define('Firm', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  tenant_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Tenant identifier for the firm'
  },
  client_id: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Client ID for external integrations'
  },
  client_secret: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Client secret for external integrations'
  },
  admin_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Admin login ID for the firm'
  },
  admin_password: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Hashed admin password'
  },
  site_hostname: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Site hostname (e.g., juggernautenterprises.sharepoint.com)'
  },
  site_path: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Site path (e.g., /sites/TestCloud)'
  },
  confirmation_no: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    comment: 'Maximum number of users allowed for confirmation tool (0 or -1 means tool not available)'
  },
  sampling_no: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    comment: 'Maximum number of users allowed for sampling tool (0 or -1 means tool not available)'
  },
  client_onboard_no: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    comment: 'Maximum number of users allowed for client onboarding tool (0 or -1 means tool not available)'
  },
  no_users: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    comment: 'Maximum number of users allowed for the firm'
  }
}, {
  tableName: 'firms',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['tenant_id'], unique: true },
    { fields: ['admin_id'], unique: true }
  ]
});

module.exports = Firm;

