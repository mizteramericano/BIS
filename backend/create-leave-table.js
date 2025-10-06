require('dotenv').config();
const mysql = require('mysql2/promise');

async function createLeaveTable() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('Connected to database');

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS leave_requests (
                leave_id INT PRIMARY KEY AUTO_INCREMENT,
                employee_id INT NOT NULL,
                leave_type ENUM('ลาป่วย', 'ลากิจ', 'ลาพักร้อน', 'ลาคลอดบุตร', 'ลาอุปสมบท', 'ลาโดยไม่ได้รับค่าจ้าง', 'ลาอื่นๆ') NOT NULL,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                total_days DECIMAL(4,1) NOT NULL,
                reason TEXT NOT NULL,
                attachment_url VARCHAR(255),
                status ENUM('รออนุมัติ', 'อนุมัติ', 'ไม่อนุมัติ', 'ยกเลิก') DEFAULT 'รออนุมัติ',
                approved_by INT,
                approved_date DATETIME,
                remarks TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
                FOREIGN KEY (approved_by) REFERENCES employees(employee_id)
            )
        `);

        console.log('✓ สร้างตาราง leave_requests สำเร็จ');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed');
        }
    }
}

createLeaveTable();
