const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Client Model
 * Represents clients of the audit firm (created via Client Onboarding Tool)
 */
const Client = sequelize.define('Client', {
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
    allowNull: false,
    comment: 'Client company name'
  },
  industry: {
    type: DataTypes.STRING,
    comment: 'Industry/sector of the client'
  },
  contact_person: {
    type: DataTypes.STRING,
    comment: 'Primary contact person at client'
  },
  contact_email: {
    type: DataTypes.STRING,
    validate: {
      isEmail: true
    }
  },
  contact_phone: {
    type: DataTypes.STRING
  },
  address: {
    type: DataTypes.TEXT
  },
  engagement_partner_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Designated engagement partner'
  },
  engagement_manager_id: {
    type: DataTypes.UUID,
    allowNull: false,
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
    comment: 'Engagement Quality Review partner (if applicable based on firm policy)'
  },
  concurrent_review_partner_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Concurrent review partner (if applicable based on firm policy)'
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED'),
    defaultValue: 'ACTIVE'
  },
  onboarding_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Additional client metadata'
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'clients',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['firm_id'] },
    { fields: ['engagement_partner_id'] },
    { fields: ['engagement_manager_id'] },
    { fields: ['status'] },
    { fields: ['name'] },
    { fields: ['created_by'] }
  ]
});

module.exports = Client;

