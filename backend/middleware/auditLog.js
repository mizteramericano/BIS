const db = require('../config/database');

/**
 * Audit Log Middleware
 * บันทึก log ของการกระทำต่างๆ ในระบบ
 */

// ฟังก์ชันสำหรับบันทึก audit log
async function createAuditLog({
    userId,
    username,
    action,
    tableName,
    recordId = null,
    oldValues = null,
    newValues = null,
    ipAddress = null,
    userAgent = null,
    description = null
}) {
    try {
        await db.query(`
            INSERT INTO audit_logs
            (user_id, username, action, table_name, record_id, old_values, new_values, ip_address, user_agent, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            userId,
            username,
            action,
            tableName,
            recordId,
            oldValues ? JSON.stringify(oldValues) : null,
            newValues ? JSON.stringify(newValues) : null,
            ipAddress,
            userAgent,
            description
        ]);
    } catch (error) {
        console.error('Error creating audit log:', error);
        // ไม่ throw error เพื่อไม่ให้กระทบการทำงานหลัก
    }
}

// Middleware สำหรับดัก request และบันทึก log อัตโนมัติ
function auditLogMiddleware(options = {}) {
    const {
        action = 'UNKNOWN',
        tableName = 'UNKNOWN',
        getRecordId = null,
        getOldValues = null,
        getNewValues = null,
        description = null
    } = options;

    return async (req, res, next) => {
        // เก็บ original json method
        const originalJson = res.json.bind(res);

        // Override res.json เพื่อดัก response
        res.json = async function (data) {
            try {
                // บันทึก audit log หลังจาก response สำเร็จ
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    const recordId = getRecordId ? getRecordId(req, data) : req.params.id || null;
                    const oldValues = getOldValues ? await getOldValues(req) : null;
                    const newValues = getNewValues ? getNewValues(req, data) : req.body;

                    await createAuditLog({
                        userId: req.user?.user_id || null,
                        username: req.user?.username || 'system',
                        action: typeof action === 'function' ? action(req) : action,
                        tableName: typeof tableName === 'function' ? tableName(req) : tableName,
                        recordId,
                        oldValues,
                        newValues,
                        ipAddress: req.ip || req.connection.remoteAddress,
                        userAgent: req.get('user-agent'),
                        description: typeof description === 'function' ? description(req, data) : description
                    });
                }
            } catch (error) {
                console.error('Error in audit log middleware:', error);
            }

            // เรียก original json method
            return originalJson(data);
        };

        next();
    };
}

// ฟังก์ชันช่วยสำหรับดึงข้อมูลเก่าก่อนอัปเดต
async function getEmployeeOldValues(employeeId) {
    try {
        const [rows] = await db.query('SELECT * FROM employees WHERE employee_id = ?', [employeeId]);
        return rows[0] || null;
    } catch (error) {
        console.error('Error getting old employee values:', error);
        return null;
    }
}

async function getDepartmentOldValues(departmentId) {
    try {
        const [rows] = await db.query('SELECT * FROM departments WHERE department_id = ?', [departmentId]);
        return rows[0] || null;
    } catch (error) {
        console.error('Error getting old department values:', error);
        return null;
    }
}

async function getPositionOldValues(positionId) {
    try {
        const [rows] = await db.query('SELECT * FROM positions WHERE position_id = ?', [positionId]);
        return rows[0] || null;
    } catch (error) {
        console.error('Error getting old position values:', error);
        return null;
    }
}

async function getUserOldValues(userId) {
    try {
        const [rows] = await db.query('SELECT * FROM users WHERE user_id = ?', [userId]);
        return rows[0] || null;
    } catch (error) {
        console.error('Error getting old user values:', error);
        return null;
    }
}

module.exports = {
    createAuditLog,
    auditLogMiddleware,
    getEmployeeOldValues,
    getDepartmentOldValues,
    getPositionOldValues,
    getUserOldValues
};
