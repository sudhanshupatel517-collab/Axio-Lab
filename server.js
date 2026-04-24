const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/auth', require('./routes/authRoutes'));
app.use('/reports', require('./routes/reportRoutes'));
app.use('/appointments', require('./routes/appointmentRoutes'));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Fallback catch-all middleware for unknown routes
app.use((req, res) => {
    // If request accepts html, it's likely a browser hitting a frontend route directly
    if (req.accepts('html') && !req.url.startsWith('/api/') && !req.url.startsWith('/auth/') && !req.url.startsWith('/reports/') && !req.url.startsWith('/appointments/')) {
        return res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
    
    // Otherwise return API 404 response
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});

// Global error handling middleware
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
