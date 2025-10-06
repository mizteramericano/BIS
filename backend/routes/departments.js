const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET all departments
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT d.*,
                   e.first_name as manager_first_name,
                   e.last_name as manager_last_name,
                   COUNT(DISTINCT emp.employee_id) as employee_count
            FROM departments d
            LEFT JOIN employees e ON d.manager_id = e.employee_id
            LEFT JOIN employees emp ON d.department_id = emp.department_id
            GROUP BY d.department_id
            ORDER BY d.department_code
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET single department
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT d.*,
                   e.first_name as manager_first_name,
                   e.last_name as manager_last_name
            FROM departments d
            LEFT JOIN employees e ON d.manager_id = e.employee_id
            WHERE d.department_id = ?
        `, [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Department not found' });
        }

        // Get employees in this department
        const [employees] = await db.query(`
            SELECT e.*, p.position_name
            FROM employees e
            LEFT JOIN positions p ON e.position_id = p.position_id
            WHERE e.department_id = ?
            ORDER BY e.employee_code
        `, [req.params.id]);

        res.json({
            ...rows[0],
            employees
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// CREATE new department
router.post('/', async (req, res) => {
    try {
        const { department_code, department_name, description, manager_id } = req.body;

        const [result] = await db.query(`
            INSERT INTO departments (department_code, department_name, description, manager_id)
            VALUES (?, ?, ?, ?)
        `, [department_code, department_name, description, manager_id]);

        res.status(201).json({
            message: 'Department created successfully',
            department_id: result.insertId
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// UPDATE department
router.put('/:id', async (req, res) => {
    try {
        const { department_name, description, manager_id } = req.body;

        await db.query(`
            UPDATE departments
            SET department_name = ?, description = ?, manager_id = ?
            WHERE department_id = ?
        `, [department_name, description, manager_id, req.params.id]);

        res.json({ message: 'Department updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE department
router.delete('/:id', async (req, res) => {
    try {
        // Check if department has employees
        const [employees] = await db.query(
            'SELECT COUNT(*) as count FROM employees WHERE department_id = ?',
            [req.params.id]
        );

        if (employees[0].count > 0) {
            return res.status(400).json({
                error: 'Cannot delete department with employees'
            });
        }

        await db.query('DELETE FROM departments WHERE department_id = ?', [req.params.id]);
        res.json({ message: 'Department deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
