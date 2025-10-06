require('dotenv').config();
const mysql = require('mysql2/promise');

// การฝึกอบรมแยกตามระดับ
const trainingByLevel = {
    // ลูกน้อง (Level 1-3)
    staff: [
        { name: 'ปฐมนิเทศพนักงานใหม่', provider: 'ฝ่ายทรัพยากรบุคคล', hours: 8 },
        { name: 'การใช้งานระบบสารสนเทศพื้นฐาน', provider: 'ฝ่าย IT', hours: 4 },
        { name: 'ความปลอดภัยในการทำงาน', provider: 'ฝ่ายความปลอดภัย', hours: 6 },
        { name: 'มาตรฐาน ISO 9001', provider: 'บริษัท TUV', hours: 8 },
        { name: '5ส เพื่อการทำงานที่มีประสิทธิภาพ', provider: 'สถาบันเพิ่มผลผลิต', hours: 6 },
        { name: 'ทักษะการสื่อสารในองค์กร', provider: 'สถาบันพัฒนาบุคลากร', hours: 8 }
    ],

    // หัวหน้า (Level 4-6)
    supervisor: [
        { name: 'ทักษะการเป็นหัวหน้างานมืออาชีพ', provider: 'สถาบันพัฒนาผู้นำ', hours: 16 },
        { name: 'การบริหารทีมงานอย่างมีประสิทธิภาพ', provider: 'Dale Carnegie', hours: 16 },
        { name: 'การสื่อสารและการโค้ชชิ่ง', provider: 'สถาบันพัฒนาบุคลากร', hours: 12 },
        { name: 'การวางแผนและติดตามงาน', provider: 'สถาบันเพิ่มผลผลิต', hours: 8 },
        { name: 'Lean Manufacturing', provider: 'Japan Productivity Center', hours: 24 },
        { name: 'การบริหารความขัดแย้งในองค์กร', provider: 'สถาบันพัฒนาผู้นำ', hours: 8 },
        { name: 'การประเมินผลการปฏิบัติงาน', provider: 'ฝ่ายทรัพยากรบุคคล', hours: 6 }
    ],

    // ผู้บริหาร (Level 7+)
    executive: [
        { name: 'Strategic Leadership Program', provider: 'Harvard Business School', hours: 80 },
        { name: 'Executive MBA', provider: 'Sasin Graduate Institute', hours: 400 },
        { name: 'Change Management for Executives', provider: 'IMD Business School', hours: 40 },
        { name: 'Digital Transformation Strategy', provider: 'MIT Sloan', hours: 60 },
        { name: 'Corporate Governance and Ethics', provider: 'IOD Thailand', hours: 24 },
        { name: 'Financial Management for Executives', provider: 'Wharton School', hours: 40 },
        { name: 'Strategic Planning and Execution', provider: 'McKinsey & Company', hours: 32 },
        { name: 'Global Business Leadership', provider: 'INSEAD', hours: 60 }
    ]
};

// สวัสดิการแยกตามระดับ
const benefitsByLevel = {
    // ลูกน้อง (Level 1-3)
    staff: [
        { type: 'ประกันชีวิต', description: 'ทุนประกัน 300,000 บาท', amount: 300000 },
        { type: 'ประกันอุบัติเหตุ', description: 'ทุนประกัน 500,000 บาท', amount: 500000 },
        { type: 'ประกันสุขภาพ', description: 'OPD/IPD วงเงิน 50,000 บาท/ปี', amount: 50000 },
        { type: 'ตรวจสุขภาพประจำปี', description: 'แพ็กเกจพื้นฐาน', amount: null },
        { type: 'อาหารกลางวันฟรี', description: 'อาหารกลางวันฟรีทุกวัน', amount: null },
        { type: 'เครื่องแบบพนักงาน', description: '3 ชุดต่อปี', amount: null },
        { type: 'วันหยุดพักผ่อน', description: '10 วันต่อปี', amount: null },
        { type: 'โบนัสประจำปี', description: '1-2 เดือน (ตามผลงาน)', amount: null },
        { type: 'กองทุนสำรองเลี้ยงชีพ', description: 'บริษัทสมทบ 3%', amount: null }
    ],

    // หัวหน้า (Level 4-6)
    supervisor: [
        { type: 'ประกันชีวิต', description: 'ทุนประกัน 800,000 บาท', amount: 800000 },
        { type: 'ประกันอุบัติเหตุ', description: 'ทุนประกัน 1,500,000 บาท', amount: 1500000 },
        { type: 'ประกันสุขภาพ', description: 'OPD/IPD วงเงิน 150,000 บาท/ปี รวมครอบครัว', amount: 150000 },
        { type: 'ตรวจสุขภาพประจำปี', description: 'แพ็กเกจพรีเมียม', amount: null },
        { type: 'อาหารกลางวันฟรี', description: 'อาหารกลางวันฟรีทุกวัน', amount: null },
        { type: 'เครื่องแบบพนักงาน', description: '5 ชุดต่อปี', amount: null },
        { type: 'วันหยุดพักผ่อน', description: '15 วันต่อปี', amount: null },
        { type: 'โบนัสประจำปี', description: '3-5 เดือน (ตามผลงาน)', amount: null },
        { type: 'กองทุนสำรองเลี้ยงชีพ', description: 'บริษัทสมทบ 5%', amount: null },
        { type: 'ค่ารถ', description: 'ค่ารถเหมาจ่าย 5,000 บาท/เดือน', amount: 5000 },
        { type: 'ค่าโทรศัพท์', description: 'ค่าโทรศัพท์เหมาจ่าย 2,000 บาท/เดือน', amount: 2000 },
        { type: 'สินเชื่อพนักงาน', description: 'สินเชื่อดอกเบี้ยต่ำ วงเงิน 500,000 บาท', amount: 500000 }
    ],

    // ผู้บริหาร (Level 7+)
    executive: [
        { type: 'ประกันชีวิต', description: 'ทุนประกัน 3,000,000 บาท', amount: 3000000 },
        { type: 'ประกันอุบัติเหตุ', description: 'ทุนประกัน 5,000,000 บาท', amount: 5000000 },
        { type: 'ประกันสุขภาพ', description: 'OPD/IPD วงเงินไม่จำกัด รวมครอบครัว', amount: null },
        { type: 'ประกันโรคร้ายแรง', description: 'ทุนประกัน 2,000,000 บาท', amount: 2000000 },
        { type: 'ตรวจสุขภาพประจำปี', description: 'แพ็กเกจ Executive ที่โรงพยาบาลเอกชน', amount: null },
        { type: 'รถประจำตำแหน่ง', description: 'รถยนต์พร้อมคนขับ', amount: null },
        { type: 'ค่าน้ำมันรถ', description: 'ค่าน้ำมันเหมาจ่าย 15,000 บาท/เดือน', amount: 15000 },
        { type: 'ค่าโทรศัพท์', description: 'ค่าโทรศัพท์ไม่จำกัด', amount: null },
        { type: 'วันหยุดพักผ่อน', description: '20 วันต่อปี', amount: null },
        { type: 'โบนัสประจำปี', description: '6-12 เดือน (ตามผลประกอบการ)', amount: null },
        { type: 'Stock Options', description: 'สิทธิซื้อหุ้นบริษัท', amount: null },
        { type: 'กองทุนสำรองเลี้ยงชีพ', description: 'บริษัทสมทบ 10%', amount: null },
        { type: 'สมาชิกกอล์ฟ', description: 'สมาชิกสนามกอล์ฟระดับพรีเมียม', amount: null },
        { type: 'ค่าเล่าเรียนบุตร', description: 'เงินสนับสนุนค่าเล่าเรียนบุตร 100,000 บาท/ปี', amount: 100000 }
    ]
};

async function seedTrainingAndBenefitsByLevel() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('Connected to database\n');

        // ลบข้อมูลเก่า
        await connection.execute('DELETE FROM employee_training');
        await connection.execute('DELETE FROM employee_benefits');
        console.log('✓ Cleared existing training and benefits data\n');

        // ดึงข้อมูลพนักงานพร้อมระดับตำแหน่ง
        const [employees] = await connection.execute(`
            SELECT e.employee_id, e.first_name, e.last_name, p.position_name, p.level
            FROM employees e
            LEFT JOIN positions p ON e.position_id = p.position_id
            WHERE e.employment_status = 'Active'
            ORDER BY p.level DESC, e.employee_id
        `);

        let trainingCount = 0;
        let benefitCount = 0;

        for (const emp of employees) {
            let trainingPrograms = [];
            let benefitPackages = [];
            let levelType = '';

            // จัดระดับตามตำแหน่ง
            if (emp.level >= 7) {
                levelType = 'ผู้บริหาร';
                trainingPrograms = trainingByLevel.executive;
                benefitPackages = benefitsByLevel.executive;
            } else if (emp.level >= 4) {
                levelType = 'หัวหน้า';
                trainingPrograms = trainingByLevel.supervisor;
                benefitPackages = benefitsByLevel.supervisor;
            } else {
                levelType = 'พนักงาน';
                trainingPrograms = trainingByLevel.staff;
                benefitPackages = benefitsByLevel.staff;
            }

            console.log(`${emp.first_name} ${emp.last_name} - ${emp.position_name} (Level ${emp.level}) = ${levelType}`);

            // เพิ่มการฝึกอบรม
            for (const training of trainingPrograms) {
                const trainingDate = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
                const completionDate = new Date(trainingDate);
                completionDate.setDate(completionDate.getDate() + training.hours / 8);

                await connection.execute(`
                    INSERT INTO employee_training
                    (employee_id, training_name, training_provider, training_date, completion_date, status, notes)
                    VALUES (?, ?, ?, ?, ?, 'Completed', ?)
                `, [emp.employee_id, training.name, training.provider,
                    trainingDate.toISOString().split('T')[0],
                    completionDate.toISOString().split('T')[0],
                    `${training.hours} ชั่วโมง`]);

                trainingCount++;
            }

            // เพิ่มสวัสดิการ
            for (const benefit of benefitPackages) {
                await connection.execute(`
                    INSERT INTO employee_benefits
                    (employee_id, benefit_type, benefit_description, start_date, end_date, amount, status)
                    VALUES (?, ?, ?, ?, ?, ?, 'Active')
                `, [emp.employee_id, benefit.type, benefit.description,
                    '2024-01-01', '2025-12-31', benefit.amount]);

                benefitCount++;
            }

            console.log(`  ✓ ${trainingPrograms.length} training programs, ${benefitPackages.length} benefits\n`);
        }

        console.log('=' .repeat(60));
        console.log(`✓ Successfully seeded ${trainingCount} training records`);
        console.log(`✓ Successfully seeded ${benefitCount} benefit records`);
        console.log('=' .repeat(60));

    } catch (error) {
        console.error('Error seeding data:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\nDatabase connection closed');
        }
    }
}

seedTrainingAndBenefitsByLevel();
