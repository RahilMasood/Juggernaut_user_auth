const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcrypt');
const authConfig = require('../config/auth');

const User = sequelize.define('User', {
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
  user_name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'User display name'
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('partner', 'manager', 'associate', 'article'),
    allowNull: false,
    comment: 'Organizational seniority level'
  },
  payroll_id: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'External ID from payroll system for user replacement'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  must_change_password: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Force password change on next login'
  },
  failed_login_attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  locked_until: {
    type: DataTypes.DATE,
    comment: 'Account locked until this timestamp'
  },
  last_login: {
    type: DataTypes.DATE
  },
  password_changed_at: {
    type: DataTypes.DATE
  },
  allowed_tools: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: null,
    comment: 'Array of tools user has access to: ["main", "confirmation", "sampling", "clientonboard"]'
  }
}, {
  tableName: 'users',
  indexes: [
    { fields: ['email'], unique: true },
    { fields: ['firm_id'] },
    { fields: ['type'] },
    { fields: ['payroll_id'] },
    { fields: ['is_active'] }
  ],
  hooks: {
    beforeCreate: async (user) => {
      if (user.password_hash && !user.password_hash.startsWith('$2')) {
        user.password_hash = await bcrypt.hash(user.password_hash, authConfig.bcrypt.rounds);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password_hash') && !user.password_hash.startsWith('$2')) {
        user.password_hash = await bcrypt.hash(user.password_hash, authConfig.bcrypt.rounds);
        user.password_changed_at = new Date();
      }
    }
  }
});

// Instance methods
User.prototype.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password_hash);
};

User.prototype.isLocked = function() {
  return this.locked_until && this.locked_until > new Date();
};

User.prototype.incrementFailedLogins = async function() {
  this.failed_login_attempts += 1;
  
  if (this.failed_login_attempts >= authConfig.security.maxLoginAttempts) {
    this.locked_until = new Date(Date.now() + authConfig.security.lockoutDuration);
  }
  
  await this.save();
};

User.prototype.resetFailedLogins = async function() {
  this.failed_login_attempts = 0;
  this.locked_until = null;
  this.last_login = new Date();
  await this.save();
};

User.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password_hash;
  delete values.failed_login_attempts;
  delete values.locked_until;
  return values;
};

module.exports = User;

