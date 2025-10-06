-- Audit Logs Table
USE mitsubishi_bis;

CREATE TABLE IF NOT EXISTS audit_logs (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    username VARCHAR(100),
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_table_name (table_name),
    INDEX idx_timestamp (timestamp),
    INDEX idx_record_id (record_id)
);

-- สร้าง view สำหรับดูข้อมูล audit logs พร้อมข้อมูลผู้ใช้
CREATE OR REPLACE VIEW audit_logs_with_user AS
SELECT
    al.*,
    u.role_name,
    e.first_name,
    e.last_name,
    e.employee_code
FROM audit_logs al
LEFT JOIN users u ON al.user_id = u.user_id
LEFT JOIN employees e ON u.employee_id = e.employee_id
ORDER BY al.timestamp DESC;
