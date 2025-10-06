import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { employeeAPI, leaveAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import TransferForm from '../components/TransferForm';
import LeaveRequestForm from '../components/LeaveRequestForm';
import TerminationForm from '../components/TerminationForm';

function EmployeeDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, hasRole } = useAuth();
    const [employee, setEmployee] = useState(null);
    const [leaves, setLeaves] = useState([]);
    const [terminations, setTerminations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('personal');
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [showTerminationModal, setShowTerminationModal] = useState(false);

    useEffect(() => {
        // ตรวจสอบสิทธิ์: พนักงานทั่วไปดูได้แค่ข้อมูลตัวเอง
        const isEmployee = user?.role === 'Employee';
        const isOwnData = parseInt(id) === parseInt(user?.employee_id);

        if (isEmployee && !isOwnData) {
            setError('คุณไม่มีสิทธิ์เข้าถึงข้อมูลพนักงานคนนี้');
            setLoading(false);
            return;
        }

        fetchEmployee();
        fetchLeaves();
        fetchTerminations();
    }, [id, user]);

    const fetchEmployee = async () => {
        try {
            setLoading(true);
            const response = await employeeAPI.getById(id);
            setEmployee(response.data);
            setError(null);
        } catch (err) {
            if (err.response?.status === 403) {
                setError('คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้');
            } else {
                setError('ไม่สามารถโหลดข้อมูลพนักงานได้');
            }
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchLeaves = async () => {
        try {
            const response = await leaveAPI.getByEmployee(id);
            setLeaves(response.data);
        } catch (err) {
            console.error('ไม่สามารถโหลดข้อมูลการลาได้:', err);
        }
    };

    const fetchTerminations = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/terminations/employee/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setTerminations(data);
            }
        } catch (err) {
            console.error('ไม่สามารถโหลดข้อมูลการเลิกจ้างได้:', err);
        }
    };

    if (loading) return <div className="loading">กำลังโหลด...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!employee) return <div>ไม่พบข้อมูลพนักงาน</div>;

    // คำนวณอายุงาน
    const calculateWorkYears = (hireDate) => {
        if (!hireDate) return '-';
        const hire = new Date(hireDate);
        const today = new Date();
        const years = today.getFullYear() - hire.getFullYear();
        const months = today.getMonth() - hire.getMonth();

        let totalYears = years;
        let totalMonths = months;

        if (months < 0) {
            totalYears--;
            totalMonths = 12 + months;
        }

        if (totalYears === 0) {
            return `${totalMonths} เดือน`;
        } else if (totalMonths === 0) {
            return `${totalYears} ปี`;
        } else {
            return `${totalYears} ปี ${totalMonths} เดือน`;
        }
    };

    // Format วันที่ (แปลงเป็น พ.ศ.)
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);

        const thaiMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                           'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

        const day = date.getDate();
        const month = thaiMonths[date.getMonth()];
        const year = date.getFullYear() + 543; // แปลงเป็น พ.ศ.

        return `${day} ${month} ${year}`;
    };

    // Format วันที่ (ค.ศ. - ไม่แปลง) สำหรับวันเลิกจ้าง
    const formatDateCE = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);

        const thaiMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                           'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

        const day = date.getDate();
        const month = thaiMonths[date.getMonth()];
        const year = date.getFullYear(); // ใช้ ค.ศ. ตามที่กรอก

        return `${day} ${month} ${year}`;
    };

    const getTerminationTypeLabel = (type) => {
        const labels = {
            'Resignation': 'ลาออก',
            'Retirement': 'เกษียณอายุ',
            'Dismissal': 'ไล่ออก',
            'Layoff': 'เลิกจ้าง',
            'Contract_End': 'สิ้นสุดสัญญา',
            'Mutual_Agreement': 'ตกลงร่วมกัน'
        };
        return labels[type] || type;
    };

    const handleTransferSuccess = () => {
        setShowTransferModal(false);
        fetchEmployee();
    };

    const handleLeaveSuccess = () => {
        setShowLeaveModal(false);
        fetchLeaves();
    };

    const handleTerminationSuccess = () => {
        setShowTerminationModal(false);
        fetchTerminations();
        fetchEmployee();
    };

    return (
        <div className="detail-container">
            <div className="detail-header">
                <div>
                    <h2>{employee.title} {employee.first_name} {employee.last_name}</h2>
                    <p style={{ color: 'var(--mitsubishi-dark-gray)', marginTop: '0.5rem' }}>
                        รหัส: {employee.employee_code} | {employee.position_name} - {employee.department_name}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn" onClick={() => setShowTransferModal(true)}>
                        ย้าย/เลื่อนตำแหน่ง
                    </button>
                    <button className="btn btn-secondary" onClick={() => navigate('/employees')}>
                        กลับ
                    </button>
                </div>
            </div>

            {/* Employee Summary Card */}
            <div className="employee-summary">
                <div className="summary-card">
                    <div className="summary-content">
                        <h4>วันเริ่มงาน</h4>
                        <p className="summary-value">{formatDate(employee.hire_date)}</p>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-content">
                        <h4>อายุงาน</h4>
                        <p className="summary-value">{calculateWorkYears(employee.hire_date)}</p>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-content">
                        <h4>เงินเดือน</h4>
                        <p className="summary-value">
                            {employee.salary ? `฿${parseFloat(employee.salary).toLocaleString()}` : '-'}
                        </p>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-content">
                        <h4>สถานะ</h4>
                        <p className="summary-value">{employee.employment_status}</p>
                    </div>
                </div>
            </div>

            <div className="tab-nav">
                <button
                    className={`tab-button ${activeTab === 'personal' ? 'active' : ''}`}
                    onClick={() => setActiveTab('personal')}
                >
                    ข้อมูลส่วนตัว
                </button>
                <button
                    className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    ประวัติการทำงาน
                </button>
                <button
                    className={`tab-button ${activeTab === 'training' ? 'active' : ''}`}
                    onClick={() => setActiveTab('training')}
                >
                    การฝึกอบรม
                </button>
                <button
                    className={`tab-button ${activeTab === 'benefits' ? 'active' : ''}`}
                    onClick={() => setActiveTab('benefits')}
                >
                    สวัสดิการ
                </button>
                <button
                    className={`tab-button ${activeTab === 'leaves' ? 'active' : ''}`}
                    onClick={() => setActiveTab('leaves')}
                >
                    การลา
                </button>
                {(user?.role === 'Manager' || user?.role === 'Executive' || user?.role === 'HR' || user?.role === 'Admin') && (
                    <button
                        className={`tab-button ${activeTab === 'termination' ? 'active' : ''}`}
                        onClick={() => setActiveTab('termination')}
                    >
                        การเลิกจ้าง
                    </button>
                )}
            </div>

            {activeTab === 'personal' && (
                <div>
                    <div className="detail-section">
                        <h3>ข้อมูลทั่วไป</h3>
                        <div className="detail-grid">
                            <div className="detail-item">
                                <label>ชื่อภาษาไทย</label>
                                <p>{employee.title} {employee.first_name} {employee.last_name}</p>
                            </div>
                            <div className="detail-item">
                                <label>ชื่อภาษาอังกฤษ</label>
                                <p>{employee.first_name_en} {employee.last_name_en}</p>
                            </div>
                            <div className="detail-item">
                                <label>เลขบัตรประชาชน</label>
                                <p>{employee.national_id || '-'}</p>
                            </div>
                            <div className="detail-item">
                                <label>วันเกิด</label>
                                <p>{employee.birth_date || '-'}</p>
                            </div>
                            <div className="detail-item">
                                <label>เพศ</label>
                                <p>{employee.gender || '-'}</p>
                            </div>
                            <div className="detail-item">
                                <label>อีเมล</label>
                                <p>{employee.email || '-'}</p>
                            </div>
                            <div className="detail-item">
                                <label>โทรศัพท์</label>
                                <p>{employee.phone || '-'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="detail-section">
                        <h3>ข้อมูลการทำงาน</h3>
                        <div className="detail-grid">
                            <div className="detail-item">
                                <label>แผนก</label>
                                <p>{employee.department_name || '-'}</p>
                            </div>
                            <div className="detail-item">
                                <label>ตำแหน่ง</label>
                                <p>{employee.position_name || '-'}</p>
                            </div>
                            <div className="detail-item">
                                <label>วันที่เริ่มงาน</label>
                                <p>{employee.hire_date || '-'}</p>
                            </div>
                            <div className="detail-item">
                                <label>เงินเดือน</label>
                                <p>{employee.salary ? `฿${parseFloat(employee.salary).toLocaleString()}` : '-'}</p>
                            </div>
                            <div className="detail-item">
                                <label>สถานะการจ้าง</label>
                                <p>{employee.employment_status}</p>
                            </div>
                        </div>
                    </div>

                    <div className="detail-section">
                        <h3>ที่อยู่</h3>
                        {employee.addresses && employee.addresses.length > 0 ? (
                            employee.addresses.map(addr => (
                                <div key={addr.address_id} style={{ marginBottom: '1rem' }}>
                                    <label>{addr.address_type}</label>
                                    <p>
                                        {addr.address_line1} {addr.address_line2}<br />
                                        {addr.sub_district} {addr.district} {addr.province} {addr.postal_code}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p>ไม่มีข้อมูลที่อยู่</p>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'history' && (
                <div className="detail-section">
                    <h3>ประวัติการเปลี่ยนแปลง</h3>
                    {employee.history && employee.history.length > 0 ? (
                        <table>
                            <thead>
                                <tr>
                                    <th>วันที่</th>
                                    <th>ประเภท</th>
                                    <th>รายละเอียด</th>
                                    <th>เหตุผล</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employee.history.map(h => (
                                    <tr key={h.history_id}>
                                        <td>{h.effective_date}</td>
                                        <td>{h.change_type}</td>
                                        <td>
                                            {h.change_type === 'Promotion' && `${h.previous_position_name} → ${h.new_position_name}`}
                                            {h.change_type === 'Transfer' && `${h.previous_department_name} → ${h.new_department_name}`}
                                            {h.change_type === 'Salary_Adjustment' && `฿${parseFloat(h.previous_salary).toLocaleString()} → ฿${parseFloat(h.new_salary).toLocaleString()}`}
                                        </td>
                                        <td>{h.reason || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>ไม่มีประวัติการเปลี่ยนแปลง</p>
                    )}
                </div>
            )}

            {activeTab === 'training' && (
                <div className="detail-section">
                    <h3>การฝึกอบรม</h3>
                    {employee.training && employee.training.length > 0 ? (
                        <table>
                            <thead>
                                <tr>
                                    <th>หลักสูตร</th>
                                    <th>ผู้ให้บริการ</th>
                                    <th>วันที่อบรม</th>
                                    <th>วันที่สำเร็จ</th>
                                    <th>สถานะ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employee.training.map(t => (
                                    <tr key={t.training_id}>
                                        <td>{t.training_name}</td>
                                        <td>{t.training_provider || '-'}</td>
                                        <td>{t.training_date || '-'}</td>
                                        <td>{t.completion_date || '-'}</td>
                                        <td>{t.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>ไม่มีข้อมูลการฝึกอบรม</p>
                    )}
                </div>
            )}

            {activeTab === 'benefits' && (
                <div className="detail-section">
                    <h3>สวัสดิการ</h3>
                    {employee.benefits && employee.benefits.length > 0 ? (
                        <table>
                            <thead>
                                <tr>
                                    <th>ประเภท</th>
                                    <th>รายละเอียด</th>
                                    <th>วันที่เริ่ม</th>
                                    <th>วันที่สิ้นสุด</th>
                                    <th>จำนวน</th>
                                    <th>สถานะ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employee.benefits.map(b => (
                                    <tr key={b.benefit_id}>
                                        <td>{b.benefit_type}</td>
                                        <td>{b.benefit_description || '-'}</td>
                                        <td>{b.start_date || '-'}</td>
                                        <td>{b.end_date || '-'}</td>
                                        <td>{b.amount ? `฿${parseFloat(b.amount).toLocaleString()}` : '-'}</td>
                                        <td>{b.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>ไม่มีข้อมูลสวัสดิการ</p>
                    )}
                </div>
            )}

            {activeTab === 'leaves' && (
                <div className="detail-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0 }}>ประวัติการลา</h3>
                        <button className="btn" onClick={() => setShowLeaveModal(true)}>
                            + ขอลา
                        </button>
                    </div>
                    {leaves && leaves.length > 0 ? (
                        <table>
                            <thead>
                                <tr>
                                    <th>ประเภทการลา</th>
                                    <th>วันที่เริ่ม</th>
                                    <th>วันที่สิ้นสุด</th>
                                    <th>จำนวนวัน</th>
                                    <th>เหตุผล</th>
                                    <th>สถานะ</th>
                                    <th>ผู้อนุมัติ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaves.map(leave => (
                                    <tr key={leave.leave_id}>
                                        <td>{leave.leave_type}</td>
                                        <td>{leave.start_date}</td>
                                        <td>{leave.end_date}</td>
                                        <td>{leave.total_days}</td>
                                        <td>{leave.reason}</td>
                                        <td>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '12px',
                                                fontSize: '0.85rem',
                                                backgroundColor:
                                                    leave.status === 'อนุมัติ' ? '#d4edda' :
                                                    leave.status === 'ไม่อนุมัติ' ? '#f8d7da' :
                                                    leave.status === 'ยกเลิก' ? '#e2e3e5' :
                                                    '#fff3cd',
                                                color:
                                                    leave.status === 'อนุมัติ' ? '#155724' :
                                                    leave.status === 'ไม่อนุมัติ' ? '#721c24' :
                                                    leave.status === 'ยกเลิก' ? '#383d41' :
                                                    '#856404'
                                            }}>
                                                {leave.status}
                                            </span>
                                        </td>
                                        <td>
                                            {leave.approver_first_name && leave.approver_last_name
                                                ? `${leave.approver_first_name} ${leave.approver_last_name}`
                                                : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>ไม่มีประวัติการลา</p>
                    )}
                </div>
            )}

            {activeTab === 'termination' && (
                <div className="detail-section">
                    <div className="section-header">
                        <h3>ข้อมูลการเลิกจ้าง / สิ้นสุดการจ้าง</h3>
                        {(user?.role === 'Executive' || user?.role === 'HR' || user?.role === 'Admin') &&
                         employee.employment_status !== 'Terminated' && (
                            <button onClick={() => setShowTerminationModal(true)} className="btn btn-danger">
                                + บันทึกการเลิกจ้าง
                            </button>
                        )}
                    </div>

                    {terminations && terminations.length > 0 ? (
                        <div className="termination-cards">
                            {terminations.map(t => (
                                <div key={t.termination_id} className="termination-card">
                                    <div className="termination-card-header">
                                        <div className="termination-type">
                                            <span className={`termination-badge ${t.termination_type.toLowerCase()}`}>
                                                {getTerminationTypeLabel(t.termination_type)}
                                            </span>
                                        </div>
                                        <div className="termination-dates">
                                            <div className="date-item">
                                                <span className="date-label">วันที่เลิกจ้าง:</span>
                                                <span className="date-value">{formatDateCE(t.termination_date)}</span>
                                            </div>
                                            <div className="date-item">
                                                <span className="date-label">วันสุดท้าย:</span>
                                                <span className="date-value">{formatDateCE(t.last_working_day)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="termination-card-body">
                                        {t.reason && (
                                            <div className="termination-info-row">
                                                <strong>เหตุผล:</strong>
                                                <p>{t.reason}</p>
                                            </div>
                                        )}

                                        <div className="termination-financial">
                                            <div className="financial-item">
                                                <span className="financial-label">ค่าชดเชย</span>
                                                <span className="financial-value">
                                                    {t.severance_pay ? `฿${parseFloat(t.severance_pay).toLocaleString()}` : '-'}
                                                </span>
                                            </div>
                                            <div className="financial-item">
                                                <span className="financial-label">ค่าลาคงเหลือ</span>
                                                <span className="financial-value">
                                                    {t.unused_leave_payout ? `฿${parseFloat(t.unused_leave_payout).toLocaleString()}` : '-'}
                                                </span>
                                            </div>
                                            <div className="financial-item highlight">
                                                <span className="financial-label">ยอดชำระสุทธิ</span>
                                                <span className="financial-value">
                                                    {t.final_settlement ? `฿${parseFloat(t.final_settlement).toLocaleString()}` : '-'}
                                                </span>
                                            </div>
                                        </div>

                                        {t.return_company_property && (
                                            <div className="termination-info-row">
                                                <strong>ทรัพย์สินที่ต้องคืน:</strong>
                                                <p>{t.return_company_property}</p>
                                            </div>
                                        )}

                                        <div className="termination-status-row">
                                            <div className="status-item">
                                                <span className={`status-badge ${t.exit_interview_completed ? 'success' : 'warning'}`}>
                                                    {t.exit_interview_completed ? '✓ Exit Interview เสร็จสิ้น' : '⚠ ยัง Exit Interview'}
                                                </span>
                                            </div>
                                            <div className="status-item">
                                                <span className={`status-badge ${t.rehire_eligible ? 'success' : 'danger'}`}>
                                                    {t.rehire_eligible ? '✓ จ้างกลับได้' : '✗ ไม่สามารถจ้างกลับ'}
                                                </span>
                                            </div>
                                        </div>

                                        {t.exit_interview_notes && (
                                            <div className="termination-info-row">
                                                <strong>บันทึก Exit Interview:</strong>
                                                <p className="interview-notes">{t.exit_interview_notes}</p>
                                            </div>
                                        )}

                                        {t.notes && (
                                            <div className="termination-info-row">
                                                <strong>หมายเหตุ:</strong>
                                                <p>{t.notes}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="termination-card-footer">
                                        <span className="processor-info">
                                            บันทึกโดย: {t.processor_first_name && t.processor_last_name
                                                ? `${t.processor_first_name} ${t.processor_last_name}`
                                                : '-'}
                                        </span>
                                        <span className="process-date">
                                            {t.processed_date && formatDate(t.processed_date)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-icon">📋</div>
                            <p>ไม่มีข้อมูลการเลิกจ้าง</p>
                            {(user?.role === 'Executive' || user?.role === 'HR' || user?.role === 'Admin') && (
                                <button onClick={() => setShowTerminationModal(true)} className="btn btn-secondary">
                                    + เพิ่มข้อมูลการเลิกจ้าง
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {showTransferModal && (
                <TransferForm
                    employee={employee}
                    onClose={() => setShowTransferModal(false)}
                    onSuccess={handleTransferSuccess}
                />
            )}

            {showLeaveModal && (
                <LeaveRequestForm
                    employee={employee}
                    onClose={() => setShowLeaveModal(false)}
                    onSuccess={handleLeaveSuccess}
                />
            )}

            {showTerminationModal && (
                <TerminationForm
                    employee={employee}
                    onClose={() => setShowTerminationModal(false)}
                    onSuccess={handleTerminationSuccess}
                />
            )}
        </div>
    );
}

export default EmployeeDetail;
