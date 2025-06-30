const { DataTypes } = require('sequelize');
const sequelize = require('./database');

// Users table
const Users = sequelize.define('Users', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'ID'
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'Username'
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'Password'
  }
}, {
  tableName: 'Users',
  timestamps: false
});

// Pharmacy table
const Pharmacy = sequelize.define('Pharmacy', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'ID'
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'Username'
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'Password'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'Name'
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'Location'
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'Phone_number'
  }
}, {
  tableName: 'Pharmacy',
  timestamps: false
});

// Medicines table
const Medicines = sequelize.define('Medicines', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'ID'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'Name'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'Price'
  }
}, {
  tableName: 'Medicines',
  timestamps: false
});

// Fournisseur (Supplier) table
const Fournisseur = sequelize.define('Fournisseur', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'ID'
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'Username'
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'Password'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'Name'
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'Location'
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'Phone_number'
  }
}, {
  tableName: 'Fournisseur',
  timestamps: false
});

// Contractor table
const Commands = sequelize.define('Commands', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'ID'
  },
  medId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Medicines,
      key: 'id'
    },
    field: 'Med_ID'
  },
  pharmId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Pharmacy,
      key: 'id'
    },
    field: 'Pharm_ID'
  },
  numOfUnits: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'Num_of_Units'
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'Start_date'
  },
  state: {
    type: DataTypes.ENUM('awaiting', 'on_delivery', 'delivered'),
    allowNull: false,
    defaultValue: 'awaiting',
    field: 'State'
  },
  fournisseurId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Fournisseur,
      key: 'id'
    },
    field: 'Fournisseur_ID'
  }
}, {
  tableName: 'Commands',
  timestamps: false
});

// Stocks table
const Stocks = sequelize.define('Stocks', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'ID'
  },
  pharmId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Pharmacy,
      key: 'id'
    },
    field: 'Pharm_ID'
  },
  medicalId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Medicines,
      key: 'id'
    },
    field: 'Medical_ID'
  },
  numOfUnits: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'Num_of_Units'
  }
}, {
  tableName: 'Stocks',
  timestamps: false
});

// Demand Users table
const DemandUsers = sequelize.define('DemandUsers', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'ID'
  },
  medId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Medicines,
      key: 'id'
    },
    field: 'Med_ID'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Users,
      key: 'id'
    },
    field: 'User_ID'
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'Date'
  }
}, {
  tableName: 'Demand_Users',
  timestamps: false
});

// Sessions table for session storage
const Sessions = sequelize.define('Sessions', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    field: 'session_id'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id'
  },
  userType: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'user_type'
  },
  userData: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'user_data'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'expires_at'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  }
}, {
  tableName: 'Sessions',
  timestamps: false
});

// Define associations
// Commands associations
Commands.belongsTo(Medicines, { foreignKey: 'medId', as: 'medicine' });
Commands.belongsTo(Pharmacy, { foreignKey: 'pharmId', as: 'pharmacy' });
Commands.belongsTo(Fournisseur, { foreignKey: 'fournisseurId', as: 'fournisseur' });

// Stocks associations
Stocks.belongsTo(Pharmacy, { foreignKey: 'pharmId', as: 'pharmacy' });
Stocks.belongsTo(Medicines, { foreignKey: 'medicalId', as: 'medicine' });

// Demand Users associations
DemandUsers.belongsTo(Medicines, { foreignKey: 'medId', as: 'medicine' });
DemandUsers.belongsTo(Users, { foreignKey: 'userId', as: 'user' });

// Reverse associations
Medicines.hasMany(Commands, { foreignKey: 'medId', as: 'contracts' });
Medicines.hasMany(Stocks, { foreignKey: 'medicalId', as: 'stocks' });
Medicines.hasMany(DemandUsers, { foreignKey: 'medId', as: 'demands' });

Pharmacy.hasMany(Commands, { foreignKey: 'pharmId', as: 'contracts' });
Pharmacy.hasMany(Stocks, { foreignKey: 'pharmId', as: 'stocks' });

Fournisseur.hasMany(Commands, { foreignKey: 'fournisseurId', as: 'commands' });

Users.hasMany(DemandUsers, { foreignKey: 'userId', as: 'demands' });

module.exports = {
  sequelize,
  Users,
  Pharmacy,
  Medicines,
  Commands,
  Fournisseur,
  Stocks,
  DemandUsers,
  Sessions
};
