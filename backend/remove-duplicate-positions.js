const mysql = require('mysql2/promise');
require('dotenv').config();

async function removeDuplicates() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mitsubishi_bis'
    });

    try {
        console.log('🔍 Checking for duplicate positions...');

        // Find duplicates
        const [dups] = await connection.query(`
            SELECT position_id, position_name, COUNT(*) as count
            FROM positions
            GROUP BY position_id
            HAVING count > 1
        `);

        console.log(`Found ${dups.length} duplicate position IDs`);

        if (dups.length > 0) {
            console.log('Duplicates:', dups);

            // Remove duplicates (keep oldest)
            await connection.query(`
                DELETE p1 FROM positions p1
                INNER JOIN positions p2
                WHERE p1.position_id = p2.position_id
                AND p1.created_at > p2.created_at
            `);

            console.log('✅ Removed duplicates');
        }

        // Show current positions
        const [positions] = await connection.query('SELECT * FROM positions ORDER BY level, position_id');

        console.log('\n📋 Current Positions:');
        positions.forEach(p => {
            console.log(`  ${p.position_id}. ${p.position_name} (Level ${p.level})`);
        });

        console.log(`\nTotal: ${positions.length} positions`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

removeDuplicates()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
