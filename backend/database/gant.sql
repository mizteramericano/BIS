-- Authentication and Authorization Schema
USE mitsubishi_bis;

-- Roles Table
CREATE TABLE roles (
    role_id INT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    role_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Permissions Table
CREATE TABLE permissions (
    permission_id INT PRIMARY KEY AUTO_INCREMENT,
    permission_name VARCHAR(100) UNIQUE NOT NULL,
    permission_description TEXT,
    resource VARCHAR(50) NOT NULL,  -- e.g., 'leave', 'employee', 'department'
    action VARCHAR(50) NOT NULL,    -- e.g., 'create', 'read', 'update', 'delete', 'approve'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Role Permissions Table (Many-to-Many relationship)
CREATE TABLE role_permissions (
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(permission_id) ON DELETE CASCADE
);

-- Users Table (extends employees)
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

-- Manager Subordinate Relationship Table
CREATE TABLE manager_subordinates (
    manager_id INT NOT NULL,
    subordinate_id INT NOT NULL,
    department_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NULL,
    is_active BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (manager_id, subordinate_id, department_id),
    FOREIGN KEY (manager_id) REFERENCES employees(employee_id),
    FOREIGN KEY (subordinate_id) REFERENCES employees(employee_id),
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
);

-- Insert Default Roles
INSERT INTO roles (role_name, role_description) VALUES
('Employee', 'พนักงานทั่วไป - สามารถขอลา ดูข้อมูลของตนเอง'),
('Manager', 'หัวหน้าแผนก - สามารถอนุมัติการลา ย้ายแผนก/เลื่อนตำแหน่งลูกน้อง'),
('Executive', 'ผู้บริหาร - สามารถเข้าถึงและจัดการข้อมูลทั้งหมด'),
('HR', 'ฝ่ายทรัพยากรบุคคล - สามารถจัดการข้อมูลพนักงาน สวัสดิการ'),
('Admin', 'ผู้ดูแลระบบ - สามารถจัดการระบบทั้งหมด');

-- Insert Default Permissions
INSERT INTO permissions (permission_name, permission_description, resource, action) VALUES
-- Leave Permissions
('leave.create.own', 'ขอลาของตนเอง', 'leave', 'create'),
('leave.read.own', 'ดูประวัติการลาของตนเอง', 'leave', 'read'),
('leave.update.own', 'แก้ไขคำขอลาของตนเอง (ที่ยังไม่อนุมัติ)', 'leave', 'update'),
('leave.delete.own', 'ลบคำขอลาของตนเอง (ที่ยังไม่อนุมัติ)', 'leave', 'delete'),
('leave.approve.subordinate', 'อนุมัติ/ปฏิเสธการลาของลูกน้อง', 'leave', 'approve'),
('leave.read.subordinate', 'ดูการลาของลูกน้อง', 'leave', 'read'),
('leave.read.all', 'ดูการลาทั้งหมด', 'leave', 'read'),
('leave.approve.all', 'อนุมัติ/ปฏิเสธการลาทั้งหมด', 'leave', 'approve'),

-- Employee Permissions
('employee.read.own', 'ดูข้อมูลของตนเอง', 'employee', 'read'),
('employee.update.own', 'แก้ไขข้อมูลของตนเอง (บางส่วน)', 'employee', 'update'),
('employee.read.subordinate', 'ดูข้อมูลลูกน้อง', 'employee', 'read'),
('employee.read.all', 'ดูข้อมูลพนักงานทั้งหมด', 'employee', 'read'),
('employee.create', 'เพิ่มพนักงานใหม่', 'employee', 'create'),
('employee.update.all', 'แก้ไขข้อมูลพนักงานทั้งหมด', 'employee', 'update'),
('employee.delete', 'ลบพนักงาน', 'employee', 'delete'),

-- Transfer/Promotion Permissions
('employee.transfer.subordinate', 'ย้ายแผนก/เลื่อนตำแหน่งลูกน้อง', 'employee', 'transfer'),
('employee.transfer.all', 'ย้ายแผนก/เลื่อนตำแหน่งพนักงานทั้งหมด', 'employee', 'transfer'),

-- Department Permissions
('department.read.all', 'ดูข้อมูลแผนกทั้งหมด', 'department', 'read'),
('department.manage', 'จัดการแผนก', 'department', 'manage'),

-- Report Permissions
('report.view.own', 'ดูรายงานของตนเอง', 'report', 'read'),
('report.view.department', 'ดูรายงานของแผนก', 'report', 'read'),
('report.view.all', 'ดูรายงานทั้งหมด', 'report', 'read');

-- Assign Permissions to Roles

-- Employee Role Permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_name = 'Employee'
AND p.permission_name IN (
    'leave.create.own',
    'leave.read.own',
    'leave.update.own',
    'leave.delete.own',
    'employee.read.own',
    'employee.update.own',
    'report.view.own'
);

-- Manager Role Permissions (includes Employee permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_name = 'Manager'
AND p.permission_name IN (
    'leave.create.own',
    'leave.read.own',
    'leave.update.own',
    'leave.delete.own',
    'leave.approve.subordinate',
    'leave.read.subordinate',
    'employee.read.own',
    'employee.update.own',
    'employee.read.subordinate',
    'employee.transfer.subordinate',
    'department.read.all',
    'report.view.own',
    'report.view.department'
);

-- Executive Role Permissions (full access)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_name = 'Executive';

-- HR Role Permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_name = 'HR'
AND p.permission_name IN (
    'leave.create.own',
    'leave.read.own',
    'leave.read.all',
    'employee.read.all',
    'employee.create',
    'employee.update.all',
    'department.read.all',
    'report.view.all'
);

-- Admin Role Permissions (full access)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_name = 'Admin';

-- Create indexes for better performance
CREATE INDEX idx_users_employee_id ON users(employee_id);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_manager_subordinates_manager ON manager_subordinates(manager_id);
CREATE INDEX idx_manager_subordinates_subordinate ON manager_subordinates(subordinate_id);
CREATE INDEX idx_manager_subordinates_active ON manager_subordinates(is_active);
