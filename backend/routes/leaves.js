const express = require('express');
const router = express.Router();
const db = require('../config/database');
const {
    authenticateToken,
    requirePermission,
    requireAnyPermission,
    requireManagerOf,
    requireOwnDataOrPermission
} = require('../middleware/auth');

// GET all leave requests (with permission check)
router.get('/', authenticateToken, async (req, res) => {
    try {
        let query = `
            SELECT l.*,
                   e.employee_code, e.first_name, e.last_name, e.title,
                   d.department_name, p.position_name,
                   a.first_name as approver_first_name, a.last_name as approver_last_name
            FROM leave_requests l
            JOIN employees e ON l.employee_id = e.employee_id
            LEFT JOIN departments d ON e.department_id = d.department_id
            LEFT JOIN positions p ON e.position_id = p.position_id
            LEFT JOIN employees a ON l.approved_by = a.employee_id
        `;
        let params = [];

        // Filter based on user permissions
        if (req.user.permissions.includes('leave.read.all')) {
            // Executive/Admin - see all
            query += ` ORDER BY l.created_at DESC`;
        } else if (req.user.permissions.includes('leave.read.subordinate')) {
            // Manager - see own and subordinates'
            query += ` WHERE (l.employee_id = ? OR l.employee_id IN (
                SELECT subordinate_id FROM manager_subordinates
                WHERE manager_id = ? AND is_active = TRUE
            )) ORDER BY l.created_at DESC`;
            params = [req.user.employee_id, req.user.employee_id];
        } else {
            // Employee - see only own
            query += ` WHERE l.employee_id = ? ORDER BY l.created_at DESC`;
            params = [req.user.employee_id];
        }

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET leave requests by employee ID (with permission check)
router.get('/employee/:employee_id',
    authenticateToken,
    requireOwnDataOrPermission('leave.read.subordinate'),
    async (req, res) => {
        try {
            const [rows] = await db.query(`
                SELECT l.*,
                       a.first_name as approver_first_name, a.last_name as approver_last_name
                FROM leave_requests l
                LEFT JOIN employees a ON l.approved_by = a.employee_id
                WHERE l.employee_id = ?
                ORDER BY l.start_date DESC
            `, [req.params.employee_id]);
            res.json(rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// GET single leave request
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT l.*,
                   e.employee_code, e.first_name, e.last_name, e.title,
                   d.department_name, p.position_name,
                   a.first_name as approver_first_name, a.last_name as approver_last_name
            FROM leave_requests l
            JOIN employees e ON l.employee_id = e.employee_id
            LEFT JOIN departments d ON e.department_id = d.department_id
            LEFT JOIN positions p ON e.position_id = p.position_id
            LEFT JOIN employees a ON l.approved_by = a.employee_id
            WHERE l.leave_id = ?
        `, [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Leave request not found' });
        }

        const leave = rows[0];

        // Check permission to view this leave
        const canViewAll = req.user.permissions.includes('leave.read.all');
        const isOwnLeave = leave.employee_id === req.user.employee_id;

        if (!canViewAll && !isOwnLeave) {
            // Check if manager of this employee
            if (req.user.permissions.includes('leave.read.subordinate')) {
                const [isSubordinate] = await db.query(`
                    SELECT * FROM manager_subordinates
                    WHERE manager_id = ? AND subordinate_id = ? AND is_active = TRUE
                `, [req.user.employee_id, leave.employee_id]);

                if (isSubordinate.length === 0) {
                    return res.status(403).json({
                        error: 'Forbidden',
                        message: 'คุณไม่มีสิทธิ์ดูคำขอลานี้'
                    });
                }
            } else {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'คุณสามารถดูได้เฉพาะคำขอลาของตนเอง'
                });
            }
        }

        res.json(leave);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// CREATE new leave request (only for own employee_id)
router.post('/',
    authenticateToken,
    requirePermission('leave.create.own'),
    async (req, res) => {
        try {
            const {
                leave_type,
                start_date,
                end_date,
                total_days,
                reason,
                attachment_url
            } = req.body;

            // Force use logged-in user's employee_id
            const employee_id = req.user.employee_id;

            const [result] = await db.query(`
                INSERT INTO leave_requests
                (employee_id, leave_type, start_date, end_date, total_days, reason, attachment_url)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [employee_id, leave_type, start_date, end_date, total_days, reason, attachment_url]);

            res.status(201).json({
                message: 'สร้างคำขอลาสำเร็จ',
                leave_id: result.insertId
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// UPDATE leave request status (approve/reject) - Manager or Executive only
router.put('/:id/status',
    authenticateToken,
    requireAnyPermission(['leave.approve.subordinate', 'leave.approve.all']),
    async (req, res) => {
        try {
            const { status, remarks } = req.body;

            // Get leave request details
            const [leaveRequest] = await db.query(
                'SELECT employee_id FROM leave_requests WHERE leave_id = ?',
                [req.params.id]
            );

            if (leaveRequest.length === 0) {
                return res.status(404).json({ error: 'ไม่พบคำขอลานี้' });
            }

            // Check if manager has permission to approve this employee's leave
            if (!req.user.permissions.includes('leave.approve.all')) {
                // Manager - can only approve subordinates' leave
                const [isSubordinate] = await db.query(`
                    SELECT * FROM manager_subordinates
                    WHERE manager_id = ? AND subordinate_id = ? AND is_active = TRUE
                `, [req.user.employee_id, leaveRequest[0].employee_id]);

                if (isSubordinate.length === 0) {
                    return res.status(403).json({
                        error: 'คุณไม่มีสิทธิ์อนุมัติการลาของพนักงานคนนี้'
                    });
                }
            }

            // Update leave status
            await db.query(`
                UPDATE leave_requests
                SET status = ?, approved_by = ?, approved_date = NOW(), remarks = ?
                WHERE leave_id = ?
            `, [status, req.user.employee_id, remarks, req.params.id]);

            res.json({
                message: status === 'อนุมัติ' ? 'อนุมัติการลาสำเร็จ' : 'ปฏิเสธการลาสำเร็จ'
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// UPDATE leave request (only own pending leaves)
router.put('/:id',
    authenticateToken,
    requirePermission('leave.update.own'),
    async (req, res) => {
        try {
            const {
                leave_type,
                start_date,
                end_date,
                total_days,
                reason,
                attachment_url
            } = req.body;

            // Check if this is user's own leave request
            const [leave] = await db.query(
                'SELECT employee_id, status FROM leave_requests WHERE leave_id = ?',
                [req.params.id]
            );

            if (leave.length === 0) {
                return res.status(404).json({ error: 'ไม่พบคำขอลานี้' });
            }

            // Only allow editing own leave
            if (leave[0].employee_id !== req.user.employee_id) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'คุณสามารถแก้ไขได้เฉพาะคำขอลาของตนเอง'
                });
            }

            // Only allow editing pending leaves
            if (leave[0].status !== 'รออนุมัติ') {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'ไม่สามารถแก้ไขคำขอลาที่อนุมัติหรือปฏิเสธแล้ว'
                });
            }

            await db.query(`
                UPDATE leave_requests
                SET leave_type = ?, start_date = ?, end_date = ?, total_days = ?,
                    reason = ?, attachment_url = ?
                WHERE leave_id = ?
            `, [leave_type, start_date, end_date, total_days, reason, attachment_url, req.params.id]);

            res.json({ message: 'แก้ไขคำขอลาสำเร็จ' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// DELETE leave request (only own pending leaves)
router.delete('/:id',
    authenticateToken,
    requirePermission('leave.delete.own'),
    async (req, res) => {
        try {
            // Check if this is user's own leave request
            const [leave] = await db.query(
                'SELECT employee_id, status FROM leave_requests WHERE leave_id = ?',
                [req.params.id]
            );

            if (leave.length === 0) {
                return res.status(404).json({ error: 'ไม่พบคำขอลานี้' });
            }

            // Only allow deleting own leave
            if (leave[0].employee_id !== req.user.employee_id) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'คุณสามารถลบได้เฉพาะคำขอลาของตนเอง'
                });
            }

            // Only allow deleting pending leaves
            if (leave[0].status !== 'รออนุมัติ') {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'ไม่สามารถลบคำขอลาที่อนุมัติหรือปฏิเสธแล้ว'
                });
            }

            await db.query('DELETE FROM leave_requests WHERE leave_id = ?', [req.params.id]);
            res.json({ message: 'ลบคำขอลาสำเร็จ' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// GET leave summary by employee
router.get('/summary/:employee_id', async (req, res) => {
    try {
        const [summary] = await db.query(`
            SELECT
                leave_type,
                COUNT(*) as request_count,
                SUM(total_days) as total_days_used,
                SUM(CASE WHEN status = 'อนุมัติ' THEN total_days ELSE 0 END) as approved_days
            FROM leave_requests
            WHERE employee_id = ? AND YEAR(start_date) = YEAR(CURDATE())
            GROUP BY leave_type
        `, [req.params.employee_id]);

        res.json(summary);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
