const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcrypt');
const authConfig = require('../config/auth');

/**
 * ExternalUser Model
 * Represents external users (clients and confirming parties) for engagements
 * Same user can be client or confirming party for different engagements
 */
const ExternalUser = sequelize.define('ExternalUser', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  designation: {
    type: DataTypes.STRING,
    allowNull: true
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Password hash for external user login'
  },
  engagement_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'engagements',
      key: 'id'
    },
    comment: 'Engagement this user is associated with'
  },
  confirmation_client: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    comment: 'True if user is a client for this engagement'
  },
  confirmation_party: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    comment: 'True if user is a confirming party for this engagement'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'external_users',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['email'] },
    { fields: ['engagement_id'] },
    { 
      fields: ['email', 'engagement_id'],
      unique: true,
      name: 'unique_email_engagement'
    },
    { fields: ['confirmation_client'] },
    { fields: ['confirmation_party'] }
  ],
  hooks: {
    beforeCreate: async (externalUser) => {
      if (externalUser.password_hash && !externalUser.password_hash.startsWith('$2')) {
        externalUser.password_hash = await bcrypt.hash(externalUser.password_hash, authConfig.bcrypt.rounds);
      }
    },
    beforeUpdate: async (externalUser) => {
      if (externalUser.changed('password_hash') && !externalUser.password_hash.startsWith('$2')) {
        externalUser.password_hash = await bcrypt.hash(externalUser.password_hash, authConfig.bcrypt.rounds);
      }
    }
  }
});

// Instance methods
ExternalUser.prototype.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password_hash);
};

ExternalUser.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password_hash;
  return values;
};

module.exports = ExternalUser;

