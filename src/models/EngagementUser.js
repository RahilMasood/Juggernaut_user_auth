const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * EngagementUser Model (Junction table for Engagement-User many-to-many)
 * Represents a user's membership in an engagement team with their role
 */
const EngagementUser = sequelize.define('EngagementUser', {
  engagement_id: {
    type: DataTypes.UUID,
    primaryKey: true,
    references: {
      model: 'engagements',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.UUID,
    primaryKey: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  role: {
    type: DataTypes.ENUM('LEAD', 'MEMBER', 'VIEWER'),
    allowNull: false,
    defaultValue: 'MEMBER',
    comment: 'User role in this engagement'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'engagement_users',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['engagement_id', 'user_id'],
      unique: true
    }
  ]
});

module.exports = EngagementUser;


