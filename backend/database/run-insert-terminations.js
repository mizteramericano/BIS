const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runInsertTerminations() {
    let connection;

    try {
        // Create connection
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '142546',
            database: 'mitsubishi_bis',
            multipleStatements: true
        });

        console.log('📦 Connected to database');

        // Read SQL file
        const sqlFile = path.join(__dirname, 'insert_terminations.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');

        console.log('📄 Reading insert_terminations.sql...');

        // Execute SQL
        const [results] = await connection.query(sql);

        console.log('✅ Sample termination data inserted successfully!');
        console.log('📊 Total records inserted');

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

runInsertTerminations();
