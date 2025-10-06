# คู่มือการตั้งค่าระบบสิทธิ์การเข้าใช้งาน (Authentication & Authorization)

## การติดตั้ง

### 1. ติดตั้ง Dependencies
```bash
cd backend
npm install
```

### 2. สร้างตารางในฐานข้อมูล
```bash
# Run auth schema
mysql -u root -p mitsubishi_bis < database/auth-schema.sql
```

### 3. เพิ่มข้อมูล Users และ Manager Relationships
```bash
node seed-users.js
```

## โครงสร้างระบบสิทธิ์

### Roles (บทบาท)

1. **Employee** (พนักงานทั่วไป)
   - ขอลาของตนเอง
   - ดูข้อมูลและประวัติการลาของตนเอง
   - แก้ไขคำขอลาที่ยังไม่ได้รับการอนุมัติ

2. **Manager** (หัวหน้า)
   - สิทธิ์ทั้งหมดของ Employee
   - อนุมัติ/ปฏิเสธการลาของลูกน้อง
   - ดูข้อมูลลูกน้อง
   - ย้ายแผนก/เลื่อนตำแหน่งลูกน้อง

3. **Executive** (ผู้บริหาร)
   - เข้าถึงและจัดการข้อมูลทั้งหมด
   - อนุมัติการลาทั้งหมด
   - ย้ายแผนก/เลื่อนตำแหน่งพนักงานทั้งหมด

4. **HR** (ฝ่ายทรัพยากรบุคคล)
   - จัดการข้อมูลพนักงาน
   - ดูการลาทั้งหมด
   - จัดการสวัสดิการ

5. **Admin** (ผู้ดูแลระบบ)
   - สิทธิ์เต็มในระบบทั้งหมด

### Permissions (สิทธิ์การใช้งาน)

#### Leave (การลา)
- `leave.create.own` - ขอลาของตนเอง
- `leave.read.own` - ดูการลาของตนเอง
- `leave.update.own` - แก้ไขการลาของตนเอง
- `leave.delete.own` - ลบการลาของตนเอง
- `leave.approve.subordinate` - อนุมัติการลาของลูกน้อง
- `leave.read.subordinate` - ดูการลาของลูกน้อง
- `leave.read.all` - ดูการลาทั้งหมด
- `leave.approve.all` - อนุมัติการลาทั้งหมด

#### Employee (พนักงาน)
- `employee.read.own` - ดูข้อมูลของตนเอง
- `employee.update.own` - แก้ไขข้อมูลของตนเอง
- `employee.read.subordinate` - ดูข้อมูลลูกน้อง
- `employee.read.all` - ดูข้อมูลพนักงานทั้งหมด
- `employee.transfer.subordinate` - ย้ายแผนก/เลื่อนตำแหน่งลูกน้อง
- `employee.transfer.all` - ย้ายแผนก/เลื่อนตำแหน่งทั้งหมด

## API Endpoints

### Authentication

#### 1. Register (สร้างบัญชีผู้ใช้)
```http
POST /api/auth/register
Content-Type: application/json

{
  "employee_id": 1,
  "username": "somchai.j",
  "password": "password123",
  "role_id": 1
}
```

#### 2. Login (เข้าสู่ระบบ)
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "somchai.j",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "เข้าสู่ระบบสำเร็จ",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": 1,
    "employee_id": 1,
    "username": "somchai.j",
    "role": "Executive",
    "first_name": "สมชาย",
    "last_name": "ใจดี",
    "permissions": ["leave.create.own", "leave.approve.all", ...]
  }
}
```

#### 3. Get Current User (ข้อมูลผู้ใช้ปัจจุบัน)
```http
GET /api/auth/me
Authorization: Bearer {token}
```

#### 4. Change Password (เปลี่ยนรหัสผ่าน)
```http
POST /api/auth/change-password
Authorization: Bearer {token}
Content-Type: application/json

{
  "current_password": "password123",
  "new_password": "newpassword456"
}
```

### Leave Management (ต้องมี Authentication)

#### 1. สร้างคำขอลา (พนักงานทุกคน)
```http
POST /api/leaves
Authorization: Bearer {token}
Content-Type: application/json

{
  "leave_type": "ลาป่วย",
  "start_date": "2025-10-05",
  "end_date": "2025-10-06",
  "total_days": 2,
  "reason": "ป่วยเป็นไข้หวัด"
}
```

#### 2. อนุมัติ/ปฏิเสธการลา (หัวหน้า/ผู้บริหารเท่านั้น)
```http
PUT /api/leaves/:id/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "อนุมัติ",
  "remarks": "อนุมัติตามที่ขอ"
}
```

### Employee Transfer (ต้องมี Authentication)

#### ย้ายแผนก/เลื่อนตำแหน่ง (หัวหน้า/ผู้บริหารเท่านั้น)
```http
POST /api/employees/:id/transfer
Authorization: Bearer {token}
Content-Type: application/json

{
  "change_type": "Promotion",
  "new_department_id": 1,
  "new_position_id": 2,
  "new_salary": 55000,
  "effective_date": "2025-10-02",
  "reason": "เลื่อนตำแหน่งเนื่องจากผลงานดีเด่น",
  "notes": "ได้รับการพิจารณาเป็นพิเศษ"
}
```

## ข้อมูล Login ทดสอบ

### ผู้บริหาร (Executive)
- Username: `somchai.j` Password: `password123` (CEO level)
- Username: `sunee.a` Password: `password123` (Senior Executive)

### หัวหน้า (Manager)
- Username: `tana.c` Password: `password123` (Finance Manager)
- Username: `usa.s` Password: `password123` (IT Manager)
- Username: `danai.c` Password: `password123` (HR Manager)
- Username: `jiraporn.p` Password: `password123` (Sales Manager)

### HR Staff
- Username: `wichai.m` Password: `password123` (HR Supervisor)

### พนักงาน (Employee)
- Username: `somying.r` Password: `password123` (IT Employee)
- Username: `janjira.s` Password: `password123` (Sales Employee)
- Username: `surachai.w` Password: `password123` (Finance Employee)

## วิธีใช้งาน

### 1. เข้าสู่ระบบ
```javascript
const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'somchai.j',
    password: 'password123'
  })
});

const data = await response.json();
const token = data.token; // เก็บ token ไว้ใช้
```

### 2. เรียกใช้ API ที่ต้อง Authentication
```javascript
const response = await fetch('http://localhost:5000/api/leaves', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### 3. ตรวจสอบสิทธิ์
- ระบบจะตรวจสอบ token และ permissions อัตโนมัติ
- หากไม่มีสิทธิ์จะได้รับ HTTP 403 Forbidden
- หาก token หมดอายุจะได้รับ HTTP 401 Unauthorized

## ตัวอย่างการใช้งาน

### กรณี 1: พนักงานขอลา
```bash
# 1. Login as employee
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"somying.r","password":"password123"}'

# 2. Create leave request
curl -X POST http://localhost:5000/api/leaves \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "leave_type":"ลาป่วย",
    "start_date":"2025-10-10",
    "end_date":"2025-10-11",
    "total_days":2,
    "reason":"ป่วยเป็นไข้"
  }'
```

### กรณี 2: หัวหน้าอนุมัติการลา
```bash
# 1. Login as manager
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"usa.s","password":"password123"}'

# 2. Approve leave
curl -X PUT http://localhost:5000/api/leaves/1/status \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "status":"อนุมัติ",
    "remarks":"อนุมัติตามที่ขอ"
  }'
```

### กรณี 3: หัวหน้าย้ายแผนกลูกน้อง
```bash
# Login as manager then:
curl -X POST http://localhost:5000/api/employees/2/transfer \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "change_type":"Transfer",
    "new_department_id":2,
    "effective_date":"2025-10-15",
    "reason":"ย้ายแผนกตามความเหมาะสม"
  }'
```

## Security Notes

1. **JWT Secret**: ควรตั้งค่า `JWT_SECRET` ใน `.env` file
2. **Password**: ใช้ bcrypt สำหรับ hash password
3. **Token Expiration**: Token หมดอายุใน 8 ชั่วโมง
4. **HTTPS**: ควรใช้ HTTPS ใน production
5. **Rate Limiting**: พิจารณาเพิ่ม rate limiting สำหรับ login endpoint

## การขยายระบบ

### เพิ่ม Permission ใหม่
```sql
INSERT INTO permissions (permission_name, permission_description, resource, action)
VALUES ('report.export', 'ส่งออกรายงาน', 'report', 'export');

-- กำหนดให้ Executive
INSERT INTO role_permissions (role_id, permission_id)
SELECT role_id, permission_id
FROM roles, permissions
WHERE role_name = 'Executive' AND permission_name = 'report.export';
```

### เพิ่ม Role ใหม่
```sql
INSERT INTO roles (role_name, role_description)
VALUES ('Auditor', 'ผู้ตรวจสอบ - สามารถดูรายงานทั้งหมด');

-- กำหนด permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_name = 'Auditor'
AND p.permission_name IN ('leave.read.all', 'employee.read.all', 'report.view.all');
```

## ปัญหาที่พบบ่อย

### 1. Token expired
**แก้ไข:** ให้ user login ใหม่

### 2. Permission denied
**แก้ไข:** ตรวจสอบว่า user มี permission ที่จำเป็นหรือไม่

### 3. Manager can't approve subordinate's leave
**แก้ไข:** ตรวจสอบว่ามีข้อมูลใน `manager_subordinates` table หรือไม่
