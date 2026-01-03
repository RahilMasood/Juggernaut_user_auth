const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Firm = sequelize.define('Firm', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  domain: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Firm domain for payroll integration'
  },
  settings: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Firm-specific settings and policies'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'firms',
  indexes: [
    { fields: ['domain'], unique: true },
    { fields: ['is_active'] }
  ]
});

module.exports = Firm;

