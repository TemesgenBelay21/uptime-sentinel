const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

module.exports = sequelize.define('AlertLog', {
  _id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  site: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: 'monitored_sites', key: '_id' },
    onDelete: 'CASCADE',
  },
  type: { type: DataTypes.ENUM('down', 'recovered'), allowNull: false },
  sentAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  emailedTo: { type: DataTypes.STRING(254), allowNull: false },
}, {
  tableName: 'alert_logs',
  timestamps: false,
  indexes: [{ fields: ['site', 'sentAt'] }],
});
