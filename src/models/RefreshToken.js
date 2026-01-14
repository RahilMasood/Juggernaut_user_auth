const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RefreshToken = sequelize.define('RefreshToken', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  token: {
    type: DataTypes.STRING(500),
    allowNull: false,
    unique: true
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  is_revoked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  revoked_at: {
    type: DataTypes.DATE
  },
  ip_address: {
    type: DataTypes.STRING
  },
  user_agent: {
    type: DataTypes.STRING
  }
}, {
  tableName: 'refresh_tokens',
  timestamps: true, // Enable created_at and updated_at (default is true, but explicit for clarity)
  indexes: [
    { fields: ['token'], unique: true },
    { fields: ['user_id'] },
    { fields: ['expires_at'] },
    { fields: ['is_revoked'] },
    { fields: ['updated_at'] } // Index for efficient stale token queries
  ]
});

// Instance method to check if token is valid
RefreshToken.prototype.isValid = function() {
  return !this.is_revoked && this.expires_at > new Date();
};

module.exports = RefreshToken;

