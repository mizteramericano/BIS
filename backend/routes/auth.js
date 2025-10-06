const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../middleware/auth');

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { employee_id, username, password, role_id } = req.body;

        // Check if username already exists
        const [existingUser] = await db.query(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({
                error: 'Username already exists',
                message: 'ชื่อผู้ใช้งานนี้ถูกใช้แล้ว'
            });
        }

        // Check if employee exists
        const [employee] = await db.query(
            'SELECT * FROM employees WHERE employee_id = ?',
            [employee_id]
        );

        if (employee.length === 0) {
            return res.status(404).json({
                error: 'Employee not found',
                message: 'ไม่พบพนักงานนี้ในระบบ'
            });
        }

        // Check if employee already has a user account
        const [existingEmployeeUser] = await db.query(
            'SELECT * FROM users WHERE employee_id = ?',
            [employee_id]
        );

        if (existingEmployeeUser.length > 0) {
            return res.status(400).json({
                error: 'Employee already has account',
                message: 'พนักงานคนนี้มีบัญชีผู้ใช้แล้ว'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Create user
        const [result] = await db.query(`
            INSERT INTO users (employee_id, username, password_hash, role_id)
            VALUES (?, ?, ?, ?)
        `, [employee_id, username, password_hash, role_id || 1]); // Default to Employee role

        res.status(201).json({
            message: 'สร้างบัญชีผู้ใช้สำเร็จ',
            user_id: result.insertId
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Get user with role information
        const [users] = await db.query(`
            SELECT u.*, r.role_name, e.first_name, e.last_name, e.employee_code, e.department_id
            FROM users u
            JOIN roles r ON u.role_id = r.role_id
            JOIN employees e ON u.employee_id = e.employee_id
            WHERE u.username = ? AND u.is_active = TRUE
        `, [username]);

        if (users.length === 0) {
            return res.status(401).json({
                error: 'Invalid credentials',
                message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
            });
        }

        const user = users[0];

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({
                error: 'Invalid credentials',
                message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
            });
        }

        // Update last login
        await db.query(
            'UPDATE users SET last_login = NOW() WHERE user_id = ?',
            [user.user_id]
        );

        // Get user permissions
        const [permissions] = await db.query(`
            SELECT p.permission_name, p.resource, p.action
            FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.permission_id
            WHERE rp.role_id = ?
        `, [user.role_id]);

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user.user_id,
                employeeId: user.employee_id,
                username: user.username,
                role: user.role_name
            },
            process.env.JWT_SECRET || 'mitsubishi-bis-secret-key',
            { expiresIn: '8h' }
        );

        res.json({
            message: 'เข้าสู่ระบบสำเร็จ',
            token,
            user: {
                user_id: user.user_id,
                employee_id: user.employee_id,
                username: user.username,
                role: user.role_name,
                first_name: user.first_name,
                last_name: user.last_name,
                employee_code: user.employee_code,
                department_id: user.department_id,
                permissions: permissions.map(p => p.permission_name)
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const [users] = await db.query(`
            SELECT u.user_id, u.employee_id, u.username, u.role_id, u.last_login,
                   r.role_name, e.*, d.department_name, p.position_name
            FROM users u
            JOIN roles r ON u.role_id = r.role_id
            JOIN employees e ON u.employee_id = e.employee_id
            LEFT JOIN departments d ON e.department_id = d.department_id
            LEFT JOIN positions p ON e.position_id = p.position_id
            WHERE u.user_id = ?
        `, [req.user.user_id]);

        if (users.length === 0) {
            return res.status(404).json({ error: 'ไม่พบข้อมูลผู้ใช้' });
        }

        const user = users[0];

        // Get permissions
        const [permissions] = await db.query(`
            SELECT p.permission_name, p.permission_description, p.resource, p.action
            FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.permission_id
            WHERE rp.role_id = ?
        `, [user.role_id]);

        // Get subordinates if manager
        let subordinates = [];
        if (user.role_name === 'Manager' || user.role_name === 'Executive') {
            const [subs] = await db.query(`
                SELECT e.employee_id, e.employee_code, e.first_name, e.last_name,
                       e.title, d.department_name, p.position_name
                FROM manager_subordinates ms
                JOIN employees e ON ms.subordinate_id = e.employee_id
                LEFT JOIN departments d ON e.department_id = d.department_id
                LEFT JOIN positions p ON e.position_id = p.position_id
                WHERE ms.manager_id = ? AND ms.is_active = TRUE
            `, [user.employee_id]);
            subordinates = subs;
        }

        res.json({
            user: {
                ...user,
                password_hash: undefined // Remove password hash from response
            },
            permissions: permissions,
            subordinates: subordinates
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Change password
router.post('/change-password', authenticateToken, async (req, res) => {
    try {
        const { current_password, new_password } = req.body;

        // Get user's current password hash
        const [users] = await db.query(
            'SELECT password_hash FROM users WHERE user_id = ?',
            [req.user.user_id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
        }

        // Verify current password
        const validPassword = await bcrypt.compare(current_password, users[0].password_hash);

        if (!validPassword) {
            return res.status(401).json({
                error: 'Invalid password',
                message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const new_password_hash = await bcrypt.hash(new_password, salt);

        // Update password
        await db.query(
            'UPDATE users SET password_hash = ? WHERE user_id = ?',
            [new_password_hash, req.user.user_id]
        );

        res.json({ message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Logout (optional - mainly for clearing session on client side)
router.post('/logout', authenticateToken, (req, res) => {
    res.json({ message: 'ออกจากระบบสำเร็จ' });
});

module.exports = router;
