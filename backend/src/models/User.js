const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

module.exports = sequelize.define('User', {
  _id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(80), allowNull: false },
  email: { type: DataTypes.STRING(254), allowNull: false, unique: true, set(value) { this.setDataValue('email', value.trim().toLowerCase()); } },
  passwordHash: { type: DataTypes.STRING(255), allowNull: false },
}, {
  tableName: 'users',
  timestamps: true,
});
