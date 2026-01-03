const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * IndependenceDeclaration Model
 * Represents independence declarations by users for specific engagements
 */
const IndependenceDeclaration = sequelize.define('IndependenceDeclaration', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  engagement_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'engagements',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'User declaring independence'
  },
  is_independent: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    comment: 'True if user declares independence, false if conflicts exist'
  },
  declaration_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  conflicts_disclosed: {
    type: DataTypes.TEXT,
    comment: 'Description of any conflicts or relationships that may impair independence'
  },
  safeguards_applied: {
    type: DataTypes.TEXT,
    comment: 'Safeguards or measures taken to address any threats to independence'
  },
  declaration_period_start: {
    type: DataTypes.DATE,
    comment: 'Start date of the period covered by this declaration'
  },
  declaration_period_end: {
    type: DataTypes.DATE,
    comment: 'End date of the period covered by this declaration'
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED', 'REQUIRES_REVIEW'),
    defaultValue: 'PENDING',
    comment: 'Status of the independence declaration'
  },
  reviewed_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Partner/Manager who reviewed the declaration'
  },
  reviewed_at: {
    type: DataTypes.DATE,
    comment: 'Date when the declaration was reviewed'
  },
  reviewer_notes: {
    type: DataTypes.TEXT,
    comment: 'Notes from the reviewer'
  },
  sharepoint_file_url: {
    type: DataTypes.STRING,
    comment: 'URL to the declaration stored in SharePoint juggernaut folder'
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Additional metadata'
  },
  added_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Partner/Manager who added this user to declare independence'
  }
}, {
  tableName: 'independence_declarations',
  timestamps: true,
  underscored: true,
  indexes: [
    { 
      fields: ['engagement_id', 'user_id'],
      comment: 'One declaration per user per engagement (can be updated)'
    },
    { fields: ['user_id'] },
    { fields: ['engagement_id'] },
    { fields: ['status'] },
    { fields: ['is_independent'] },
    { fields: ['declaration_date'] },
    { fields: ['added_by'] }
  ]
});

module.exports = IndependenceDeclaration;

