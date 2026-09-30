const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

module.exports = sequelize.define('Check', {
  _id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  site: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: 'monitored_sites', key: '_id' },
    onDelete: 'CASCADE',
  },
  timestamp: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  statusCode: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: true, defaultValue: null },
  responseTimeMs: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, defaultValue: null },
  isUp: { type: DataTypes.BOOLEAN, allowNull: false },
  errorMessage: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
}, {
  tableName: 'checks',
  timestamps: false,
  indexes: [{ fields: ['site', 'timestamp'] }],
});
