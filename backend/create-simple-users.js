const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createUsers() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mitsubishi_bis'
    });

    try {
        console.log('Creating users...');

        // Get first 20 employees
        const [employees] = await connection.query(`
            SELECT employee_id, first_name, last_name, email
            FROM employees
            ORDER BY employee_id
            LIMIT 20
        `);

        const salt = await bcrypt.genSalt(10);
        const password = await bcrypt.hash('password123', salt);

        // Clear existing users
        await connection.query('DELETE FROM users');
        console.log('✓ Cleared old users');

        // Create users for first 20 employees
        let count = 0;
        for (const emp of employees) {
            const username = `emp${emp.employee_id}`;
            let role_id = 1; // Default: Employee

            if (count === 0) role_id = 3; // Executive
            else if (count < 5) role_id = 2; // Manager
            else if (count < 8) role_id = 4; // HR

            await connection.query(`
                INSERT INTO users (employee_id, username, password_hash, role_id, is_active)
                VALUES (?, ?, ?, ?, TRUE)
            `, [emp.employee_id, username, password, role_id]);

            count++;
        }

        console.log(`✓ Created ${count} users\n`);
        console.log('=== Login Credentials ===');
        console.log('Executive:  emp1  / password123');
        console.log('Manager:    emp2  / password123');
        console.log('Manager:    emp3  / password123');
        console.log('HR Staff:   emp6  / password123');
        console.log('Employee:   emp9  / password123');
        console.log('\nAll passwords: password123');
        console.log('Username format: emp[number] (emp1 to emp20)');

    } catch (error) {
        console.error('Error:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

createUsers()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
