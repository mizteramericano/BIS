const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function resetAndSeed() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mitsubishi_bis'
    });

    try {
        console.log('🔄 Resetting and seeding database...\n');

        // Disable foreign key checks
        await connection.query('SET FOREIGN_KEY_CHECKS=0');

        // Clear tables
        console.log('🗑️  Clearing existing data...');
        await connection.query('TRUNCATE TABLE users');
        await connection.query('TRUNCATE TABLE manager_subordinates');
        await connection.query('TRUNCATE TABLE leave_requests');
        await connection.query('DELETE FROM employees');
        console.log('✓ Data cleared\n');

        // Enable foreign key checks
        await connection.query('SET FOREIGN_KEY_CHECKS=1');

        // Insert departments first
        console.log('🏢 Creating departments...');
        const departments = [
            { id: 1, code: 'IT', name: 'Information Technology' },
            { id: 2, code: 'HR', name: 'Human Resources' },
            { id: 3, code: 'FIN', name: 'Finance' },
            { id: 4, code: 'SAL', name: 'Sales' },
            { id: 5, code: 'MFG', name: 'Manufacturing' },
        ];

        for (const dept of departments) {
            await connection.query(`
                INSERT INTO departments (department_id, department_code, department_name)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE department_name = VALUES(department_name)
            `, [dept.id, dept.code, dept.name]);
        }
        console.log(`✓ Created ${departments.length} departments\n`);

        // Insert positions
        console.log('💼 Creating positions...');
        const positions = [
            { id: 1, code: 'CEO', name: 'Chief Executive Officer', level: 1 },
            { id: 2, code: 'MGR', name: 'Manager', level: 2 },
            { id: 3, code: 'SUP', name: 'Supervisor', level: 3 },
            { id: 4, code: 'SR', name: 'Senior', level: 4 },
            { id: 5, code: 'JR', name: 'Junior', level: 5 },
            { id: 6, code: 'EMP', name: 'Employee', level: 6 },
            { id: 7, code: 'SALES', name: 'Sales Representative', level: 6 },
            { id: 8, code: 'ANALYST', name: 'Analyst', level: 5 },
            { id: 9, code: 'TECH', name: 'Technician', level: 6 },
            { id: 10, code: 'OP', name: 'Operator', level: 7 },
        ];

        for (const pos of positions) {
            await connection.query(`
                INSERT INTO positions (position_id, position_code, position_name, level)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE position_name = VALUES(position_name)
            `, [pos.id, pos.code, pos.name, pos.level]);
        }
        console.log(`✓ Created ${positions.length} positions\n`);

        // Insert employees (basic data)
        console.log('👥 Creating employees...');
        const employees = [
            { id: 1, code: 'ME001', fname: 'สมชาย', lname: 'จันทร์แจ่ม', dept: 1, pos: 1 },
            { id: 2, code: 'ME002', fname: 'สมหญิง', lname: 'ร่มเย็น', dept: 1, pos: 2 },
            { id: 3, code: 'ME003', fname: 'วิชัย', lname: 'มั่นคง', dept: 2, pos: 3 },
            { id: 4, code: 'ME004', fname: 'ประนี', lname: 'สุขใจ', dept: 2, pos: 4 },
            { id: 5, code: 'ME005', fname: 'ธนา', lname: 'ชัยวัฒน์', dept: 3, pos: 5 },
            { id: 6, code: 'ME006', fname: 'สุรชัย', lname: 'วงศ์ษา', dept: 3, pos: 6 },
            { id: 7, code: 'ME007', fname: 'จันจิรา', lname: 'สว่างจิต', dept: 4, pos: 7 },
            { id: 8, code: 'ME008', fname: 'ประยุทธ', lname: 'ศรีสุข', dept: 4, pos: 8 },
            { id: 9, code: 'ME009', fname: 'วิไล', lname: 'สมบูรณ์', dept: 5, pos: 9 },
            { id: 10, code: 'ME010', fname: 'อนุชา', lname: 'พูลสวัสดิ์', dept: 5, pos: 10 },
        ];

        for (const emp of employees) {
            await connection.query(`
                INSERT INTO employees (employee_id, employee_code, first_name, last_name, department_id, position_id, hire_date, employment_status)
                VALUES (?, ?, ?, ?, ?, ?, '2020-01-01', 'Active')
            `, [emp.id, emp.code, emp.fname, emp.lname, emp.dept, emp.pos]);
        }
        console.log(`✓ Created ${employees.length} employees\n`);

        // Create users
        console.log('🔐 Creating users...');
        const salt = await bcrypt.genSalt(10);
        const password = await bcrypt.hash('password123', salt);

        const users = [
            { emp_id: 1, username: 'somchai.j', role: 3 },    // Executive
            { emp_id: 2, username: 'somying.r', role: 1 },    // Employee
            { emp_id: 3, username: 'wichai.m', role: 4 },     // HR Staff
            { emp_id: 4, username: 'pranee.s', role: 4 },     // HR Staff
            { emp_id: 5, username: 'tana.c', role: 2 },       // Manager
            { emp_id: 6, username: 'surachai.w', role: 1 },   // Employee
            { emp_id: 7, username: 'janjira.s', role: 1 },    // Employee
            { emp_id: 8, username: 'prayuth.s', role: 1 },    // Employee
            { emp_id: 9, username: 'wilai.s', role: 2 },      // Manager
            { emp_id: 10, username: 'anucha.p', role: 1 },    // Employee
        ];

        for (const user of users) {
            await connection.query(`
                INSERT INTO users (employee_id, username, password_hash, role_id, is_active)
                VALUES (?, ?, ?, ?, TRUE)
            `, [user.emp_id, user.username, password, user.role]);
        }
        console.log(`✓ Created ${users.length} users\n`);

        console.log('✅ Database reset and seeding completed!\n');
        console.log('=== Login Credentials ===');
        console.log('Executive:  somchai.j  / password123');
        console.log('Manager:    tana.c     / password123');
        console.log('Manager:    wilai.s    / password123');
        console.log('HR Staff:   wichai.m   / password123');
        console.log('Employee:   somying.r  / password123');
        console.log('\nAll passwords: password123');

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

resetAndSeed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
