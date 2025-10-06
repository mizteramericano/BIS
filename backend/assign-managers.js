require('dotenv').config();
const mysql = require('mysql2/promise');

async function assignManagers() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('Connected to database');

        // ดึงข้อมูลแผนกทั้งหมด
        const [departments] = await connection.execute(
            'SELECT department_id, department_name FROM departments'
        );

        console.log(`Found ${departments.length} departments\n`);

        for (const dept of departments) {
            // หาพนักงานในแผนกนั้นที่มีตำแหน่งสูงสุด (มีเงินเดือนสูงสุด) เพื่อให้เป็นหัวหน้า
            const [employees] = await connection.execute(
                `SELECT employee_id, first_name, last_name, salary, position_name
                FROM employees e
                LEFT JOIN positions p ON e.position_id = p.position_id
                WHERE e.department_id = ? AND e.employment_status = 'Active'
                ORDER BY e.salary DESC, e.hire_date ASC
                LIMIT 1`,
                [dept.department_id]
            );

            if (employees.length > 0) {
                const manager = employees[0];

                // กำหนดหัวหน้าแผนก
                await connection.execute(
                    'UPDATE departments SET manager_id = ? WHERE department_id = ?',
                    [manager.employee_id, dept.department_id]
                );

                console.log(`✓ ${dept.department_name}`);
                console.log(`  หัวหน้า: ${manager.first_name} ${manager.last_name}`);
                console.log(`  ตำแหน่ง: ${manager.position_name || '-'}`);
                console.log(`  เงินเดือน: ฿${parseFloat(manager.salary).toLocaleString()}\n`);
            } else {
                console.log(`⚠ ${dept.department_name}: ไม่มีพนักงาน\n`);
            }
        }

        console.log('✓ Successfully assigned managers to all departments');

    } catch (error) {
        console.error('Error assigning managers:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed');
        }
    }
}

assignManagers();
