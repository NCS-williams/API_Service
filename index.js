const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { initializeDatabase } = require('./database/init');
const { cleanExpiredSessions } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors(
  {
    origin: 'http://localhost:5173', // Allow all origins for development
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id'],
    credentials: true // Allow cookies to be sent
  }
));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Initialize database
initializeDatabase();

// Clean expired sessions every hour
setInterval(async () => {
  try {
    await cleanExpiredSessions();
    console.log('Cleaned expired sessions');
  } catch (error) {
    console.error('Error cleaning expired sessions:', error);
  }
}, 60 * 60 * 1000); // 1 hour

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
