require('dotenv').config();
const mysql = require('mysql2/promise');

async function seedLeaveRequests() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('Connected to database\n');

        // ดึงพนักงานทั้งหมด
        const [employees] = await connection.execute(`
            SELECT e.employee_id, e.first_name, e.last_name, e.department_id
            FROM employees e
            WHERE e.employment_status = 'Active'
            ORDER BY RAND()
            LIMIT 50
        `);

        console.log(`Creating leave requests for ${employees.length} employees\n`);

        const leaveTypes = ['ลาป่วย', 'ลากิจ', 'ลาพักร้อน'];
        const statuses = ['อนุมัติ', 'อนุมัติ', 'อนุมัติ', 'รออนุมัติ', 'ไม่อนุมัติ']; // มีโอกาสอนุมัติมากกว่า

        let leaveCount = 0;

        for (const emp of employees) {
            // แต่ละคนมี 2-5 คำร้องขอการลา
            const numLeaves = Math.floor(Math.random() * 4) + 2;

            // หาหัวหน้าแผนก (ผู้อนุมัติ)
            const [managers] = await connection.execute(`
                SELECT manager_id
                FROM departments
                WHERE department_id = ? AND manager_id IS NOT NULL
            `, [emp.department_id]);

            const approverId = managers.length > 0 ? managers[0].manager_id : null;

            for (let i = 0; i < numLeaves; i++) {
                const leaveType = leaveTypes[Math.floor(Math.random() * leaveTypes.length)];
                const status = statuses[Math.floor(Math.random() * statuses.length)];

                // สุ่มวันที่ย้อนหลัง 1 ปี
                const daysAgo = Math.floor(Math.random() * 365);
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - daysAgo);

                // ระยะเวลาการลา 1-5 วัน
                const totalDays = Math.floor(Math.random() * 5) + 1;
                const endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + totalDays - 1);

                // เหตุผลการลา
                const reasons = {
                    'ลาป่วย': ['ป่วยเป็นไข้หวัด', 'ปวดท้อง', 'ปวดหัวมาก', 'ไปพบแพทย์', 'พักรักษาตัวที่บ้าน'],
                    'ลากิจ': ['ธุระส่วนตัว', 'ติดธุระครอบครัว', 'ไปทำธุระที่ธนาคาร', 'พาครอบครัวไปโรงพยาบาล', 'ติดภารกิจสำคัญ'],
                    'ลาพักร้อน': ['พักผ่อนตามสิทธิ', 'ไปเที่ยวกับครอบครัว', 'กลับบ้านต่างจังหวัด', 'พักผ่อนประจำปี', 'ไปทำบุญที่วัด']
                };

                const reasonList = reasons[leaveType];
                const reason = reasonList[Math.floor(Math.random() * reasonList.length)];

                // Insert leave request
                const approvedDate = status === 'อนุมัติ' || status === 'ไม่อนุมัติ'
                    ? startDate.toISOString().slice(0, 19).replace('T', ' ')
                    : null;

                await connection.execute(`
                    INSERT INTO leave_requests
                    (employee_id, leave_type, start_date, end_date, total_days, reason, status, approved_by, approved_date)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    emp.employee_id,
                    leaveType,
                    startDate.toISOString().split('T')[0],
                    endDate.toISOString().split('T')[0],
                    totalDays,
                    reason,
                    status,
                    status === 'อนุมัติ' || status === 'ไม่อนุมัติ' ? approverId : null,
                    approvedDate
                ]);

                leaveCount++;
            }

            console.log(`✓ ${emp.first_name} ${emp.last_name}: สร้าง ${numLeaves} คำร้องขอการลา`);
        }

        console.log('\n' + '='.repeat(60));
        console.log(`✓ สร้างคำร้องขอการลาทั้งหมด ${leaveCount} รายการ`);
        console.log('='.repeat(60));

    } catch (error) {
        console.error('Error seeding leave requests:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\nDatabase connection closed');
        }
    }
}

seedLeaveRequests();
