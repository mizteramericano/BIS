const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateManagerEmails() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mitsubishi_bis'
    });

    try {
        console.log('📧 Updating manager emails...');

        // Get all managers (users with role_id = 2)
        const [managers] = await connection.query(`
            SELECT u.employee_id, e.first_name, e.last_name, e.employee_code
            FROM users u
            JOIN employees e ON u.employee_id = e.employee_id
            WHERE u.role_id = 2
        `);

        let count = 0;
        for (const manager of managers) {
            // Generate email from name
            const email = `${manager.first_name.toLowerCase()}.${manager.last_name.toLowerCase()}@mitsubishi.co.th`;

            await connection.query(`
                UPDATE employees
                SET email = ?
                WHERE employee_id = ?
            `, [email, manager.employee_id]);

            console.log(`✓ ${manager.employee_code}: ${email}`);
            count++;
        }

        console.log(`\n✅ Updated ${count} manager emails`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

updateManagerEmails()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
