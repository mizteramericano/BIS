import React, { useState, useEffect } from 'react';
import { employeeAPI, departmentAPI, positionAPI } from '../services/api';

function EmployeeForm({ employee, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        employee_code: '',
        title: 'นาย',
        first_name: '',
        last_name: '',
        first_name_en: '',
        last_name_en: '',
        national_id: '',
        birth_date: '',
        gender: 'Male',
        email: '',
        phone: '',
        department_id: '',
        position_id: '',
        hire_date: '',
        salary: '',
        employment_status: 'Active'
    });

    const [departments, setDepartments] = useState([]);
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchDepartments();
        fetchPositions();
        if (employee) {
            setFormData({
                employee_code: employee.employee_code || '',
                title: employee.title || 'นาย',
                first_name: employee.first_name || '',
                last_name: employee.last_name || '',
                first_name_en: employee.first_name_en || '',
                last_name_en: employee.last_name_en || '',
                national_id: employee.national_id || '',
                birth_date: employee.birth_date || '',
                gender: employee.gender || 'Male',
                email: employee.email || '',
                phone: employee.phone || '',
                department_id: employee.department_id || '',
                position_id: employee.position_id || '',
                hire_date: employee.hire_date || '',
                salary: employee.salary || '',
                employment_status: employee.employment_status || 'Active'
            });
        }
    }, [employee]);

    const fetchDepartments = async () => {
        try {
            const response = await departmentAPI.getAll();
            setDepartments(response.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchPositions = async () => {
        try {
            const response = await positionAPI.getAll();
            setPositions(response.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (employee) {
                await employeeAPI.update(employee.employee_id, formData);
            } else {
                await employeeAPI.create(formData);
            }
            onSuccess();
        } catch (err) {
            alert('เกิดข้อผิดพลาด: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <h2>{employee ? 'แก้ไขข้อมูลพนักงาน' : 'เพิ่มพนักงานใหม่'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>รหัสพนักงาน *</label>
                        <input
                            type="text"
                            name="employee_code"
                            value={formData.employee_code}
                            onChange={handleChange}
                            required
                            disabled={!!employee}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 2fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label>คำนำหน้า</label>
                            <select name="title" value={formData.title} onChange={handleChange}>
                                <option value="นาย">นาย</option>
                                <option value="นาง">นาง</option>
                                <option value="นางสาว">นางสาว</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>ชื่อ *</label>
                            <input
                                type="text"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>นามสกุล *</label>
                            <input
                                type="text"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label>First Name (EN)</label>
                            <input
                                type="text"
                                name="first_name_en"
                                value={formData.first_name_en}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group">
                            <label>Last Name (EN)</label>
                            <input
                                type="text"
                                name="last_name_en"
                                value={formData.last_name_en}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label>เลขบัตรประชาชน</label>
                            <input
                                type="text"
                                name="national_id"
                                value={formData.national_id}
                                onChange={handleChange}
                                maxLength="13"
                            />
                        </div>
                        <div className="form-group">
                            <label>วันเกิด</label>
                            <input
                                type="date"
                                name="birth_date"
                                value={formData.birth_date}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group">
                            <label>เพศ</label>
                            <select name="gender" value={formData.gender} onChange={handleChange}>
                                <option value="Male">ชาย</option>
                                <option value="Female">หญิง</option>
                                <option value="Other">อื่นๆ</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label>อีเมล</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group">
                            <label>โทรศัพท์</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label>แผนก</label>
                            <select name="department_id" value={formData.department_id} onChange={handleChange}>
                                <option value="">-- เลือกแผนก --</option>
                                {departments.map(dept => (
                                    <option key={dept.department_id} value={dept.department_id}>
                                        {dept.department_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>ตำแหน่ง</label>
                            <select name="position_id" value={formData.position_id} onChange={handleChange}>
                                <option value="">-- เลือกตำแหน่ง --</option>
                                {positions.map(pos => (
                                    <option key={pos.position_id} value={pos.position_id}>
                                        {pos.position_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label>วันที่เริ่มงาน</label>
                            <input
                                type="date"
                                name="hire_date"
                                value={formData.hire_date}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group">
                            <label>เงินเดือน</label>
                            <input
                                type="number"
                                name="salary"
                                value={formData.salary}
                                onChange={handleChange}
                                step="0.01"
                            />
                        </div>
                        <div className="form-group">
                            <label>สถานะการจ้าง</label>
                            <select name="employment_status" value={formData.employment_status} onChange={handleChange}>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                                <option value="Terminated">Terminated</option>
                                <option value="Resigned">Resigned</option>
                            </select>
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            ยกเลิก
                        </button>
                        <button type="submit" className="btn" disabled={loading}>
                            {loading ? 'กำลังบันทึก...' : 'บันทึก'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EmployeeForm;
