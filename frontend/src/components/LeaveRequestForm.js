import React, { useState } from 'react';
import { leaveAPI } from '../services/api';

function LeaveRequestForm({ employee, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        leave_type: 'ลาป่วย',
        start_date: '',
        end_date: '',
        reason: ''
    });

    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const calculateDays = () => {
        if (formData.start_date && formData.end_date) {
            const start = new Date(formData.start_date);
            const end = new Date(formData.end_date);
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            return diffDays;
        }
        return 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const totalDays = calculateDays();

            if (totalDays <= 0) {
                alert('กรุณาเลือกวันที่ให้ถูกต้อง');
                setLoading(false);
                return;
            }

            await leaveAPI.create({
                employee_id: employee.employee_id,
                leave_type: formData.leave_type,
                start_date: formData.start_date,
                end_date: formData.end_date,
                total_days: totalDays,
                reason: formData.reason
            });

            alert('ส่งคำร้องขอลาสำเร็จ');
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
                <h2>ขอลา</h2>

                <div style={{
                    background: 'var(--mitsubishi-light-gray)',
                    padding: '1rem',
                    marginBottom: '1.5rem',
                    border: '1px solid var(--mitsubishi-border)'
                }}>
                    <strong>พนักงาน:</strong> {employee.title} {employee.first_name} {employee.last_name}<br/>
                    <strong>รหัส:</strong> {employee.employee_code}<br/>
                    <strong>แผนก:</strong> {employee.department_name}<br/>
                    <strong>ตำแหน่ง:</strong> {employee.position_name}
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>ประเภทการลา *</label>
                        <select
                            name="leave_type"
                            value={formData.leave_type}
                            onChange={handleChange}
                            required
                        >
                            <option value="ลาป่วย">ลาป่วย</option>
                            <option value="ลากิจ">ลากิจ</option>
                            <option value="ลาพักร้อน">ลาพักร้อน</option>
                            <option value="ลาคลอดบุตร">ลาคลอดบุตร</option>
                            <option value="ลาอุปสมบท">ลาอุปสมบท</option>
                            <option value="ลาโดยไม่ได้รับค่าจ้าง">ลาโดยไม่ได้รับค่าจ้าง</option>
                            <option value="ลาอื่นๆ">ลาอื่นๆ</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>วันที่เริ่มต้น *</label>
                        <input
                            type="date"
                            name="start_date"
                            value={formData.start_date}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>วันที่สิ้นสุด *</label>
                        <input
                            type="date"
                            name="end_date"
                            value={formData.end_date}
                            onChange={handleChange}
                            required
                            min={formData.start_date}
                        />
                    </div>

                    {formData.start_date && formData.end_date && (
                        <div style={{
                            background: '#e3f2fd',
                            padding: '1rem',
                            marginBottom: '1rem',
                            border: '1px solid #90caf9'
                        }}>
                            <strong>จำนวนวันที่ลา:</strong> {calculateDays()} วัน
                        </div>
                    )}

                    <div className="form-group">
                        <label>เหตุผลการลา *</label>
                        <textarea
                            name="reason"
                            value={formData.reason}
                            onChange={handleChange}
                            rows="4"
                            required
                            placeholder="กรุณาระบุเหตุผลการลา..."
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            ยกเลิก
                        </button>
                        <button type="submit" className="btn" disabled={loading}>
                            {loading ? 'กำลังส่งคำร้อง...' : 'ส่งคำร้องขอลา'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default LeaveRequestForm;
