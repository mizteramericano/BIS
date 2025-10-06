const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Import Routes
const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const departmentRoutes = require('./routes/departments');
const positionRoutes = require('./routes/positions');
const leaveRoutes = require('./routes/leaves');
const terminationRoutes = require('./routes/terminations');
const auditLogRoutes = require('./routes/auditLogs');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/positions', positionRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/terminations', terminationRoutes);
app.use('/api/audit-logs', auditLogRoutes);

// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Mitsubishi Electric API is running',
        timestamp: new Date().toISOString()
    });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: err.message
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Mitsubishi Electric Server is running on port ${PORT}`);
});
