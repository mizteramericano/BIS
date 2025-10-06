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

// GET all employees
router.get('/', authenticateToken, async (req, res) => {
    try {
        const isEmployee = req.user.role_name === 'Employee';

        if (isEmployee) {
            // พนักงานทั่วไปเห็นเฉพาะข้อมูลจำกัด
            const [rows] = await db.query(`
                SELECT e.employee_id, e.employee_code, e.first_name, e.last_name,
                       TIMESTAMPDIFF(YEAR, e.birth_date, CURDATE()) as age,
                       d.department_name
                FROM employees e
                LEFT JOIN departments d ON e.department_id = d.department_id
                ORDER BY e.employee_code
            `);
            res.json(rows);
        } else {
            // Manager, Executive, HR, Admin เห็นข้อมูลทั้งหมด
            const [rows] = await db.query(`
                SELECT e.*, d.department_name, p.position_name
                FROM employees e
                LEFT JOIN departments d ON e.department_id = d.department_id
                LEFT JOIN positions p ON e.position_id = p.position_id
                ORDER BY e.employee_code
            `);
            res.json(rows);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET single employee by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const isEmployee = req.user.role_name === 'Employee';
        const isOwnData = parseInt(req.params.id) === parseInt(req.user.employee_id);

        if (isEmployee && !isOwnData) {
            // พนักงานดูข้อมูลคนอื่น - แสดงเฉพาะข้อมูลจำกัด
            const [rows] = await db.query(`
                SELECT e.employee_id, e.employee_code, e.first_name, e.last_name,
                       e.birth_date, d.department_name
                FROM employees e
                LEFT JOIN departments d ON e.department_id = d.department_id
                WHERE e.employee_id = ?
            `, [req.params.id]);

            if (rows.length === 0) {
                return res.status(404).json({ error: 'Employee not found' });
            }

            return res.json(rows[0]);
        }

        // ดูข้อมูลตัวเอง หรือ Manager/Executive/HR/Admin ดูข้อมูลคนอื่น - แสดงทั้งหมด
        const [rows] = await db.query(`
            SELECT e.*, d.department_name, p.position_name
            FROM employees e
            LEFT JOIN departments d ON e.department_id = d.department_id
            LEFT JOIN positions p ON e.position_id = p.position_id
            WHERE e.employee_id = ?
        `, [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        // Get addresses
        const [addresses] = await db.query(
            'SELECT * FROM employee_addresses WHERE employee_id = ?',
            [req.params.id]
        );

        // Get history
        const [history] = await db.query(`
            SELECT h.*,
                   pd.department_name as previous_department_name,
                   nd.department_name as new_department_name,
                   pp.position_name as previous_position_name,
                   np.position_name as new_position_name
            FROM employee_history h
            LEFT JOIN departments pd ON h.previous_department_id = pd.department_id
            LEFT JOIN departments nd ON h.new_department_id = nd.department_id
            LEFT JOIN positions pp ON h.previous_position_id = pp.position_id
            LEFT JOIN positions np ON h.new_position_id = np.position_id
            WHERE h.employee_id = ?
            ORDER BY h.effective_date DESC
        `, [req.params.id]);

        // Get training
        const [training] = await db.query(
            'SELECT * FROM employee_training WHERE employee_id = ? ORDER BY training_date DESC',
            [req.params.id]
        );

        // Get benefits
        const [benefits] = await db.query(
            'SELECT * FROM employee_benefits WHERE employee_id = ? ORDER BY start_date DESC',
            [req.params.id]
        );

        res.json({
            ...rows[0],
            addresses,
            history,
            training,
            benefits
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// CREATE new employee (Manager, Executive, HR, Admin เท่านั้น)
router.post('/', authenticateToken, requireAnyPermission(['employee:create', 'employee:manage']), async (req, res) => {
    try {
        const {
            employee_code, title, first_name, last_name,
            first_name_en, last_name_en, national_id, birth_date,
            gender, email, phone, department_id, position_id,
            hire_date, salary
        } = req.body;

        const [result] = await db.query(`
            INSERT INTO employees
            (employee_code, title, first_name, last_name, first_name_en, last_name_en,
             national_id, birth_date, gender, email, phone, department_id, position_id,
             hire_date, salary)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [employee_code, title, first_name, last_name, first_name_en, last_name_en,
            national_id, birth_date, gender, email, phone, department_id, position_id,
            hire_date, salary]);

        res.status(201).json({
            message: 'Employee created successfully',
            employee_id: result.insertId
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// UPDATE employee (Manager, Executive, HR, Admin เท่านั้น)
router.put('/:id', authenticateToken, requireAnyPermission(['employee:update', 'employee:manage']), async (req, res) => {
    try {
        const {
            title, first_name, last_name, first_name_en, last_name_en,
            national_id, birth_date, gender, email, phone,
            department_id, position_id, salary, employment_status
        } = req.body;

        await db.query(`
            UPDATE employees
            SET title = ?, first_name = ?, last_name = ?, first_name_en = ?,
                last_name_en = ?, national_id = ?, birth_date = ?, gender = ?,
                email = ?, phone = ?, department_id = ?, position_id = ?,
                salary = ?, employment_status = ?
            WHERE employee_id = ?
        `, [title, first_name, last_name, first_name_en, last_name_en,
            national_id, birth_date, gender, email, phone, department_id,
            position_id, salary, employment_status, req.params.id]);

        res.json({ message: 'Employee updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE employee (Executive, Admin เท่านั้น)
router.delete('/:id', authenticateToken, requireAnyPermission(['employee:delete', 'employee:manage']), async (req, res) => {
    try {
        await db.query('DELETE FROM employees WHERE employee_id = ?', [req.params.id]);
        res.json({ message: 'Employee deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Search employees by work years
router.get('/search/years/:years', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT e.*, d.department_name, p.position_name,
                   TIMESTAMPDIFF(YEAR, e.hire_date, CURDATE()) as work_years
            FROM employees e
            LEFT JOIN departments d ON e.department_id = d.department_id
            LEFT JOIN positions p ON e.position_id = p.position_id
            WHERE TIMESTAMPDIFF(YEAR, e.hire_date, CURDATE()) >= ?
            ORDER BY work_years DESC
        `, [req.params.years]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add employee history (Manager, Executive, HR, Admin เท่านั้น)
router.post('/:id/history', authenticateToken, requireAnyPermission(['employee:update', 'employee:manage']), async (req, res) => {
    try {
        const {
            change_type, previous_department_id, new_department_id,
            previous_position_id, new_position_id, previous_salary,
            new_salary, effective_date, reason, notes, created_by
        } = req.body;

        const [result] = await db.query(`
            INSERT INTO employee_history
            (employee_id, change_type, previous_department_id, new_department_id,
             previous_position_id, new_position_id, previous_salary, new_salary,
             effective_date, reason, notes, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [req.params.id, change_type, previous_department_id, new_department_id,
            previous_position_id, new_position_id, previous_salary, new_salary,
            effective_date, reason, notes, created_by]);

        res.status(201).json({
            message: 'History record created successfully',
            history_id: result.insertId
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Transfer/Promote employee (with history tracking) - Manager or Executive only
router.post('/:id/transfer',
    authenticateToken,
    requireAnyPermission(['employee.transfer.subordinate', 'employee.transfer.all']),
    async (req, res) => {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const {
                new_department_id,
                new_position_id,
                new_salary,
                effective_date,
                reason,
                notes,
                change_type  // 'Transfer', 'Promotion', 'Salary_Adjustment'
            } = req.body;

            // Get current employee data
            const [employee] = await connection.query(
                'SELECT * FROM employees WHERE employee_id = ?',
                [req.params.id]
            );

            if (employee.length === 0) {
                await connection.rollback();
                return res.status(404).json({ error: 'ไม่พบพนักงานนี้' });
            }

            const currentEmployee = employee[0];

            // Check if manager has permission to transfer this employee
            if (!req.user.permissions.includes('employee.transfer.all')) {
                // Manager - can only transfer subordinates
                const [isSubordinate] = await connection.query(`
                    SELECT * FROM manager_subordinates
                    WHERE manager_id = ? AND subordinate_id = ? AND is_active = TRUE
                `, [req.user.employee_id, req.params.id]);

                if (isSubordinate.length === 0) {
                    await connection.rollback();
                    return res.status(403).json({
                        error: 'คุณไม่มีสิทธิ์ย้ายแผนก/เลื่อนตำแหน่งพนักงานคนนี้'
                    });
                }
            }

            // Update employee
            await connection.query(`
                UPDATE employees
                SET department_id = ?, position_id = ?, salary = ?
                WHERE employee_id = ?
            `, [
                new_department_id || currentEmployee.department_id,
                new_position_id || currentEmployee.position_id,
                new_salary || currentEmployee.salary,
                req.params.id
            ]);

            // Insert history record
            await connection.query(`
                INSERT INTO employee_history
                (employee_id, change_type, previous_department_id, new_department_id,
                 previous_position_id, new_position_id, previous_salary, new_salary,
                 effective_date, reason, notes, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                req.params.id,
                change_type || 'Transfer',
                currentEmployee.department_id,
                new_department_id || currentEmployee.department_id,
                currentEmployee.position_id,
                new_position_id || currentEmployee.position_id,
                currentEmployee.salary,
                new_salary || currentEmployee.salary,
                effective_date || new Date(),
                reason,
                notes,
                req.user.username
            ]);

            await connection.commit();

            res.json({
                message: change_type === 'Promotion' ? 'เลื่อนตำแหน่งสำเร็จ' : 'ย้ายแผนกสำเร็จ',
                employee_id: req.params.id
            });
        } catch (error) {
            await connection.rollback();
            res.status(500).json({ error: error.message });
        } finally {
            connection.release();
        }
    }
);

module.exports = router;
