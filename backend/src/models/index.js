const User = require('./User');
const MonitoredSite = require('./MonitoredSite');
const Check = require('./Check');
const AlertLog = require('./AlertLog');

User.hasMany(MonitoredSite, { foreignKey: 'owner', onDelete: 'CASCADE' });
MonitoredSite.belongsTo(User, { foreignKey: 'owner' });
MonitoredSite.hasMany(Check, { foreignKey: 'site', onDelete: 'CASCADE' });
MonitoredSite.hasMany(AlertLog, { foreignKey: 'site', onDelete: 'CASCADE' });

module.exports = { User, MonitoredSite, Check, AlertLog };