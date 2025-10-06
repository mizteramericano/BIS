const mysql = require('mysql2/promise');

async function deleteTerminations() {
    let connection;

    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '142546',
            database: 'mitsubishi_bis'
        });

        console.log('📦 Connected to database');

        await connection.query('DELETE FROM employee_terminations');

        console.log('✅ All termination data deleted successfully!');

        await connection.end();
        console.log('🔌 Database connection closed');

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (connection) {
            await connection.end();
        }
        process.exit(1);
    }
}

deleteTerminations();
