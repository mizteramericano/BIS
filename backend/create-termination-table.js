const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function createTerminationTable() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mitsubishi_bis',
        multipleStatements: true
    });

    try {
        console.log('📋 Creating employee_terminations table...');

        const sql = fs.readFileSync('./database/create-termination-table.sql', 'utf8');
        await connection.query(sql);

        console.log('✅ employee_terminations table created successfully!');

        // Check if table exists
        const [tables] = await connection.query(`
            SELECT TABLE_NAME
            FROM information_schema.TABLES
            WHERE TABLE_SCHEMA = 'mitsubishi_bis'
            AND TABLE_NAME = 'employee_terminations'
        `);

        if (tables.length > 0) {
            console.log('✓ Table verified in database');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

createTerminationTable()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
