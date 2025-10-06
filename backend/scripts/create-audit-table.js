const db = require('../config/database');

async function createAuditTable() {
    try {
        console.log('Creating audit_logs table...');

        // Create audit_logs table
        await db.query(`
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
            )
        `);

        console.log('✓ audit_logs table created successfully!');

        // Create view
        try {
            await db.query(`
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
                ORDER BY al.timestamp DESC
            `);
            console.log('✓ audit_logs_with_user view created successfully!');
        } catch (viewError) {
            console.log('Note: View creation may have failed, but table is ready.');
        }

        console.log('\n✓ All done! Audit logs system is ready.');
        process.exit(0);
    } catch (error) {
        console.error('Error creating audit table:', error.message);
        process.exit(1);
    }
}

createAuditTable();
