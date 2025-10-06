import React, { useState } from 'react';
import './TerminationForm.css';

function TerminationForm({ employee, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        employee_id: employee.employee_id,
        termination_type: 'Resignation',
        termination_date: '',
        last_working_day: '',
        reason: '',
        notice_period_days: '',
        severance_pay: '',
        unused_leave_payout: '',
        final_settlement: '',
        return_company_property: '',
        exit_interview_completed: false,
        exit_interview_notes: '',
        rehire_eligible: true,
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // แปลงวันที่จาก DD/MM/YYYY (พ.ศ.) เป็น YYYY-MM-DD (ค.ศ.)
    const convertThaiDateToISO = (thaiDate) => {
        if (!thaiDate || !thaiDate.includes('/')) return thaiDate;
        const [day, month, year] = thaiDate.split('/');
        const ceYear = parseInt(year) - 543; // แปลง พ.ศ. เป็น ค.ศ.
        return `${ceYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');

            // แปลงวันที่ก่อนส่ง
            const submitData = {
                ...formData,
                termination_date: convertThaiDateToISO(formData.termination_date),
                last_working_day: convertThaiDateToISO(formData.last_working_day)
            };

            const response = await fetch('http://localhost:5000/api/terminations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(submitData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'เกิดข้อผิดพลาดในการบันทึก');
            }

            onSuccess();
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content large" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>แบบฟอร์มเลิกจ้าง / สิ้นสุดการจ้าง</h2>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="termination-form">
                    {error && <div className="error-message">{error}</div>}

                    <div className="employee-info">
                        <h3>ข้อมูลพนักงาน</h3>
                        <p><strong>รหัส:</strong> {employee.employee_code}</p>
                        <p><strong>ชื่อ:</strong> {employee.title} {employee.first_name} {employee.last_name}</p>
                        <p><strong>แผนก:</strong> {employee.department_name}</p>
                        <p><strong>ตำแหน่ง:</strong> {employee.position_name}</p>
                    </div>

                    <div className="form-section">
                        <h3>ข้อมูลการเลิกจ้าง</h3>

                        <div className="form-row">
                            <div className="form-group">
                                <label>ประเภทการเลิกจ้าง *</label>
                                <select
                                    name="termination_type"
                                    value={formData.termination_type}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="Resignation">ลาออก (Resignation)</option>
                                    <option value="Retirement">เกษียณอายุ (Retirement)</option>
                                    <option value="Dismissal">ไล่ออก (Dismissal)</option>
                                    <option value="Layoff">เลิกจ้าง (Layoff)</option>
                                    <option value="Contract_End">สิ้นสุดสัญญา (Contract End)</option>
                                    <option value="Mutual_Agreement">ตกลงร่วมกัน (Mutual Agreement)</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>วันที่เลิกจ้าง * <small>(วัน/เดือน/ปี พ.ศ.)</small></label>
                                <input
                                    type="text"
                                    name="termination_date"
                                    value={formData.termination_date}
                                    onChange={handleChange}
                                    placeholder="dd/mm/yyyy"
                                    pattern="\d{2}/\d{2}/\d{4}"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>วันทำงานวันสุดท้าย * <small>(วัน/เดือน/ปี พ.ศ.)</small></label>
                                <input
                                    type="text"
                                    name="last_working_day"
                                    value={formData.last_working_day}
                                    onChange={handleChange}
                                    placeholder="dd/mm/yyyy"
                                    pattern="\d{2}/\d{2}/\d{4}"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>เหตุผล</label>
                            <textarea
                                name="reason"
                                value={formData.reason}
                                onChange={handleChange}
                                rows="3"
                                placeholder="ระบุเหตุผลการเลิกจ้าง..."
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>การเงินและค่าชดเชย</h3>

                        <div className="form-row">
                            <div className="form-group">
                                <label>ระยะเวลาแจ้งล่วงหน้า (วัน)</label>
                                <input
                                    type="number"
                                    name="notice_period_days"
                                    value={formData.notice_period_days}
                                    onChange={handleChange}
                                    min="0"
                                />
                            </div>

                            <div className="form-group">
                                <label>ค่าชดเชย (บาท)</label>
                                <input
                                    type="number"
                                    name="severance_pay"
                                    value={formData.severance_pay}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                />
                            </div>

                            <div className="form-group">
                                <label>ค่าจ้างวันลาคงเหลือ (บาท)</label>
                                <input
                                    type="number"
                                    name="unused_leave_payout"
                                    value={formData.unused_leave_payout}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>ยอดชำระสุทธิ (บาท)</label>
                            <input
                                type="number"
                                name="final_settlement"
                                value={formData.final_settlement}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>การคืนทรัพย์สินและ Exit Interview</h3>

                        <div className="form-group">
                            <label>ทรัพย์สินบริษัทที่ต้องคืน</label>
                            <textarea
                                name="return_company_property"
                                value={formData.return_company_property}
                                onChange={handleChange}
                                rows="2"
                                placeholder="เช่น: โน้ตบุ๊ค, บัตรพนักงาน, กุญแจ..."
                            />
                        </div>

                        <div className="form-group checkbox-group">
                            <label>
                                <input
                                    type="checkbox"
                                    name="exit_interview_completed"
                                    checked={formData.exit_interview_completed}
                                    onChange={handleChange}
                                />
                                <span>ทำ Exit Interview แล้ว</span>
                            </label>
                        </div>

                        <div className="form-group">
                            <label>บันทึก Exit Interview</label>
                            <textarea
                                name="exit_interview_notes"
                                value={formData.exit_interview_notes}
                                onChange={handleChange}
                                rows="3"
                                placeholder="บันทึกจาก Exit Interview..."
                            />
                        </div>

                        <div className="form-group checkbox-group">
                            <label>
                                <input
                                    type="checkbox"
                                    name="rehire_eligible"
                                    checked={formData.rehire_eligible}
                                    onChange={handleChange}
                                />
                                <span>สามารถจ้างกลับได้ในอนาคต</span>
                            </label>
                        </div>

                        <div className="form-group">
                            <label>หมายเหตุเพิ่มเติม</label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                rows="3"
                                placeholder="หมายเหตุเพิ่มเติม..."
                            />
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" onClick={onClose} disabled={loading}>
                            ยกเลิก
                        </button>
                        <button type="submit" className="primary" disabled={loading}>
                            {loading ? 'กำลังบันทึก...' : 'บันทึกการเลิกจ้าง'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default TerminationForm;
