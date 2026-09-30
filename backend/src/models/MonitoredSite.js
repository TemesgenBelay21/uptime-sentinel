const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const { nanoid } = require('nanoid');

module.exports = sequelize.define('MonitoredSite', {
  _id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  owner: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: 'users', key: '_id' },
    onDelete: 'CASCADE',
  },
  name: { type: DataTypes.STRING(120), allowNull: false },
  url: { type: DataTypes.STRING(2048), allowNull: false },
  checkIntervalMinutes: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 5 },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  currentStatus: { type: DataTypes.ENUM('up', 'down', 'unknown'), allowNull: false, defaultValue: 'unknown' },
  lastCheckedAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
  publicSlug: { type: DataTypes.STRING(16), allowNull: false, unique: true, defaultValue: () => nanoid(10) },
}, {
  tableName: 'monitored_sites',
  timestamps: true,
  indexes: [{ fields: ['owner'] }],
});
