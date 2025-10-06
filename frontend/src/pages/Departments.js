import React, { useState, useEffect } from 'react';
import { departmentAPI } from '../services/api';
import DepartmentForm from '../components/DepartmentForm';

function Departments() {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editDepartment, setEditDepartment] = useState(null);

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            setLoading(true);
            const response = await departmentAPI.getAll();
            setDepartments(response.data);
            setError(null);
        } catch (err) {
            setError('ไม่สามารถโหลดข้อมูลแผนกได้');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditDepartment(null);
        setShowModal(true);
    };

    const handleEdit = (department) => {
        setEditDepartment(department);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('คุณต้องการลบแผนกนี้หรือไม่?')) {
            try {
                await departmentAPI.delete(id);
                fetchDepartments();
            } catch (err) {
                alert(err.response?.data?.error || 'ไม่สามารถลบแผนกได้');
                console.error(err);
            }
        }
    };

    const handleFormSuccess = () => {
        setShowModal(false);
        fetchDepartments();
    };

    if (loading) return <div className="loading">กำลังโหลด...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>จัดการแผนก</h2>
                <button className="btn" onClick={handleAdd}>
                    + เพิ่มแผนก
                </button>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>รหัสแผนก</th>
                            <th>ชื่อแผนก</th>
                            <th>หัวหน้าแผนก</th>
                            <th>จำนวนพนักงาน</th>
                            <th>คำอธิบาย</th>
                            <th>การดำเนินการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {departments.map(dept => (
                            <tr key={dept.department_id}>
                                <td>{dept.department_code}</td>
                                <td>{dept.department_name}</td>
                                <td>
                                    {dept.manager_first_name && dept.manager_last_name
                                        ? `${dept.manager_first_name} ${dept.manager_last_name}`
                                        : '-'}
                                </td>
                                <td>{dept.employee_count}</td>
                                <td>{dept.description || '-'}</td>
                                <td>
                                    <button className="btn btn-secondary" onClick={() => handleEdit(dept)}>
                                        แก้ไข
                                    </button>
                                    <button className="btn btn-danger" onClick={() => handleDelete(dept.department_id)}>
                                        ลบ
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <DepartmentForm
                    department={editDepartment}
                    onClose={() => setShowModal(false)}
                    onSuccess={handleFormSuccess}
                />
            )}
        </div>
    );
}

export default Departments;
