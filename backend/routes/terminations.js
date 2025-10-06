const express = require('express');
const router = express.Router();
const db = require('../config/database');
const {
    authenticateToken,
    requirePermission,
    requireAnyPermission
} = require('../middleware/auth');

// GET termination by employee ID
router.get('/employee/:employee_id',
    authenticateToken,
    async (req, res) => {
        try {
            const [terminations] = await db.query(`
                SELECT t.*,
                       e.employee_code, e.first_name, e.last_name,
                       p.first_name as processor_first_name, p.last_name as processor_last_name
                FROM employee_terminations t
                JOIN employees e ON t.employee_id = e.employee_id
                LEFT JOIN employees p ON t.processed_by = p.employee_id
                WHERE t.employee_id = ?
                ORDER BY t.termination_date DESC
            `, [req.params.employee_id]);

            res.json(terminations);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// GET all terminations (Executive, HR, Admin only)
router.get('/',
    authenticateToken,
    requireAnyPermission(['employee.read.all', 'employee.manage']),
    async (req, res) => {
        try {
            const [terminations] = await db.query(`
                SELECT t.*,
                       e.employee_code, e.first_name, e.last_name, e.department_id,
                       d.department_name,
                       p.first_name as processor_first_name, p.last_name as processor_last_name
                FROM employee_terminations t
                JOIN employees e ON t.employee_id = e.employee_id
                LEFT JOIN departments d ON e.department_id = d.department_id
                LEFT JOIN employees p ON t.processed_by = p.employee_id
                ORDER BY t.termination_date DESC
            `);

            res.json(terminations);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// CREATE termination record (Manager, Executive, HR, Admin only)
router.post('/',
    authenticateToken,
    requireAnyPermission(['employee.update.all', 'employee.manage']),
    async (req, res) => {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const {
                employee_id,
                termination_type,
                termination_date,
                last_working_day,
                reason,
                notice_period_days,
                severance_pay,
                unused_leave_payout,
                final_settlement,
                return_company_property,
                exit_interview_completed,
                exit_interview_notes,
                rehire_eligible,
                notes
            } = req.body;

            // Insert termination record
            const [result] = await connection.query(`
                INSERT INTO employee_terminations
                (employee_id, termination_type, termination_date, last_working_day,
                 reason, notice_period_days, severance_pay, unused_leave_payout,
                 final_settlement, return_company_property, exit_interview_completed,
                 exit_interview_notes, rehire_eligible, processed_by, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                employee_id, termination_type, termination_date, last_working_day,
                reason, notice_period_days, severance_pay, unused_leave_payout,
                final_settlement, return_company_property, exit_interview_completed,
                exit_interview_notes, rehire_eligible, req.user.employee_id, notes
            ]);

            // Update employee status to Terminated
            await connection.query(`
                UPDATE employees
                SET employment_status = 'Terminated'
                WHERE employee_id = ?
            `, [employee_id]);

            // Add to history
            await connection.query(`
                INSERT INTO employee_history
                (employee_id, change_type, effective_date, reason, notes, created_by)
                VALUES (?, 'Termination', ?, ?, ?, ?)
            `, [employee_id, termination_date, reason,
                `ประเภท: ${termination_type}, วันสุดท้าย: ${last_working_day}`,
                req.user.username]);

            await connection.commit();

            res.status(201).json({
                message: 'บันทึกการเลิกจ้างสำเร็จ',
                termination_id: result.insertId
            });
        } catch (error) {
            await connection.rollback();
            res.status(500).json({ error: error.message });
        } finally {
            connection.release();
        }
    }
);

// UPDATE termination record (Executive, HR, Admin only)
router.put('/:id',
    authenticateToken,
    requireAnyPermission(['employee.update.all', 'employee.manage']),
    async (req, res) => {
        try {
            const {
                termination_type,
                termination_date,
                last_working_day,
                reason,
                notice_period_days,
                severance_pay,
                unused_leave_payout,
                final_settlement,
                return_company_property,
                exit_interview_completed,
                exit_interview_notes,
                rehire_eligible,
                notes
            } = req.body;

            await db.query(`
                UPDATE employee_terminations
                SET termination_type = ?, termination_date = ?, last_working_day = ?,
                    reason = ?, notice_period_days = ?, severance_pay = ?,
                    unused_leave_payout = ?, final_settlement = ?,
                    return_company_property = ?, exit_interview_completed = ?,
                    exit_interview_notes = ?, rehire_eligible = ?, notes = ?
                WHERE termination_id = ?
            `, [
                termination_type, termination_date, last_working_day,
                reason, notice_period_days, severance_pay, unused_leave_payout,
                final_settlement, return_company_property, exit_interview_completed,
                exit_interview_notes, rehire_eligible, notes, req.params.id
            ]);

            res.json({ message: 'อัพเดทข้อมูลการเลิกจ้างสำเร็จ' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// DELETE termination record (Admin only)
router.delete('/:id',
    authenticateToken,
    requireAnyPermission(['employee.delete', 'employee.manage']),
    async (req, res) => {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            // Get employee_id before deleting
            const [termination] = await connection.query(
                'SELECT employee_id FROM employee_terminations WHERE termination_id = ?',
                [req.params.id]
            );

            if (termination.length === 0) {
                await connection.rollback();
                return res.status(404).json({ error: 'ไม่พบข้อมูลการเลิกจ้างนี้' });
            }

            // Delete termination record
            await connection.query(
                'DELETE FROM employee_terminations WHERE termination_id = ?',
                [req.params.id]
            );

            // Reactivate employee
            await connection.query(`
                UPDATE employees
                SET employment_status = 'Active'
                WHERE employee_id = ?
            `, [termination[0].employee_id]);

            await connection.commit();

            res.json({ message: 'ลบข้อมูลการเลิกจ้างสำเร็จ' });
        } catch (error) {
            await connection.rollback();
            res.status(500).json({ error: error.message });
        } finally {
            connection.release();
        }
    }
);

module.exports = router;
