const User = require('./User');
const RefreshToken = require('./RefreshToken');
const AuditLog = require('./AuditLog');

// Define associations
RefreshToken.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });
User.hasMany(RefreshToken, { foreignKey: 'userId', onDelete: 'CASCADE' });

AuditLog.belongsTo(User, { foreignKey: 'userId', onDelete: 'SET NULL' });
User.hasMany(AuditLog, { foreignKey: 'userId' });

module.exports = {
  User,
  RefreshToken,
  AuditLog,
};

