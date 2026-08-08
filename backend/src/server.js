//backend/src/server.js

const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');

// load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../.env'), override: true });

const connectDB = require('./config/db'); // Import database connection
const authRoutes = require('./routes/authRoutes'); // Import auth routes
const chatRoutes = require('./routes/chatRoutes'); // Import chat routes

// DB connection
connectDB();

const app = express();

// Middleware - Increased JSON payload limit
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Test Route
app.get('/', (req, res) => {
  res.send('DevMate AI Backend is running successfully!');
});

// Routes
app.use('/api/auth', authRoutes); 
app.use('/api', chatRoutes); 

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});