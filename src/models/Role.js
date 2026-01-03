const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Role = sequelize.define('Role', {
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
    comment: 'Role name (e.g., Partner, Manager, Senior Auditor, Staff)'
  },
  description: {
    type: DataTypes.TEXT
  },
  is_default: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'System default role (cannot be deleted)'
  },
  hierarchy_level: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Higher number = higher authority (Partner=100, Manager=80, Senior=60, Staff=40)'
  }
}, {
  tableName: 'roles',
  indexes: [
    { fields: ['firm_id'] },
    { fields: ['name', 'firm_id'], unique: true },
    { fields: ['is_default'] }
  ]
});

module.exports = Role;

