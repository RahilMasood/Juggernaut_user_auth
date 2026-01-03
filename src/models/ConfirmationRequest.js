const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ConfirmationRequest = sequelize.define('ConfirmationRequest', {
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
  created_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  party_user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'User ID of the client or confirming party'
  },
  party_type: {
    type: DataTypes.ENUM('CLIENT', 'CONFIRMING_PARTY'),
    allowNull: false
  },
  confirmation_type: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Type of confirmation (e.g., bank, accounts_receivable, accounts_payable)'
  },
  description: {
    type: DataTypes.TEXT
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'RESPONDED', 'COMPLETED', 'CANCELLED'),
    defaultValue: 'PENDING'
  },
  due_date: {
    type: DataTypes.DATE
  },
  response: {
    type: DataTypes.TEXT,
    comment: 'Response from client/confirming party'
  },
  response_date: {
    type: DataTypes.DATE
  },
  attachments: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'Array of attachment URLs or metadata'
  },
  notes: {
    type: DataTypes.TEXT,
    comment: 'Internal notes by auditor'
  }
}, {
  tableName: 'confirmation_requests',
  indexes: [
    { fields: ['engagement_id'] },
    { fields: ['party_user_id'] },
    { fields: ['created_by'] },
    { fields: ['status'] },
    { fields: ['party_type'] }
  ]
});

module.exports = ConfirmationRequest;

