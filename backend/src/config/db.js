require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'uptime_sentinel',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: false,
    timezone: '+00:00',
  },
);

const connectDB = async () => {
  await sequelize.authenticate();
  require('../models');
  await sequelize.sync();
  console.log(`MySQL connected: ${process.env.DB_HOST || '127.0.0.1'}/${process.env.DB_NAME || 'uptime_sentinel'}`);
};

module.exports = { sequelize, connectDB };
