import React, { useState, useEffect } from 'react';
import { departmentAPI, employeeAPI } from '../services/api';

function DepartmentForm({ department, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        department_code: '',
        department_name: '',
        description: '',
        manager_id: ''
    });

    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchEmployees();
        if (department) {
            setFormData({
                department_code: department.department_code || '',
                department_name: department.department_name || '',
                description: department.description || '',
                manager_id: department.manager_id || ''
            });
        }
    }, [department]);

    const fetchEmployees = async () => {
        try {
            const response = await employeeAPI.getAll();
            setEmployees(response.data);
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
            if (department) {
                await departmentAPI.update(department.department_id, formData);
            } else {
                await departmentAPI.create(formData);
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
                <h2>{department ? 'แก้ไขแผนก' : 'เพิ่มแผนกใหม่'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>รหัสแผนก *</label>
                        <input
                            type="text"
                            name="department_code"
                            value={formData.department_code}
                            onChange={handleChange}
                            required
                            disabled={!!department}
                        />
                    </div>

                    <div className="form-group">
                        <label>ชื่อแผนก *</label>
                        <input
                            type="text"
                            name="department_name"
                            value={formData.department_name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>หัวหน้าแผนก</label>
                        <select name="manager_id" value={formData.manager_id} onChange={handleChange}>
                            <option value="">-- เลือกหัวหน้าแผนก --</option>
                            {employees.map(emp => (
                                <option key={emp.employee_id} value={emp.employee_id}>
                                    {emp.employee_code} - {emp.first_name} {emp.last_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>คำอธิบาย</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="3"
                        />
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

export default DepartmentForm;
