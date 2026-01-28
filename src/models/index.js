const { sequelize } = require('../config/database');
const Firm = require('./Firm');
const User = require('./User');
const AuditClient = require('./AuditClient');
const Engagement = require('./Engagement');
const EngagementUser = require('./EngagementUser');
const ExternalUser = require('./ExternalUser');
const RefreshToken = require('./RefreshToken');
const AuditLog = require('./AuditLog');

// Define associations

// Firm associations
Firm.hasMany(User, { foreignKey: 'firm_id', as: 'users' });
Firm.hasMany(AuditClient, { foreignKey: 'firm_id', as: 'auditClients' });

// User associations
User.belongsTo(Firm, { foreignKey: 'firm_id', as: 'firm' });
User.hasMany(RefreshToken, { foreignKey: 'user_id', as: 'refreshTokens' });
User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'auditLogs' });

// AuditClient associations
AuditClient.belongsTo(Firm, { foreignKey: 'firm_id', as: 'firm' });
AuditClient.hasMany(Engagement, { foreignKey: 'audit_client_id', as: 'engagements' });

// Engagement associations
Engagement.belongsTo(AuditClient, { foreignKey: 'audit_client_id', as: 'auditClient' });
Engagement.hasMany(ExternalUser, { foreignKey: 'engagement_id', as: 'externalUsers' });

// Many-to-many: Engagement <-> User (engagement team with roles)
Engagement.belongsToMany(User, {
  through: EngagementUser,
  foreignKey: 'engagement_id',
  otherKey: 'user_id',
  as: 'teamMembers'
});
User.belongsToMany(Engagement, {
  through: EngagementUser,
  foreignKey: 'user_id',
  otherKey: 'engagement_id',
  as: 'engagements'
});

// EngagementUser associations
EngagementUser.belongsTo(Engagement, { foreignKey: 'engagement_id', as: 'engagement' });
EngagementUser.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ExternalUser associations
ExternalUser.belongsTo(Engagement, { foreignKey: 'engagement_id', as: 'engagement' });

// RefreshToken associations
RefreshToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// AuditLog associations
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
AuditLog.belongsTo(Firm, { foreignKey: 'firm_id', as: 'firm' });

module.exports = {
  sequelize,
  Firm,
  User,
  AuditClient,
  Engagement,
  EngagementUser,
  ExternalUser,
  RefreshToken,
  AuditLog
};

