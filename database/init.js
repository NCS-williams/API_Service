const {
  sequelize,
  Users,
  Pharmacy,
  Medicines,
  Commands,
  Fournisseur,
  Stocks,
  DemandUsers
} = require('./models');

async function initializeDatabase() {
  try {
    // Test the connection
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Sync all models with the database
    await sequelize.sync({ force: false }); // Set force: true to recreate tables
    console.log('All models were synchronized successfully.');


  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

// Function to reset database (use with caution)
async function resetDatabase() {
  try {
    await sequelize.sync({ force: true });
    console.log('Database reset successfully.');
  } catch (error) {
    console.error('Error resetting database:', error);
  }
}

module.exports = {
  initializeDatabase,
  resetDatabase
};
