require('dotenv').config();
const mysql = require('mysql2/promise');

const benefitTypes = [
    // การเงินและโบนัส
    { type: 'โบนัสประจำปี', description: 'โบนัสตามผลประกอบการของบริษัท', amount: null },
    { type: 'กองทุนสำรองเลี้ยงชีพ', description: 'บริษัทสมทบกองทุนสำรองเลี้ยงชีพ 5%', amount: null },
    { type: 'เงินช่วยเหลือสมรส', description: 'เงินช่วยเหลือกรณีสมรส', amount: 5000 },
    { type: 'เงินช่วยเหลือคลอดบุตร', description: 'เงินช่วยเหลือกรณีคลอดบุตร', amount: 3000 },
    { type: 'เงินช่วยเหลืออุปสมบท', description: 'เงินช่วยเหลือกรณีอุปสมบท', amount: 3000 },
    { type: 'เงินช่วยเหลือเสียชีวิต', description: 'เงินช่วยเหลือกรณีเสียชีวิต', amount: 50000 },
    { type: 'เงินช่วยเหลือค่าเช่าบ้าน', description: 'เงินช่วยเหลือค่าเช่าบ้านรายเดือน', amount: 3000 },
    { type: 'เงินกู้สหกรณ์', description: 'สิทธิ์ในการกู้เงินจากสหกรณ์ออมทรัพย์', amount: null },
    { type: 'ส่วนลดสินค้า', description: 'ส่วนลดพิเศษสำหรับซื้อเครื่องใช้ไฟฟ้า Mitsubishi 30%', amount: null },

    // สุขภาพและประกัน
    { type: 'ประกันชีวิต', description: 'ประกันชีวิตกลุ่ม ทุนประกัน 500,000 บาท', amount: 500000 },
    { type: 'ประกันอุบัติเหตุ', description: 'ประกันอุบัติเหตุกลุ่ม ทุนประกัน 1,000,000 บาท', amount: 1000000 },
    { type: 'ประกันสุขภาพ', description: 'ประกันสุขภาพผู้ป่วยในและผู้ป่วยนอก', amount: 100000 },
    { type: 'ค่ารักษาพยาบาล', description: 'ค่ารักษาพยาบาลสำหรับพนักงานและครอบครัว', amount: 50000 },
    { type: 'ตรวจสุขภาพประจำปี', description: 'ตรวจสุขภาพประจำปีฟรี', amount: null },

    // การเดินทางและอาหาร
    { type: 'รถรับ-ส่งพนักงาน', description: 'บริการรถรับ-ส่งพนักงาน', amount: null },
    { type: 'อาหารกลางวันฟรี', description: 'อาหารกลางวันฟรีทุกวัน', amount: null },
    { type: 'ค่าเดินทาง', description: 'ค่าเดินทางเหมาจ่ายรายเดือน', amount: 1500 },

    // อื่นๆ
    { type: 'เครื่องแบบพนักงาน', description: 'เครื่องแบบพนักงาน 3 ชุดต่อปี', amount: null },
    { type: 'วันหยุดพักผ่อน', description: 'วันหยุดพักผ่อนประจำปี 10-15 วัน', amount: null },
    { type: 'ฟิตเนส', description: 'ห้องออกกำลังกายในบริษัท', amount: null }
];

// สวัสดิการพื้นฐานที่ทุกคนได้รับ
const basicBenefits = [
    'ประกันชีวิต',
    'ประกันอุบัติเหตุ',
    'ประกันสุขภาพ',
    'ตรวจสุขภาพประจำปี',
    'อาหารกลางวันฟรี',
    'เครื่องแบบพนักงาน',
    'วันหยุดพักผ่อน',
    'ฟิตเนส',
    'โบนัสประจำปี',
    'กองทุนสำรองเลี้ยงชีพ',
    'ส่วนลดสินค้า'
];

async function seedBenefits() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('Connected to database');

        // ลบข้อมูลสวัสดิการเก่า
        await connection.execute('DELETE FROM employee_benefits');
        console.log('Cleared existing benefits data');

        // ดึงข้อมูลพนักงานทั้งหมด
        const [employees] = await connection.execute('SELECT employee_id FROM employees');
        console.log(`Found ${employees.length} employees`);

        let benefitCount = 0;
        const startDate = '2024-01-01';
        const endDate = '2025-12-31';

        for (const employee of employees) {
            // เพิ่มสวัสดิการพื้นฐานให้ทุกคน
            for (const benefitType of basicBenefits) {
                const benefit = benefitTypes.find(b => b.type === benefitType);
                if (benefit) {
                    await connection.execute(
                        `INSERT INTO employee_benefits
                        (employee_id, benefit_type, benefit_description, start_date, end_date, amount, status)
                        VALUES (?, ?, ?, ?, ?, ?, 'Active')`,
                        [
                            employee.employee_id,
                            benefit.type,
                            benefit.description,
                            startDate,
                            endDate,
                            benefit.amount
                        ]
                    );
                    benefitCount++;
                }
            }

            // สุ่มเพิ่มสวัสดิการพิเศษบางอย่าง
            const random = Math.random();

            // 30% ได้เงินช่วยเหลือค่าเช่าบ้าน
            if (random < 0.3) {
                const benefit = benefitTypes.find(b => b.type === 'เงินช่วยเหลือค่าเช่าบ้าน');
                await connection.execute(
                    `INSERT INTO employee_benefits
                    (employee_id, benefit_type, benefit_description, start_date, end_date, amount, status)
                    VALUES (?, ?, ?, ?, ?, ?, 'Active')`,
                    [employee.employee_id, benefit.type, benefit.description, startDate, endDate, benefit.amount]
                );
                benefitCount++;
            }

            // 20% ได้ค่าเดินทาง
            if (random < 0.2) {
                const benefit = benefitTypes.find(b => b.type === 'ค่าเดินทาง');
                await connection.execute(
                    `INSERT INTO employee_benefits
                    (employee_id, benefit_type, benefit_description, start_date, end_date, amount, status)
                    VALUES (?, ?, ?, ?, ?, ?, 'Active')`,
                    [employee.employee_id, benefit.type, benefit.description, startDate, endDate, benefit.amount]
                );
                benefitCount++;
            }

            // 40% ใช้บริการรถรับ-ส่ง
            if (random < 0.4) {
                const benefit = benefitTypes.find(b => b.type === 'รถรับ-ส่งพนักงาน');
                await connection.execute(
                    `INSERT INTO employee_benefits
                    (employee_id, benefit_type, benefit_description, start_date, end_date, amount, status)
                    VALUES (?, ?, ?, ?, ?, ?, 'Active')`,
                    [employee.employee_id, benefit.type, benefit.description, startDate, endDate, benefit.amount]
                );
                benefitCount++;
            }

            // 10% ได้เงินกู้สหกรณ์
            if (random < 0.1) {
                const benefit = benefitTypes.find(b => b.type === 'เงินกู้สหกรณ์');
                await connection.execute(
                    `INSERT INTO employee_benefits
                    (employee_id, benefit_type, benefit_description, start_date, end_date, amount, status)
                    VALUES (?, ?, ?, ?, ?, ?, 'Active')`,
                    [employee.employee_id, benefit.type, benefit.description, startDate, endDate, 50000]
                );
                benefitCount++;
            }
        }

        console.log(`\n✓ Successfully inserted ${benefitCount} benefit records`);
        console.log(`✓ Average ${Math.round(benefitCount / employees.length)} benefits per employee`);

    } catch (error) {
        console.error('Error seeding benefits:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed');
        }
    }
}

seedBenefits();
