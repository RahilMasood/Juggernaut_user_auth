const { sequelize } = require('../config/database');
const Firm = require('./Firm');
const User = require('./User');
const Role = require('./Role');
const Permission = require('./Permission');
const Engagement = require('./Engagement');
const EngagementUser = require('./EngagementUser');
const ConfirmationRequest = require('./ConfirmationRequest');
const RefreshToken = require('./RefreshToken');
const AuditLog = require('./AuditLog');
const Client = require('./Client');
const IndependenceDeclaration = require('./IndependenceDeclaration');

// Define associations

// Firm associations
Firm.hasMany(User, { foreignKey: 'firm_id', as: 'users' });
Firm.hasMany(Role, { foreignKey: 'firm_id', as: 'roles' });
Firm.hasMany(Engagement, { foreignKey: 'firm_id', as: 'engagements' });

// User associations
User.belongsTo(Firm, { foreignKey: 'firm_id', as: 'firm' });
User.hasMany(RefreshToken, { foreignKey: 'user_id', as: 'refreshTokens' });
User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'auditLogs' });
User.hasMany(Engagement, { foreignKey: 'created_by', as: 'createdEngagements' });
User.hasMany(ConfirmationRequest, { foreignKey: 'created_by', as: 'createdConfirmations' });
User.hasMany(ConfirmationRequest, { foreignKey: 'party_user_id', as: 'receivedConfirmations' });

// Many-to-many: User <-> Role
User.belongsToMany(Role, { 
  through: 'user_roles',
  foreignKey: 'user_id',
  otherKey: 'role_id',
  as: 'roles'
});
Role.belongsToMany(User, {
  through: 'user_roles',
  foreignKey: 'role_id',
  otherKey: 'user_id',
  as: 'users'
});

// Many-to-many: User <-> Permission (custom permissions)
User.belongsToMany(Permission, {
  through: 'user_permissions',
  foreignKey: 'user_id',
  otherKey: 'permission_id',
  as: 'customPermissions'
});
Permission.belongsToMany(User, {
  through: 'user_permissions',
  foreignKey: 'permission_id',
  otherKey: 'user_id',
  as: 'usersWithCustom'
});

// Many-to-many: Role <-> Permission
Role.belongsToMany(Permission, {
  through: 'role_permissions',
  foreignKey: 'role_id',
  otherKey: 'permission_id',
  as: 'permissions'
});
Permission.belongsToMany(Role, {
  through: 'role_permissions',
  foreignKey: 'permission_id',
  otherKey: 'role_id',
  as: 'roles'
});

// Engagement associations
Engagement.belongsTo(Firm, { foreignKey: 'firm_id', as: 'firm' });
Engagement.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Engagement.belongsTo(User, { foreignKey: 'engagement_partner_id', as: 'engagementPartner' });
Engagement.belongsTo(User, { foreignKey: 'engagement_manager_id', as: 'engagementManager' });
Engagement.belongsTo(User, { foreignKey: 'eqr_partner_id', as: 'eqrPartner' });
Engagement.belongsTo(User, { foreignKey: 'concurrent_review_partner_id', as: 'concurrentReviewPartner' });
Engagement.hasMany(ConfirmationRequest, { foreignKey: 'engagement_id', as: 'confirmations' });
Engagement.hasMany(IndependenceDeclaration, { foreignKey: 'engagement_id', as: 'independenceDeclarations' });

// Many-to-many: Engagement <-> User (engagement team)
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

// ConfirmationRequest associations
ConfirmationRequest.belongsTo(Engagement, { foreignKey: 'engagement_id', as: 'engagement' });
ConfirmationRequest.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
ConfirmationRequest.belongsTo(User, { foreignKey: 'party_user_id', as: 'partyUser' });

// RefreshToken associations
RefreshToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// AuditLog associations
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
AuditLog.belongsTo(Firm, { foreignKey: 'firm_id', as: 'firm' });

// Client associations
Client.belongsTo(Firm, { foreignKey: 'firm_id', as: 'firm' });
Client.belongsTo(User, { foreignKey: 'engagement_partner_id', as: 'engagementPartner' });
Client.belongsTo(User, { foreignKey: 'engagement_manager_id', as: 'engagementManager' });
Client.belongsTo(User, { foreignKey: 'eqr_partner_id', as: 'eqrPartner' });
Client.belongsTo(User, { foreignKey: 'concurrent_review_partner_id', as: 'concurrentReviewPartner' });
Client.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// IndependenceDeclaration associations
IndependenceDeclaration.belongsTo(Engagement, { foreignKey: 'engagement_id', as: 'engagement' });
IndependenceDeclaration.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
IndependenceDeclaration.belongsTo(User, { foreignKey: 'added_by', as: 'addedBy' });
IndependenceDeclaration.belongsTo(User, { foreignKey: 'reviewed_by', as: 'reviewer' });

module.exports = {
  sequelize,
  Firm,
  User,
  Role,
  Permission,
  Engagement,
  EngagementUser,
  ConfirmationRequest,
  RefreshToken,
  AuditLog,
  Client,
  IndependenceDeclaration
};

