const mysql = require('mysql2/promise');
require('dotenv').config();

async function addSalaryAndHistory() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mitsubishi_bis'
    });

    try {
        console.log('💰 Adding salary and history data...\n');

        // 1. Update salaries based on position
        console.log('💵 Updating employee salaries...');

        // CEO - 150,000-200,000
        await connection.query(`
            UPDATE employees e
            JOIN positions p ON e.position_id = p.position_id
            SET e.salary = FLOOR(150000 + RAND() * 50000)
            WHERE p.position_code = 'CEO'
        `);

        // Director - 80,000-120,000
        await connection.query(`
            UPDATE employees e
            JOIN positions p ON e.position_id = p.position_id
            SET e.salary = FLOOR(80000 + RAND() * 40000)
            WHERE p.position_code = 'DIRECTOR'
        `);

        // Manager - 50,000-80,000
        await connection.query(`
            UPDATE employees e
            JOIN positions p ON e.position_id = p.position_id
            SET e.salary = FLOOR(50000 + RAND() * 30000)
            WHERE p.position_code = 'MANAGER'
        `);

        // Supervisor - 35,000-50,000
        await connection.query(`
            UPDATE employees e
            JOIN positions p ON e.position_id = p.position_id
            SET e.salary = FLOOR(35000 + RAND() * 15000)
            WHERE p.position_code = 'SUPERVISOR'
        `);

        // Senior - 30,000-40,000
        await connection.query(`
            UPDATE employees e
            JOIN positions p ON e.position_id = p.position_id
            SET e.salary = FLOOR(30000 + RAND() * 10000)
            WHERE p.position_code = 'SENIOR'
        `);

        // Staff - 20,000-30,000
        await connection.query(`
            UPDATE employees e
            JOIN positions p ON e.position_id = p.position_id
            SET e.salary = FLOOR(20000 + RAND() * 10000)
            WHERE p.position_code = 'STAFF'
        `);

        // Junior - 15,000-22,000
        await connection.query(`
            UPDATE employees e
            JOIN positions p ON e.position_id = p.position_id
            SET e.salary = FLOOR(15000 + RAND() * 7000)
            WHERE p.position_code = 'JUNIOR'
        `);

        console.log('✓ Updated salaries for all positions\n');

        // 2. Add employee history records
        console.log('📋 Adding employee history records...');

        // Get some employees to add history
        const [employees] = await connection.query(`
            SELECT employee_id, department_id, position_id, salary
            FROM employees
            ORDER BY RAND()
            LIMIT 30
        `);

        const changeTypes = ['Promotion', 'Transfer', 'Salary_Adjustment'];
        const reasons = [
            'ผลงานดีเด่น',
            'เลื่อนตำแหน่งตามวาระ',
            'ย้ายแผนกตามความเหมาะสม',
            'ปรับเงินเดือนประจำปี',
            'โครงสร้างองค์กรเปลี่ยนแปลง'
        ];

        let count = 0;
        for (const emp of employees) {
            const changeType = changeTypes[Math.floor(Math.random() * changeTypes.length)];
            const reason = reasons[Math.floor(Math.random() * reasons.length)];

            // Random date in the past 1-3 years
            const daysAgo = Math.floor(Math.random() * 1095) + 1;
            const effectiveDate = new Date();
            effectiveDate.setDate(effectiveDate.getDate() - daysAgo);

            if (changeType === 'Promotion') {
                // Promotion - increase position and salary
                const newSalary = Math.floor(emp.salary * 1.15); // 15% increase

                await connection.query(`
                    INSERT INTO employee_history
                    (employee_id, change_type, previous_position_id, new_position_id,
                     previous_salary, new_salary, effective_date, reason, created_by)
                    VALUES (?, 'Promotion', ?, ?, ?, ?, ?, ?, 'System')
                `, [emp.employee_id, emp.position_id, emp.position_id, emp.salary, newSalary,
                    effectiveDate.toISOString().split('T')[0], reason]);

            } else if (changeType === 'Transfer') {
                // Transfer - change department
                const newDept = (emp.department_id % 5) + 1;

                await connection.query(`
                    INSERT INTO employee_history
                    (employee_id, change_type, previous_department_id, new_department_id,
                     effective_date, reason, created_by)
                    VALUES (?, 'Transfer', ?, ?, ?, ?, 'System')
                `, [emp.employee_id, emp.department_id, newDept,
                    effectiveDate.toISOString().split('T')[0], reason]);

            } else if (changeType === 'Salary_Adjustment') {
                // Salary adjustment
                const adjustment = Math.floor(Math.random() * 3000) + 1000;
                const newSalary = emp.salary + adjustment;

                await connection.query(`
                    INSERT INTO employee_history
                    (employee_id, change_type, previous_salary, new_salary,
                     effective_date, reason, created_by)
                    VALUES (?, 'Salary_Adjustment', ?, ?, ?, ?, 'System')
                `, [emp.employee_id, emp.salary, newSalary,
                    effectiveDate.toISOString().split('T')[0], reason]);
            }

            count++;
        }

        console.log(`✓ Added ${count} history records\n`);

        // Summary
        const [salaryStats] = await connection.query(`
            SELECT
                p.position_name,
                COUNT(e.employee_id) as emp_count,
                MIN(e.salary) as min_salary,
                MAX(e.salary) as max_salary,
                FLOOR(AVG(e.salary)) as avg_salary
            FROM employees e
            JOIN positions p ON e.position_id = p.position_id
            WHERE e.salary IS NOT NULL
            GROUP BY p.position_id, p.position_name
            ORDER BY p.level
        `);

        console.log('📊 Salary Summary:');
        console.log('Position         | Count | Min      | Max      | Avg');
        console.log('----------------|-------|----------|----------|----------');
        salaryStats.forEach(stat => {
            const pos = stat.position_name.padEnd(15);
            const count = String(stat.emp_count).padStart(5);
            const min = String(stat.min_salary || 0).padStart(8);
            const max = String(stat.max_salary || 0).padStart(8);
            const avg = String(stat.avg_salary || 0).padStart(8);
            console.log(`${pos}| ${count} | ${min} | ${max} | ${avg}`);
        });

        const [historyCount] = await connection.query('SELECT COUNT(*) as count FROM employee_history');
        console.log(`\n✅ Total history records: ${historyCount[0].count}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

addSalaryAndHistory()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
