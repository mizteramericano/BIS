const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixData() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mitsubishi_bis'
    });

    try {
        console.log('🔧 Fixing positions and adding data...\n');

        // 1. Fix positions - remove duplicates and reorganize levels
        console.log('📋 Fixing positions...');

        // Disable foreign key checks temporarily
        await connection.query('SET FOREIGN_KEY_CHECKS=0');

        // Delete old positions
        await connection.query('DELETE FROM positions');

        // Create clean position structure
        const positions = [
            { id: 1, code: 'CEO', name: 'Chief Executive Officer', level: 1 },
            { id: 2, code: 'DIRECTOR', name: 'Director', level: 2 },
            { id: 3, code: 'MANAGER', name: 'Manager', level: 3 },
            { id: 4, code: 'SUPERVISOR', name: 'Supervisor', level: 4 },
            { id: 5, code: 'SENIOR', name: 'Senior', level: 5 },
            { id: 6, code: 'STAFF', name: 'Staff', level: 6 },
            { id: 7, code: 'JUNIOR', name: 'Junior', level: 7 },
        ];

        for (const pos of positions) {
            await connection.query(`
                INSERT INTO positions (position_id, position_code, position_name, level)
                VALUES (?, ?, ?, ?)
            `, [pos.id, pos.code, pos.name, pos.level]);
        }
        console.log(`✓ Created ${positions.length} positions with unique levels\n`);

        // Re-enable foreign key checks
        await connection.query('SET FOREIGN_KEY_CHECKS=1');

        // 2. Update departments with managers
        console.log('🏢 Updating department managers...');
        const deptManagers = [
            { dept_id: 1, manager_id: 1 },   // IT - สมชาย
            { dept_id: 2, manager_id: 3 },   // HR - วิชัย
            { dept_id: 3, manager_id: 5 },   // Finance - ธนา
            { dept_id: 4, manager_id: 206 }, // Sales - สมชาย2
            { dept_id: 5, manager_id: 9 },   // Manufacturing - วิไล
        ];

        for (const dm of deptManagers) {
            await connection.query(`
                UPDATE departments
                SET manager_id = ?
                WHERE department_id = ?
            `, [dm.manager_id, dm.dept_id]);
        }
        console.log('✓ Updated department managers\n');

        // 3. Add addresses for employees
        console.log('🏠 Adding addresses for employees...');

        // Get all employees
        const [employees] = await connection.query('SELECT employee_id FROM employees LIMIT 20');

        const provinces = ['กรุงเทพมหานคร', 'นนทบุรี', 'ปทุมธานี', 'สมุทรปราการ', 'เชียงใหม่'];
        const districts = ['เมือง', 'บางกอกน้อย', 'ดอนเมือง', 'ลาดกระบัง', 'ห้วยขวาง'];
        const subDistricts = ['บางซื่อ', 'จตุจักร', 'ลาดพร้าว', 'วังทองหลาง', 'สะพานสูง'];

        let addressCount = 0;
        for (const emp of employees) {
            // Current address
            const province = provinces[Math.floor(Math.random() * provinces.length)];
            const district = districts[Math.floor(Math.random() * districts.length)];
            const subDistrict = subDistricts[Math.floor(Math.random() * subDistricts.length)];
            const houseNo = Math.floor(Math.random() * 999) + 1;
            const street = Math.floor(Math.random() * 50) + 1;
            const postal = province === 'กรุงเทพมหานคร' ? '10' + (Math.floor(Math.random() * 900) + 100) : '11' + (Math.floor(Math.random() * 900) + 100);

            await connection.query(`
                INSERT INTO employee_addresses
                (employee_id, address_type, address_line1, sub_district, district, province, postal_code)
                VALUES (?, 'Current', ?, ?, ?, ?, ?)
            `, [emp.employee_id, `${houseNo} ซอย ${street}`, subDistrict, district, province, postal]);

            addressCount++;
        }
        console.log(`✓ Added ${addressCount} addresses\n`);

        // 4. Update some employee positions
        console.log('👔 Updating employee positions...');
        await connection.query('UPDATE employees SET position_id = 1 WHERE employee_id = 1'); // CEO
        await connection.query('UPDATE employees SET position_id = 3 WHERE employee_id IN (3, 5, 9, 206)'); // Managers
        await connection.query('UPDATE employees SET position_id = 4 WHERE employee_id IN (2, 4)'); // Supervisors
        await connection.query('UPDATE employees SET position_id = 6 WHERE employee_id NOT IN (1, 2, 3, 4, 5, 9, 206)'); // Staff
        console.log('✓ Updated employee positions\n');

        console.log('✅ All data fixed and updated successfully!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

fixData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
