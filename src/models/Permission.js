const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Permission = sequelize.define('Permission', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Permission identifier (e.g., create_engagement, access_confirmation_tool)'
  },
  description: {
    type: DataTypes.TEXT
  },
  category: {
    type: DataTypes.STRING,
    comment: 'Permission category (e.g., engagement, tool, admin)'
  }
}, {
  tableName: 'permissions',
  indexes: [
    { fields: ['name'], unique: true },
    { fields: ['category'] }
  ]
});

module.exports = Permission;

