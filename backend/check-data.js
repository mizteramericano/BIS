const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkData() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mitsubishi_bis'
    });

    try {
        const [employees] = await connection.query('SELECT COUNT(*) as count FROM employees');
        const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
        const [depts] = await connection.query('SELECT COUNT(*) as count FROM departments');
        const [pos] = await connection.query('SELECT COUNT(*) as count FROM positions');

        console.log('📊 Database Status:');
        console.log(`   Employees: ${employees[0].count}`);
        console.log(`   Users: ${users[0].count}`);
        console.log(`   Departments: ${depts[0].count}`);
        console.log(`   Positions: ${pos[0].count}`);

        if (employees[0].count > 0) {
            const [sample] = await connection.query('SELECT employee_id, employee_code, first_name, last_name FROM employees LIMIT 5');
            console.log('\n👥 Sample Employees:');
            sample.forEach(emp => {
                console.log(`   ${emp.employee_code}: ${emp.first_name} ${emp.last_name}`);
            });
        }

        if (users[0].count > 0) {
            const [userSample] = await connection.query('SELECT u.username, r.role_name FROM users u JOIN roles r ON u.role_id = r.role_id LIMIT 5');
            console.log('\n🔐 Sample Users:');
            userSample.forEach(user => {
                console.log(`   ${user.username} (${user.role_name})`);
            });
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await connection.end();
    }
}

checkData();
