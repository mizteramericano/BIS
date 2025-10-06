-- Insert Sample Termination Data
-- ข้อมูลตัวอย่างการเลิกจ้างพนักงาน

USE mitsubishi_bis;

-- ลบข้อมูลเก่า (ถ้ามี)
DELETE FROM employee_terminations;

-- รีเซ็ต AUTO_INCREMENT
ALTER TABLE employee_terminations AUTO_INCREMENT = 1;

-- ข้อมูลการเลิกจ้างตัวอย่าง
INSERT INTO employee_terminations (
    employee_id,
    termination_type,
    termination_date,
    last_working_day,
    reason,
    notice_period_days,
    severance_pay,
    unused_leave_payout,
    final_settlement,
    return_company_property,
    exit_interview_completed,
    exit_interview_notes,
    rehire_eligible,
    notes,
    processed_by,
    processed_date
) VALUES
-- 1. พนักงานลาออก (Resignation)
(
    1, -- EMP001 - นาย สมชาย ใจดี
    'Resignation',
    '2024-08-15',
    '2024-08-31',
    'ลาออกเพื่อไปทำงานที่บริษัทอื่น มีโอกาสที่ดีกว่า',
    30,
    0.00, -- ลาออกเองไม่ได้ค่าชดเชย
    8000.00,
    8000.00,
    'โน้ตบุ๊ค Dell Latitude, บัตรพนักงาน, กุญแจตู้ล็อกเกอร์',
    1,
    'พนักงานให้ความร่วมมือดี มีเหตุผลชัดเจน อยากลองงานใหม่',
    1,
    'พนักงานทำงานดี มีวินัย',
    1,
    '2024-09-01'
),

-- 2. พนักงานถูกเลิกจ้าง (Layoff)
(
    2, -- EMP002 - นางสาว สุดา รักงาน
    'Layoff',
    '2024-06-30',
    '2024-06-30',
    'ปรับโครงสร้างองค์กร ลดขนาดแผนก',
    60,
    270000.00, -- ทำงาน 8 ปี = 240 วันของค่าจ้าง (45,000 ÷ 30 × 240)
    12000.00,
    282000.00,
    'โน้ตบุ๊ค MacBook Pro, บัตรพนักงาน, อุปกรณ์การตลาด',
    1,
    'พนักงานดี แต่ต้องปรับโครงสร้าง ให้คำแนะนำเรื่องการหางานใหม่',
    1,
    'บริษัทให้ค่าชดเชยตามกฎหมาย และเขียนจดหมายรับรองให้',
    1,
    '2024-07-01'
),

-- 3. ตกลงร่วมกัน (Mutual Agreement)
(
    3, -- EMP003 - นาย วิชัย มั่นคง
    'Mutual_Agreement',
    '2024-09-15',
    '2024-09-30',
    'ตกลงยุติสัญญาจ้างร่วมกัน เพื่อไปเปิดธุรกิจส่วนตัว',
    15,
    252000.00, -- ทำงาน 8 ปี = 240 วันของค่าจ้าง (42,000 ÷ 30 × 240)
    10000.00,
    262000.00,
    'โน้ตบุ๊ค Lenovo ThinkPad, บัตรพนักงาน',
    1,
    'พนักงานต้องการไปเปิดธุรกิจ ตกลงยุติสัญญาร่วมกัน',
    1,
    'ตกลงยุติสัญญาร่วมกัน ให้ค่าชดเชยตามกฎหมาย',
    1,
    '2024-09-16'
);

-- แสดงผลลัพธ์
SELECT
    et.termination_id,
    e.employee_code,
    CONCAT(e.first_name, ' ', e.last_name) as employee_name,
    et.termination_type,
    et.termination_date,
    et.severance_pay
FROM employee_terminations et
JOIN employees e ON et.employee_id = e.employee_id
ORDER BY et.termination_id;

SELECT '✅ เพิ่มข้อมูลการเลิกจ้างสำเร็จ!' as Status;
