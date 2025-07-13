// app.js
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/mongo');

// Route imports
const threatRoutes = require('./routes/threatRoutes');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
});

// Routes
app.use('/api/threats', threatRoutes);

// Basic route for testing
app.get('/', (req, res) => {
    res.json({ 
        message: 'Threat Management API is running!',
        version: '1.0.0',
        endpoints: {
            threats: '/api/threats',
            documentation: 'Available endpoints: GET, POST, PUT, DELETE /api/threats'
        }
    });
});

// Health check route
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: `Route ${req.originalUrl} not found`
    });
});

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error('Error Stack:', err.stack);
    
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

module.exports = app;
