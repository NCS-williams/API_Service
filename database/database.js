const { Sequelize } = require('sequelize');
const path = require('path');

// Create SQLite database connection
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'pharmacy_system.sqlite'),
  logging: console.log, // Set to false to disable SQL logging
});

module.exports = sequelize;
