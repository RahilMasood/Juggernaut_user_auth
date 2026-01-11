const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Engagement Model
 * Represents audit engagements for a client
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
    }
  },
  status: {
    type: DataTypes.ENUM('Active', 'Archived'),
    defaultValue: 'Active',
    allowNull: false
  },
  is_default: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  engagement_name: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Name of the engagement (e.g., Test10_FY26)'
  }
}, {
  tableName: 'engagements',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['audit_client_id'] },
    { fields: ['status'] },
    { fields: ['is_default'] }
  ]
});

module.exports = Engagement;

