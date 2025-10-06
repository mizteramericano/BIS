const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function importEmployees() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mitsubishi_bis',
        multipleStatements: true
    });

    try {
        console.log('📥 Importing employees from SQL file...');

        // Delete extra employees (keep first 10)
        await connection.query('DELETE FROM employees WHERE employee_id > 10');
        console.log('✓ Cleared extra employees');

        // Read and execute SQL file
        const sql = fs.readFileSync('./database/insert_employees.sql', 'utf8');
        await connection.query(sql);

        const [result] = await connection.query('SELECT COUNT(*) as count FROM employees');
        console.log(`✅ Total employees: ${result[0].count}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

importEmployees()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
