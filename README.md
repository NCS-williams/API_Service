# Pharmacy Management System Database

This project contains a SQLite3 database setup for a pharmacy management system with the following tables:

## Database Tables

### Users
- **ID**: Primary key (auto-increment)
- **Username**: Unique username for users
- **Password**: User password

### Pharmacy
- **ID**: Primary key (auto-increment)
- **Username**: Unique username for pharmacy
- **Password**: Pharmacy password
- **Name**: Pharmacy name
- **Location**: Pharmacy location
- **Phone_number**: Pharmacy contact number

### Medicines
- **ID**: Primary key (auto-increment)
- **Name**: Medicine name

### Contractor
- **ID**: Primary key (auto-increment)
- **Med_ID**: Foreign key referencing Medicines
- **Pharm_ID**: Foreign key referencing Pharmacy
- **Num_of_Units**: Number of units in contract
- **Start_date**: Contract start date

### Fournisseur (Supplier)
- **ID**: Primary key (auto-increment)
- **Username**: Unique username for supplier
- **Password**: Supplier password
- **Name**: Supplier name
- **Location**: Supplier location
- **Phone_number**: Supplier contact number

### Stocks
- **ID**: Primary key (auto-increment)
- **Pharm_ID**: Foreign key referencing Pharmacy
- **Medical_ID**: Foreign key referencing Medicines
- **Num_of_Units**: Number of units in stock

### Demand_Users
- **ID**: Primary key (auto-increment)
- **Med_ID**: Foreign key referencing Medicines
- **User_ID**: Foreign key referencing Users
- **Date**: Date of demand

## Files Structure

- `database/database.js` - Database connection configuration
- `database/models.js` - Sequelize models for all tables
- `database/init.js` - Database initialization and sample data
- `database/schema.sql` - Raw SQL schema for reference
- `index.js` - Main application file

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the application:
   ```bash
   node index.js
   ```

The database will be automatically created as `pharmacy_system.sqlite` in the database directory, and sample data will be inserted on first run.

## Database Features

- All tables have proper foreign key relationships
- Sample data is automatically inserted for testing
- Sequelize ORM is used for database operations
- Database file is created automatically on first run

## API Endpoints (to be implemented)

The following API endpoints can be implemented:
- `/api/users` - User management
- `/api/pharmacy` - Pharmacy management
- `/api/medicines` - Medicine management
- `/api/contractor` - Contract management
- `/api/fournisseur` - Supplier management
- `/api/stocks` - Stock management
- `/api/demands` - User demand management
