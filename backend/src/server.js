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

// Middleware
app.use(cors());
app.use(express.json());

// Test Route
app.get('/', (req, res) => {
  res.send('DevMate AI Backend is running successfully!');
});

// API Routes
app.use('/api/auth', authRoutes); // Use auth routes
app.use('/api', chatRoutes); // Use chat routes

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});