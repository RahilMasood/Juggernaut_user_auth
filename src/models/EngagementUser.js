const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * EngagementUser Model (Junction table for Engagement-User many-to-many)
 * Represents a user's membership in an engagement team with their engagement-specific role
 */
const EngagementUser = sequelize.define('EngagementUser', {
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
    }
  },
  role: {
    type: DataTypes.ENUM(
      'engagement_partner',
      'eqr_partner',
      'engagement_manager',
      'eqr_manager',
      'associate',
      'article'
    ),
    allowNull: false,
    comment: 'Engagement-specific role for this user'
  }
}, {
  tableName: 'engagement_users',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['engagement_id', 'user_id'],
      unique: true
    },
    { fields: ['engagement_id'] },
    { fields: ['user_id'] },
    { fields: ['role'] }
  ]
});

module.exports = EngagementUser;


