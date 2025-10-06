import React, { useState, useEffect } from 'react';
import { employeeAPI, departmentAPI, positionAPI } from '../services/api';

function TransferForm({ employee, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        change_type: 'Transfer',
        new_department_id: '',
        new_position_id: '',
        new_salary: '',
        effective_date: new Date().toISOString().split('T')[0],
        reason: '',
        notes: ''
    });

    const [departments, setDepartments] = useState([]);
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchDepartments();
        fetchPositions();

        // Set current values as default
        if (employee) {
            setFormData(prev => ({
                ...prev,
                new_department_id: employee.department_id || '',
                new_position_id: employee.position_id || '',
                new_salary: employee.salary || ''
            }));
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
            // Send transfer request
            await employeeAPI.transfer(employee.employee_id, formData);
            alert('ย้ายตำแหน่งพนักงานสำเร็จ');
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
                <h2>ย้ายตำแหน่ง / เลื่อนตำแหน่ง</h2>

                <div style={{
                    background: 'var(--mitsubishi-light-gray)',
                    padding: '1rem',
                    marginBottom: '1.5rem',
                    border: '1px solid var(--mitsubishi-border)'
                }}>
                    <strong>พนักงาน:</strong> {employee.first_name} {employee.last_name} ({employee.employee_code})<br/>
                    <strong>แผนกปัจจุบัน:</strong> {employee.department_name || '-'}<br/>
                    <strong>ตำแหน่งปัจจุบัน:</strong> {employee.position_name || '-'}<br/>
                    <strong>เงินเดือนปัจจุบัน:</strong> ฿{parseFloat(employee.salary || 0).toLocaleString()}
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>ประเภทการเปลี่ยนแปลง *</label>
                        <select
                            name="change_type"
                            value={formData.change_type}
                            onChange={handleChange}
                            required
                        >
                            <option value="Transfer">ย้ายแผนก (Transfer)</option>
                            <option value="Promotion">เลื่อนตำแหน่ง (Promotion)</option>
                            <option value="Salary_Adjustment">ปรับเงินเดือน (Salary Adjustment)</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>แผนกใหม่ *</label>
                        <select
                            name="new_department_id"
                            value={formData.new_department_id}
                            onChange={handleChange}
                            required
                        >
                            <option value="">-- เลือกแผนก --</option>
                            {departments.map(dept => (
                                <option key={dept.department_id} value={dept.department_id}>
                                    {dept.department_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>ตำแหน่งใหม่ *</label>
                        <select
                            name="new_position_id"
                            value={formData.new_position_id}
                            onChange={handleChange}
                            required
                        >
                            <option value="">-- เลือกตำแหน่ง --</option>
                            {positions.map(pos => (
                                <option key={pos.position_id} value={pos.position_id}>
                                    {pos.position_name} (Level {pos.level})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>เงินเดือนใหม่ (บาท) *</label>
                        <input
                            type="number"
                            name="new_salary"
                            value={formData.new_salary}
                            onChange={handleChange}
                            required
                            step="0.01"
                            min="0"
                        />
                    </div>

                    <div className="form-group">
                        <label>วันที่มีผล *</label>
                        <input
                            type="date"
                            name="effective_date"
                            value={formData.effective_date}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>เหตุผล *</label>
                        <textarea
                            name="reason"
                            value={formData.reason}
                            onChange={handleChange}
                            rows="3"
                            required
                            placeholder="ระบุเหตุผลในการย้าย/เลื่อนตำแหน่ง"
                        />
                    </div>

                    <div className="form-group">
                        <label>หมายเหตุ</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows="2"
                            placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            ยกเลิก
                        </button>
                        <button type="submit" className="btn" disabled={loading}>
                            {loading ? 'กำลังบันทึก...' : 'บันทึกการย้าย/เลื่อนตำแหน่ง'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default TransferForm;
