const express = require('express');
const session = require('express-session');
const cors = require('cors');
const { initializeDatabase } = require('./database/init');
const { sessionConfig } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3001', // Adjust for your frontend URL
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session(sessionConfig));

// Initialize database
initializeDatabase();

// Basic route
app.get('/', (req, res) => {
  res.json({
    message: 'Pharmacy Management System API',
    status: 'Running',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      pharmacy: '/api/pharmacy',
      medicines: '/api/medicines',
      commands: '/api/commands',
      fournisseur: '/api/fournisseur',
      stocks: '/api/stocks',
      demands: '/api/demands'
    }
  });
});

// Import and use API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/pharmacy', require('./routes/pharmacy'));
app.use('/api/medicines', require('./routes/medicines'));
app.use('/api/commands', require('./routes/commands'));
app.use('/api/fournisseur', require('./routes/fournisseur'));
app.use('/api/stocks', require('./routes/stocks'));
app.use('/api/demands', require('./routes/demands'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});




app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
