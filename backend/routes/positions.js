const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET all positions
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT p.*,
                   COUNT(e.employee_id) as employee_count
            FROM positions p
            LEFT JOIN employees e ON p.position_id = e.position_id
            GROUP BY p.position_id
            ORDER BY p.level DESC, p.position_code
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET single position
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM positions WHERE position_id = ?',
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Position not found' });
        }

        // Get employees with this position
        const [employees] = await db.query(`
            SELECT e.*, d.department_name
            FROM employees e
            LEFT JOIN departments d ON e.department_id = d.department_id
            WHERE e.position_id = ?
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

// CREATE new position
router.post('/', async (req, res) => {
    try {
        const { position_code, position_name, level, description } = req.body;

        const [result] = await db.query(`
            INSERT INTO positions (position_code, position_name, level, description)
            VALUES (?, ?, ?, ?)
        `, [position_code, position_name, level, description]);

        res.status(201).json({
            message: 'Position created successfully',
            position_id: result.insertId
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// UPDATE position
router.put('/:id', async (req, res) => {
    try {
        const { position_name, level, description } = req.body;

        await db.query(`
            UPDATE positions
            SET position_name = ?, level = ?, description = ?
            WHERE position_id = ?
        `, [position_name, level, description, req.params.id]);

        res.json({ message: 'Position updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE position
router.delete('/:id', async (req, res) => {
    try {
        // Check if position has employees
        const [employees] = await db.query(
            'SELECT COUNT(*) as count FROM employees WHERE position_id = ?',
            [req.params.id]
        );

        if (employees[0].count > 0) {
            return res.status(400).json({
                error: 'Cannot delete position with employees'
            });
        }

        await db.query('DELETE FROM positions WHERE position_id = ?', [req.params.id]);
        res.json({ message: 'Position deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
