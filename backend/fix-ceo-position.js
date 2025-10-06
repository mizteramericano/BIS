const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixCEOPosition() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mitsubishi_bis'
    });

    try {
        console.log('👔 Setting up CEO and redistributing positions...');

        // Get CEO position (level 1)
        const [ceoPos] = await connection.query('SELECT position_id FROM positions WHERE level = 1 LIMIT 1');
        const ceoPositionId = ceoPos[0].position_id;

        // Get all employees currently assigned to CEO position
        const [ceoEmployees] = await connection.query('SELECT employee_id FROM employees WHERE position_id = ? ORDER BY employee_id', [ceoPositionId]);

        console.log(`Found ${ceoEmployees.length} employees with CEO position`);

        // Keep only the first one as CEO (EMP001 - สมชาย)
        const ceoPerson = ceoEmployees[0].employee_id;

        // Get Manager position (level 2)
        const [mgrPos] = await connection.query('SELECT position_id FROM positions WHERE level = 2 LIMIT 1');
        const managerPositionId = mgrPos[0].position_id;

        // Move all other "CEOs" to Manager position
        let movedCount = 0;
        for (let i = 1; i < ceoEmployees.length; i++) {
            await connection.query('UPDATE employees SET position_id = ? WHERE employee_id = ?',
                [managerPositionId, ceoEmployees[i].employee_id]);
            movedCount++;
        }

        console.log(`✓ Kept 1 CEO, moved ${movedCount} to Manager position`);

        // Make sure CEO user has Executive role
        await connection.query('UPDATE users SET role_id = 3 WHERE employee_id = ?', [ceoPerson]);

        // Show final distribution
        const [distribution] = await connection.query(`
            SELECT p.position_name, p.level, COUNT(e.employee_id) as count
            FROM positions p
            LEFT JOIN employees e ON p.position_id = e.position_id
            GROUP BY p.position_id
            ORDER BY p.level
        `);

        console.log('\n📊 Updated Position Distribution:');
        distribution.forEach(d => {
            const bar = '█'.repeat(Math.floor(d.count / 2));
            const star = d.level === 1 ? ' ⭐' : '';
            console.log(`  Level ${d.level.toString().padStart(2)} ${d.position_name.padEnd(25)} ${d.count.toString().padStart(3)} ${bar}${star}`);
        });

        // Show CEO info
        const [ceoInfo] = await connection.query(`
            SELECT e.employee_code, e.first_name, e.last_name, e.email, p.position_name
            FROM employees e
            JOIN positions p ON e.position_id = p.position_id
            WHERE e.employee_id = ?
        `, [ceoPerson]);

        console.log('\n⭐ CEO:');
        console.log(`  ${ceoInfo[0].first_name} ${ceoInfo[0].last_name} (${ceoInfo[0].employee_code})`);
        if (ceoInfo[0].email) console.log(`  ${ceoInfo[0].email}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

fixCEOPosition()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
