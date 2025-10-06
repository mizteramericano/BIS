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
        console.log('🔐 Creating users...\n');

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password = await bcrypt.hash('password123', salt);

        // Clear existing users first
        await connection.query('TRUNCATE TABLE users');
        await connection.query('TRUNCATE TABLE manager_subordinates');

        // Create users for existing employees (from seed-employees.js IDs)
        const users = [
            { emp_id: 1, username: 'somchai.j', role: 3 },      // Executive
            { emp_id: 2, username: 'somying.r', role: 1 },      // Employee
            { emp_id: 3, username: 'wichai.m', role: 4 },       // HR Staff
            { emp_id: 4, username: 'pranee.s', role: 4 },       // HR Staff
            { emp_id: 5, username: 'tana.c', role: 2 },         // Manager
            { emp_id: 10, username: 'anucha.p', role: 1 },      // Employee
            { emp_id: 206, username: 'somchai2', role: 2 },     // Manager
            { emp_id: 207, username: 'somying2', role: 1 },     // Employee
            { emp_id: 208, username: 'wichai2', role: 1 },      // Employee
            { emp_id: 209, username: 'pranee2', role: 3 },      // Executive
        ];

        for (const user of users) {
            await connection.query(`
                INSERT INTO users (employee_id, username, password_hash, role_id, is_active)
                VALUES (?, ?, ?, ?, TRUE)
            `, [user.emp_id, user.username, password, user.role]);
        }
        console.log(`✓ Created ${users.length} users\n`);

        console.log('✅ User creation completed!\n');
        console.log('=== Login Credentials ===');
        console.log('Executive:');
        console.log('  somchai.j  / password123');
        console.log('  sunee.a    / password123');
        console.log('\nManagers:');
        console.log('  tana.c     / password123');
        console.log('  nattapong.w / password123');
        console.log('\nHR Staff:');
        console.log('  wichai.m   / password123');
        console.log('  pranee.s   / password123');
        console.log('\nEmployees:');
        console.log('  somying.r  / password123');
        console.log('  anucha.p   / password123');
        console.log('\nAll passwords: password123');

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

createUsers()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
