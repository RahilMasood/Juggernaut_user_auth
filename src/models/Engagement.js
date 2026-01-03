const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Engagement = sequelize.define('Engagement', {
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
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  client_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  end_date: {
    type: DataTypes.DATE
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'COMPLETED', 'ARCHIVED'),
    defaultValue: 'ACTIVE'
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  engagement_partner_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Designated engagement partner'
  },
  engagement_manager_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Designated engagement manager'
  },
  eqr_partner_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Engagement Quality Review partner (if applicable)'
  },
  concurrent_review_partner_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Concurrent review partner (if applicable)'
  }
}, {
  tableName: 'engagements',
  indexes: [
    { fields: ['firm_id'] },
    { fields: ['status'] },
    { fields: ['created_by'] },
    { fields: ['start_date'] },
    { fields: ['client_name'] },
    { fields: ['engagement_partner_id'] },
    { fields: ['engagement_manager_id'] }
  ]
});

module.exports = Engagement;

