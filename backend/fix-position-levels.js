const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixPositionLevels() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mitsubishi_bis'
    });

    try {
        console.log('🔧 Fixing position levels to be unique...');

        // Update levels to be unique
        const updates = [
            { id: 1, name: 'Chief Executive Officer', level: 1 },
            { id: 2, name: 'Manager', level: 2 },
            { id: 3, name: 'Supervisor', level: 3 },
            { id: 4, name: 'Senior', level: 4 },
            { id: 5, name: 'Junior', level: 5 },
            { id: 8, name: 'Analyst', level: 6 },
            { id: 6, name: 'Employee', level: 7 },
            { id: 9, name: 'Technician', level: 8 },
            { id: 7, name: 'Sales Representative', level: 9 },
            { id: 10, name: 'Operator', level: 10 }
        ];

        for (const pos of updates) {
            await connection.query(`
                UPDATE positions
                SET level = ?
                WHERE position_id = ?
            `, [pos.level, pos.id]);
        }

        console.log('✅ Updated all position levels');

        // Show updated positions
        const [positions] = await connection.query('SELECT * FROM positions ORDER BY level');

        console.log('\n📋 Updated Positions:');
        positions.forEach(p => {
            console.log(`  Level ${p.level}: ${p.position_name}`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

fixPositionLevels()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
