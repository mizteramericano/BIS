const mysql = require('mysql2/promise');
require('dotenv').config();

async function addPersonalInfo() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mitsubishi_bis'
    });

    try {
        console.log('👤 Adding personal information for all employees...\n');

        // Get all employees
        const [employees] = await connection.query('SELECT employee_id, first_name, last_name FROM employees');

        console.log(`Found ${employees.length} employees\n`);

        const genders = ['Male', 'Female'];
        let count = 0;

        for (const emp of employees) {
            // Generate birth date (age 22-60)
            const age = Math.floor(Math.random() * 38) + 22; // 22-60 years
            const birthDate = new Date();
            birthDate.setFullYear(birthDate.getFullYear() - age);
            birthDate.setMonth(Math.floor(Math.random() * 12));
            birthDate.setDate(Math.floor(Math.random() * 28) + 1);

            // Generate national ID (13 digits)
            const nationalId = '1' +
                String(Math.floor(Math.random() * 9000) + 1000) +
                String(Math.floor(Math.random() * 90000) + 10000) +
                String(Math.floor(Math.random() * 900) + 100);

            // Generate email
            const email = `${emp.first_name.toLowerCase()}.${emp.last_name.toLowerCase()}@mitsubishi.co.th`
                .replace(/\s/g, '');

            // Generate phone (08x-xxx-xxxx or 09x-xxx-xxxx)
            const phonePrefix = Math.random() > 0.5 ? '08' : '09';
            const phoneMiddle = String(Math.floor(Math.random() * 9000) + 1000);
            const phoneLast = String(Math.floor(Math.random() * 9000) + 1000);
            const phone = `${phonePrefix}${phoneMiddle}${phoneLast}`;

            // Random gender
            const gender = genders[Math.floor(Math.random() * genders.length)];

            // Random title
            const title = gender === 'Male' ? 'นาย' : (Math.random() > 0.5 ? 'นาง' : 'นางสาว');

            // Update employee
            await connection.query(`
                UPDATE employees
                SET title = ?,
                    national_id = ?,
                    birth_date = ?,
                    gender = ?,
                    email = ?,
                    phone = ?
                WHERE employee_id = ?
            `, [title, nationalId, birthDate.toISOString().split('T')[0], gender, email, phone, emp.employee_id]);

            count++;
            if (count % 20 === 0) {
                console.log(`  Progress: ${count}/${employees.length}`);
            }
        }

        console.log(`\n✅ Updated personal information for ${count} employees!\n`);

        // Show sample data
        const [samples] = await connection.query(`
            SELECT employee_code, title, first_name, last_name,
                   DATE_FORMAT(birth_date, '%d/%m/%Y') as birth_date,
                   gender, email, phone
            FROM employees
            LIMIT 5
        `);

        console.log('📋 Sample Data:');
        samples.forEach(s => {
            console.log(`\n${s.employee_code} - ${s.title}${s.first_name} ${s.last_name}`);
            console.log(`  วันเกิด: ${s.birth_date}`);
            console.log(`  เพศ: ${s.gender}`);
            console.log(`  Email: ${s.email}`);
            console.log(`  โทร: ${s.phone}`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

addPersonalInfo()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
