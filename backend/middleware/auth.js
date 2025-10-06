const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                error: 'Access denied',
                message: 'ไม่พบ token การเข้าสู่ระบบ'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mitsubishi-bis-secret-key');

        // Get user info with role and permissions
        const [users] = await db.query(`
            SELECT u.user_id, u.employee_id, u.username, u.role_id,
                   r.role_name, e.first_name, e.last_name, e.department_id, e.position_id
            FROM users u
            JOIN roles r ON u.role_id = r.role_id
            JOIN employees e ON u.employee_id = e.employee_id
            WHERE u.user_id = ? AND u.is_active = TRUE
        `, [decoded.userId]);

        if (users.length === 0) {
            return res.status(401).json({
                error: 'Invalid token',
                message: 'ผู้ใช้งานไม่ถูกต้องหรือถูกระงับการใช้งาน'
            });
        }

        // Get user permissions
        const [permissions] = await db.query(`
            SELECT p.permission_name, p.resource, p.action
            FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.permission_id
            WHERE rp.role_id = ?
        `, [users[0].role_id]);

        req.user = {
            ...users[0],
            permissions: permissions.map(p => p.permission_name)
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({
                error: 'Invalid token',
                message: 'Token ไม่ถูกต้อง'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(403).json({
                error: 'Token expired',
                message: 'Token หมดอายุ กรุณาเข้าสู่ระบบใหม่'
            });
        }
        res.status(500).json({ error: error.message });
    }
};

// Middleware to check if user has required permission
const requirePermission = (permissionName) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'กรุณาเข้าสู่ระบบก่อน'
                });
            }

            // Check if user has the required permission
            if (!req.user.permissions.includes(permissionName)) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'คุณไม่มีสิทธิ์ในการเข้าถึงข้อมูลนี้'
                });
            }

            next();
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };
};

// Middleware to check if user has any of the required permissions
const requireAnyPermission = (permissionNames) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'กรุณาเข้าสู่ระบบก่อน'
                });
            }

            const hasPermission = permissionNames.some(permission =>
                req.user.permissions.includes(permission)
            );

            if (!hasPermission) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'คุณไม่มีสิทธิ์ในการเข้าถึงข้อมูลนี้'
                });
            }

            next();
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };
};

// Middleware to check if user has specific role
const requireRole = (roleNames) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'กรุณาเข้าสู่ระบบก่อน'
                });
            }

            const roles = Array.isArray(roleNames) ? roleNames : [roleNames];

            if (!roles.includes(req.user.role_name)) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'คุณไม่มีสิทธิ์ในการเข้าถึงข้อมูลนี้'
                });
            }

            next();
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };
};

// Middleware to check if user is manager of the employee
const requireManagerOf = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'กรุณาเข้าสู่ระบบก่อน'
            });
        }

        const employeeId = req.params.id || req.params.employee_id || req.body.employee_id;

        if (!employeeId) {
            return res.status(400).json({
                error: 'Bad request',
                message: 'ไม่พบข้อมูล employee_id'
            });
        }

        // Executives and Admins can access all
        if (['Executive', 'Admin'].includes(req.user.role_name)) {
            return next();
        }

        // Check if user is manager of this employee
        const [relations] = await db.query(`
            SELECT * FROM manager_subordinates
            WHERE manager_id = ? AND subordinate_id = ? AND is_active = TRUE
        `, [req.user.employee_id, employeeId]);

        if (relations.length === 0) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'คุณไม่ใช่หัวหน้าของพนักงานคนนี้'
            });
        }

        next();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Middleware to check if accessing own data
const requireOwnDataOrPermission = (permissionName) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'กรุณาเข้าสู่ระบบก่อน'
                });
            }

            const employeeId = req.params.id || req.params.employee_id || req.body.employee_id;

            // Check if accessing own data
            if (parseInt(employeeId) === parseInt(req.user.employee_id)) {
                return next();
            }

            // Check if has permission to access other's data
            if (req.user.permissions.includes(permissionName)) {
                return next();
            }

            return res.status(403).json({
                error: 'Forbidden',
                message: 'คุณสามารถเข้าถึงได้เฉพาะข้อมูลของตนเอง'
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };
};

module.exports = {
    authenticateToken,
    requirePermission,
    requireAnyPermission,
    requireRole,
    requireManagerOf,
    requireOwnDataOrPermission
};
