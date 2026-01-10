const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcrypt');
const authConfig = require('../config/auth');

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
  }
}, {
  tableName: 'firms',
  indexes: [
    { fields: ['tenant_id'], unique: true },
    { fields: ['admin_id'], unique: true }
  ],
  hooks: {
    beforeCreate: async (firm) => {
      if (firm.admin_password && !firm.admin_password.startsWith('$2')) {
        firm.admin_password = await bcrypt.hash(firm.admin_password, authConfig.bcrypt.rounds);
      }
    },
    beforeUpdate: async (firm) => {
      if (firm.changed('admin_password') && !firm.admin_password.startsWith('$2')) {
        firm.admin_password = await bcrypt.hash(firm.admin_password, authConfig.bcrypt.rounds);
      }
    }
  }
});

// Instance methods
Firm.prototype.compareAdminPassword = async function(password) {
  return bcrypt.compare(password, this.admin_password);
};

Firm.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.admin_password;
  delete values.client_secret;
  return values;
};

module.exports = Firm;

