const mysql = require('mysql2/promise');
require('dotenv').config();

async function assignDepartmentManagers() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mitsubishi_bis'
    });

    try {
        console.log('👔 Assigning department managers...');

        // Get all departments
        const [departments] = await connection.query('SELECT department_id, department_name FROM departments ORDER BY department_id');

        console.log('\n📋 Departments:');
        for (const dept of departments) {
            // Get first Manager level employee in this department
            const [manager] = await connection.query(`
                SELECT e.employee_id, e.employee_code, e.first_name, e.last_name
                FROM employees e
                JOIN positions p ON e.position_id = p.position_id
                WHERE e.department_id = ? AND p.level = 2
                LIMIT 1
            `, [dept.department_id]);

            if (manager.length > 0) {
                const mgr = manager[0];

                // Update department manager
                await connection.query('UPDATE departments SET manager_id = ? WHERE department_id = ?',
                    [mgr.employee_id, dept.department_id]);

                // Make sure this employee is a Manager in users table
                await connection.query(`
                    UPDATE users SET role_id = 2
                    WHERE employee_id = ? AND role_id != 3
                `, [mgr.employee_id]);

                console.log(`  ✓ ${dept.department_name.padEnd(25)} Manager: ${mgr.first_name} ${mgr.last_name} (${mgr.employee_code})`);
            } else {
                console.log(`  ⚠ ${dept.department_name.padEnd(25)} No manager found`);
            }
        }

        // Show final result
        console.log('\n📊 Department Managers:');
        const [result] = await connection.query(`
            SELECT d.department_name,
                   e.employee_code,
                   e.first_name,
                   e.last_name,
                   e.email
            FROM departments d
            LEFT JOIN employees e ON d.manager_id = e.employee_id
            ORDER BY d.department_id
        `);

        result.forEach(r => {
            if (r.employee_code) {
                console.log(`  ${r.department_name.padEnd(25)} ${r.first_name} ${r.last_name} (${r.employee_code})`);
                if (r.email) console.log(`    ${r.email}`);
            } else {
                console.log(`  ${r.department_name.padEnd(25)} ⚠ No manager`);
            }
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

assignDepartmentManagers()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
