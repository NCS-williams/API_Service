-- SQL script to create the pharmacy system database tables
-- This is for reference and documentation purposes
-- The actual tables are created using Sequelize models

-- Users table
CREATE TABLE IF NOT EXISTS Users (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Username VARCHAR(255) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL
);

-- Pharmacy table
CREATE TABLE IF NOT EXISTS Pharmacy (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Username VARCHAR(255) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL,
    Name VARCHAR(255) NOT NULL,
    Location VARCHAR(255) NOT NULL,
    Phone_number VARCHAR(255) NOT NULL
);

-- Medicines table
CREATE TABLE IF NOT EXISTS Medicines (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Name VARCHAR(255) NOT NULL,
    Price DECIMAL(10,2) NOT NULL
);

-- Fournisseur (Supplier) table
CREATE TABLE IF NOT EXISTS Fournisseur (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Username VARCHAR(255) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL,
    Name VARCHAR(255) NOT NULL,
    Location VARCHAR(255) NOT NULL,
    Phone_number VARCHAR(255) NOT NULL
);

-- Contractor table
CREATE TABLE IF NOT EXISTS Contractor (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Med_ID INTEGER NOT NULL,
    Pharm_ID INTEGER NOT NULL,
    Num_of_Units INTEGER NOT NULL,
    Start_date DATE NOT NULL,
    FOREIGN KEY (Med_ID) REFERENCES Medicines(ID),
    FOREIGN KEY (Pharm_ID) REFERENCES Pharmacy(ID)
);

-- Stocks table
CREATE TABLE IF NOT EXISTS Stocks (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Pharm_ID INTEGER NOT NULL,
    Medical_ID INTEGER NOT NULL,
    Num_of_Units INTEGER NOT NULL,
    FOREIGN KEY (Pharm_ID) REFERENCES Pharmacy(ID),
    FOREIGN KEY (Medical_ID) REFERENCES Medicines(ID)
);

-- Demand Users table
CREATE TABLE IF NOT EXISTS Demand_Users (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Med_ID INTEGER NOT NULL,
    User_ID INTEGER NOT NULL,
    Date DATE NOT NULL,
    FOREIGN KEY (Med_ID) REFERENCES Medicines(ID),
    FOREIGN KEY (User_ID) REFERENCES Users(ID)
);

-- Sample data insertion queries (optional)
-- Users
INSERT OR IGNORE INTO Users (Username, Password) VALUES 
    ('john_doe', 'password123'),
    ('jane_smith', 'password456'),
    ('bob_johnson', 'password789');

-- Medicines
INSERT OR IGNORE INTO Medicines (Name, Price) VALUES 
    ('Paracetamol', 5.99),
    ('Ibuprofen', 7.50),
    ('Amoxicillin', 12.75),
    ('Aspirin', 4.25),
    ('Omeprazole', 15.80);

-- Pharmacy
INSERT OR IGNORE INTO Pharmacy (Username, Password, Name, Location, Phone_number) VALUES 
    ('pharma_central', 'pharma123', 'Central Pharmacy', 'Downtown', '+1234567890'),
    ('health_plus', 'health456', 'Health Plus Pharmacy', 'Uptown', '+1234567891');

-- Fournisseur
INSERT OR IGNORE INTO Fournisseur (Username, Password, Name, Location, Phone_number) VALUES 
    ('med_supplier1', 'supplier123', 'MedSupply Corp', 'Industrial Zone', '+1234567892'),
    ('pharma_dist', 'dist456', 'Pharma Distribution', 'Warehouse District', '+1234567893');
