const mysql = require('mysql2/promise');
require('dotenv').config();

async function redistributePositions() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mitsubishi_bis'
    });

    try {
        console.log('📊 Redistributing employee positions...');

        // Get total employees
        const [total] = await connection.query('SELECT COUNT(*) as count FROM employees');
        const totalEmployees = total[0].count;

        // Get all positions
        const [positions] = await connection.query('SELECT position_id FROM positions ORDER BY level');

        const perPosition = Math.floor(totalEmployees / positions.length);
        const remainder = totalEmployees % positions.length;

        console.log(`Total employees: ${totalEmployees}`);
        console.log(`Positions: ${positions.length}`);
        console.log(`~${perPosition} employees per position\n`);

        // Get all employees
        const [employees] = await connection.query('SELECT employee_id FROM employees ORDER BY employee_id');

        let empIndex = 0;
        for (let i = 0; i < positions.length; i++) {
            const posId = positions[i].position_id;
            // Give extra employee to first few positions if there's remainder
            const count = perPosition + (i < remainder ? 1 : 0);

            for (let j = 0; j < count && empIndex < employees.length; j++) {
                await connection.query('UPDATE employees SET position_id = ? WHERE employee_id = ?',
                    [posId, employees[empIndex].employee_id]);
                empIndex++;
            }
        }

        console.log('✅ Redistributed positions');

        // Show distribution
        const [distribution] = await connection.query(`
            SELECT p.position_name, p.level, COUNT(e.employee_id) as count
            FROM positions p
            LEFT JOIN employees e ON p.position_id = e.position_id
            GROUP BY p.position_id
            ORDER BY p.level
        `);

        console.log('\n📊 Position Distribution:');
        distribution.forEach(d => {
            const bar = '█'.repeat(Math.floor(d.count / 2));
            console.log(`  Level ${d.level} ${d.position_name.padEnd(25)} ${d.count.toString().padStart(3)} ${bar}`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

redistributePositions()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
