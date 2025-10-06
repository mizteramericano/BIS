const mysql = require('mysql2/promise');
require('dotenv').config();

async function addAddresses() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mitsubishi_bis'
    });

    try {
        console.log('🏠 Adding employee addresses...');

        // Get all employees
        const [employees] = await connection.query('SELECT employee_id FROM employees');

        const provinces = ['กรุงเทพมหานคร', 'นนทบุรี', 'ปทุมธานี', 'สมุทรปราการ', 'ชลบุรี', 'ระยอง'];
        const districts = ['เมือง', 'ปากเกร็ด', 'คลองหลวง', 'บางพลี', 'ศรีราชา', 'บางละมุง'];
        const subDistricts = ['บางซื่อ', 'ท่าทราย', 'รังสิต', 'บางแก้ว', 'ศรีราชา', 'หนองปรือ'];

        let count = 0;
        for (const emp of employees) {
            const randomProvince = provinces[Math.floor(Math.random() * provinces.length)];
            const randomDistrict = districts[Math.floor(Math.random() * districts.length)];
            const randomSubDistrict = subDistricts[Math.floor(Math.random() * subDistricts.length)];
            const houseNo = Math.floor(Math.random() * 999) + 1;
            const soi = Math.floor(Math.random() * 50) + 1;
            const postalCode = Math.floor(Math.random() * 90000) + 10000;

            // Current address
            await connection.query(`
                INSERT INTO employee_addresses (employee_id, address_type, address_line1, address_line2, sub_district, district, province, postal_code)
                VALUES (?, 'Current', ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE address_line1 = VALUES(address_line1)
            `, [
                emp.employee_id,
                `${houseNo} หมู่ ${Math.floor(Math.random() * 10) + 1}`,
                `ซอย ${soi}`,
                randomSubDistrict,
                randomDistrict,
                randomProvince,
                postalCode
            ]);

            count++;
        }

        console.log(`✅ Added addresses for ${count} employees`);

        // Show sample
        const [sample] = await connection.query(`
            SELECT e.employee_code, e.first_name, e.last_name,
                   a.address_line1, a.sub_district, a.district, a.province
            FROM employees e
            JOIN employee_addresses a ON e.employee_id = a.employee_id
            LIMIT 5
        `);

        console.log('\n📍 Sample Addresses:');
        sample.forEach(emp => {
            console.log(`${emp.employee_code} (${emp.first_name} ${emp.last_name}):`);
            console.log(`   ${emp.address_line1}, ${emp.sub_district}, ${emp.district}, ${emp.province}\n`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

addAddresses()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
