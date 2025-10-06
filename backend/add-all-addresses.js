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
        console.log('🏠 Adding addresses for all employees...\n');

        // Get all employees without addresses
        const [employees] = await connection.query(`
            SELECT e.employee_id
            FROM employees e
            LEFT JOIN employee_addresses ea ON e.employee_id = ea.employee_id
            WHERE ea.address_id IS NULL
        `);

        console.log(`Found ${employees.length} employees without addresses`);

        const provinces = ['กรุงเทพมหานคร', 'นนทบุรี', 'ปทุมธานี', 'สมุทรปราการ', 'เชียงใหม่', 'ภูเก็ต', 'ขอนแก่น', 'เชียงราย'];
        const districts = ['เมือง', 'บางกอกน้อย', 'ดอนเมือง', 'ลาดกระบัง', 'ห้วยขวาง', 'บางนา', 'พระโขนง', 'สาทร'];
        const subDistricts = ['บางซื่อ', 'จตุจักร', 'ลาดพร้าว', 'วังทองหลาง', 'สะพานสูง', 'บางกะปิ', 'ดินแดง', 'ราชเทวี'];

        let count = 0;
        for (const emp of employees) {
            const province = provinces[Math.floor(Math.random() * provinces.length)];
            const district = districts[Math.floor(Math.random() * districts.length)];
            const subDistrict = subDistricts[Math.floor(Math.random() * subDistricts.length)];
            const houseNo = Math.floor(Math.random() * 999) + 1;
            const moo = Math.floor(Math.random() * 20) + 1;
            const street = Math.floor(Math.random() * 50) + 1;
            const postal = province === 'กรุงเทพมหานคร'
                ? '10' + String(Math.floor(Math.random() * 900) + 100)
                : '11' + String(Math.floor(Math.random() * 900) + 100);

            // Current address
            await connection.query(`
                INSERT INTO employee_addresses
                (employee_id, address_type, address_line1, address_line2, sub_district, district, province, postal_code)
                VALUES (?, 'Current', ?, ?, ?, ?, ?, ?)
            `, [
                emp.employee_id,
                `${houseNo}/${moo}`,
                `หมู่ ${moo} ซอย ${street}`,
                subDistrict,
                district,
                province,
                postal
            ]);

            count++;
            if (count % 20 === 0) {
                console.log(`  Progress: ${count}/${employees.length}`);
            }
        }

        console.log(`\n✅ Added addresses for ${count} employees!`);

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
