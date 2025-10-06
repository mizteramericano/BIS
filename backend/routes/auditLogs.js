const express = require('express');
const router = express.Router();
const db = require('../config/database');
const {
    authenticateToken,
    requireAnyPermission
} = require('../middleware/auth');

// GET all audit logs (Admin only)
router.get('/',
    authenticateToken,
    requireAnyPermission(['admin.all', 'audit.read']),
    async (req, res) => {
        try {
            const {
                page = 1,
                limit = 50,
                action,
                table_name,
                user_id,
                start_date,
                end_date,
                search
            } = req.query;

            const offset = (page - 1) * limit;
            let whereConditions = [];
            let params = [];

            // Filter by action
            if (action) {
                whereConditions.push('al.action = ?');
                params.push(action);
            }

            // Filter by table name
            if (table_name) {
                whereConditions.push('al.table_name = ?');
                params.push(table_name);
            }

            // Filter by user
            if (user_id) {
                whereConditions.push('al.user_id = ?');
                params.push(user_id);
            }

            // Filter by date range
            if (start_date) {
                whereConditions.push('al.timestamp >= ?');
                params.push(start_date);
            }

            if (end_date) {
                whereConditions.push('al.timestamp <= ?');
                params.push(end_date);
            }

            // Search in username, description
            if (search) {
                whereConditions.push('(al.username LIKE ? OR al.description LIKE ? OR e.first_name LIKE ? OR e.last_name LIKE ?)');
                const searchTerm = `%${search}%`;
                params.push(searchTerm, searchTerm, searchTerm, searchTerm);
            }

            const whereClause = whereConditions.length > 0
                ? 'WHERE ' + whereConditions.join(' AND ')
                : '';

            // Get total count
            const [countResult] = await db.query(`
                SELECT COUNT(*) as total
                FROM audit_logs al
                LEFT JOIN users u ON al.user_id = u.user_id
                LEFT JOIN employees e ON u.employee_id = e.employee_id
                ${whereClause}
            `, params);

            const total = countResult[0].total;

            // Get paginated results
            const [logs] = await db.query(`
                SELECT
                    al.*,
                    u.role_name,
                    e.first_name,
                    e.last_name,
                    e.employee_code
                FROM audit_logs al
                LEFT JOIN users u ON al.user_id = u.user_id
                LEFT JOIN employees e ON u.employee_id = e.employee_id
                ${whereClause}
                ORDER BY al.timestamp DESC
                LIMIT ? OFFSET ?
            `, [...params, parseInt(limit), offset]);

            res.json({
                logs,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('Error fetching audit logs:', error);
            res.status(500).json({ error: error.message });
        }
    }
);

// GET audit log by ID
router.get('/:id',
    authenticateToken,
    requireAnyPermission(['admin.all', 'audit.read']),
    async (req, res) => {
        try {
            const [logs] = await db.query(`
                SELECT
                    al.*,
                    u.role_name,
                    e.first_name,
                    e.last_name,
                    e.employee_code
                FROM audit_logs al
                LEFT JOIN users u ON al.user_id = u.user_id
                LEFT JOIN employees e ON u.employee_id = e.employee_id
                WHERE al.log_id = ?
            `, [req.params.id]);

            if (logs.length === 0) {
                return res.status(404).json({ error: 'Audit log not found' });
            }

            res.json(logs[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// GET audit logs for specific record
router.get('/record/:table/:id',
    authenticateToken,
    requireAnyPermission(['admin.all', 'audit.read']),
    async (req, res) => {
        try {
            const { table, id } = req.params;

            const [logs] = await db.query(`
                SELECT
                    al.*,
                    u.role_name,
                    e.first_name,
                    e.last_name,
                    e.employee_code
                FROM audit_logs al
                LEFT JOIN users u ON al.user_id = u.user_id
                LEFT JOIN employees e ON u.employee_id = e.employee_id
                WHERE al.table_name = ? AND al.record_id = ?
                ORDER BY al.timestamp DESC
            `, [table, id]);

            res.json(logs);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// GET audit logs by user
router.get('/user/:userId',
    authenticateToken,
    requireAnyPermission(['admin.all', 'audit.read']),
    async (req, res) => {
        try {
            const [logs] = await db.query(`
                SELECT
                    al.*,
                    u.role_name,
                    e.first_name,
                    e.last_name,
                    e.employee_code
                FROM audit_logs al
                LEFT JOIN users u ON al.user_id = u.user_id
                LEFT JOIN employees e ON u.employee_id = e.employee_id
                WHERE al.user_id = ?
                ORDER BY al.timestamp DESC
                LIMIT 100
            `, [req.params.userId]);

            res.json(logs);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// GET statistics
router.get('/stats/summary',
    authenticateToken,
    requireAnyPermission(['admin.all', 'audit.read']),
    async (req, res) => {
        try {
            // Total logs
            const [totalResult] = await db.query('SELECT COUNT(*) as total FROM audit_logs');

            // Logs by action
            const [actionStats] = await db.query(`
                SELECT action, COUNT(*) as count
                FROM audit_logs
                GROUP BY action
                ORDER BY count DESC
            `);

            // Logs by table
            const [tableStats] = await db.query(`
                SELECT table_name, COUNT(*) as count
                FROM audit_logs
                GROUP BY table_name
                ORDER BY count DESC
            `);

            // Recent activity (last 7 days)
            const [recentActivity] = await db.query(`
                SELECT DATE(timestamp) as date, COUNT(*) as count
                FROM audit_logs
                WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                GROUP BY DATE(timestamp)
                ORDER BY date DESC
            `);

            // Top users
            const [topUsers] = await db.query(`
                SELECT
                    al.user_id,
                    al.username,
                    e.first_name,
                    e.last_name,
                    COUNT(*) as action_count
                FROM audit_logs al
                LEFT JOIN users u ON al.user_id = u.user_id
                LEFT JOIN employees e ON u.employee_id = e.employee_id
                WHERE al.timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                GROUP BY al.user_id, al.username, e.first_name, e.last_name
                ORDER BY action_count DESC
                LIMIT 10
            `);

            res.json({
                total: totalResult[0].total,
                actionStats,
                tableStats,
                recentActivity,
                topUsers
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

module.exports = router;
