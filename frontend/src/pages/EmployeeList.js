import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { employeeAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import EmployeeForm from '../components/EmployeeForm';

function EmployeeList() {
    const { user, hasRole } = useAuth();
    const [employees, setEmployees] = useState([]);
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editEmployee, setEditEmployee] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const isEmployee = user?.role === 'Employee';
    const canManage = hasRole(['Manager', 'Executive', 'HR Staff', 'Admin']);

    useEffect(() => {
        fetchEmployees();
    }, []);

    useEffect(() => {
        filterEmployees();
    }, [searchTerm, employees]);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const response = await employeeAPI.getAll();
            setEmployees(response.data);
            setFilteredEmployees(response.data);
            setError(null);
        } catch (err) {
            setError('ไม่สามารถโหลดข้อมูลพนักงานได้');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filterEmployees = () => {
        if (!searchTerm.trim()) {
            setFilteredEmployees(employees);
            return;
        }

        const filtered = employees.filter(emp =>
            emp.employee_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (emp.department_name && emp.department_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (emp.position_name && emp.position_name.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setFilteredEmployees(filtered);
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const clearSearch = () => {
        setSearchTerm('');
    };

    const handleAdd = () => {
        setEditEmployee(null);
        setShowModal(true);
    };

    const handleEdit = (employee) => {
        setEditEmployee(employee);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('คุณต้องการลบพนักงานนี้หรือไม่?')) {
            try {
                await employeeAPI.delete(id);
                fetchEmployees();
            } catch (err) {
                alert('ไม่สามารถลบพนักงานได้');
                console.error(err);
            }
        }
    };

    const handleFormSuccess = () => {
        setShowModal(false);
        fetchEmployees();
    };

    if (loading) return <div className="loading">กำลังโหลด...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>{isEmployee ? 'รายชื่อพนักงาน' : 'จัดการข้อมูลพนักงาน'}</h2>
                {canManage && (
                    <button className="btn" onClick={handleAdd}>
                        + เพิ่มพนักงาน
                    </button>
                )}
            </div>

            {/* Search Bar */}
            <div className="search-container">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="ค้นหาด้วย รหัสพนักงาน, ชื่อ, แผนก, ตำแหน่ง..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="search-input"
                    />
                    {searchTerm && (
                        <button className="search-clear" onClick={clearSearch}>
                            ✕
                        </button>
                    )}
                </div>
                <div className="search-result">
                    พบ <strong>{filteredEmployees.length}</strong> จาก {employees.length} รายการ
                </div>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>รหัสพนักงาน</th>
                            <th>ชื่อ-นามสกุล</th>
                            {isEmployee ? (
                                <th>อายุ</th>
                            ) : (
                                <>
                                    <th>ตำแหน่ง</th>
                                    <th>อีเมล</th>
                                    <th>สถานะ</th>
                                </>
                            )}
                            <th>แผนก</th>
                            {canManage && <th>การดำเนินการ</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEmployees.map(employee => {
                            const isOwnData = isEmployee && parseInt(employee.employee_id) === parseInt(user.employee_id);
                            const canViewDetail = !isEmployee || isOwnData;

                            return (
                                <tr key={employee.employee_id}>
                                    <td>{employee.employee_code}</td>
                                    <td>
                                        {canViewDetail ? (
                                            <Link to={`/employees/${employee.employee_id}`}>
                                                {employee.title} {employee.first_name} {employee.last_name}
                                            </Link>
                                        ) : (
                                            <span>{employee.title} {employee.first_name} {employee.last_name}</span>
                                        )}
                                    </td>
                                    {isEmployee ? (
                                        <td>{employee.age ? `${employee.age} ปี` : '-'}</td>
                                    ) : (
                                        <>
                                            <td>{employee.position_name || '-'}</td>
                                            <td>{employee.email || '-'}</td>
                                            <td>
                                                <span style={{
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '12px',
                                                    fontSize: '0.85rem',
                                                    backgroundColor: employee.employment_status === 'Active' ? '#d4edda' : '#f8d7da',
                                                    color: employee.employment_status === 'Active' ? '#155724' : '#721c24'
                                                }}>
                                                    {employee.employment_status}
                                                </span>
                                            </td>
                                        </>
                                    )}
                                    <td>{employee.department_name || '-'}</td>
                                    {canManage && (
                                        <td>
                                            <button className="btn btn-secondary" onClick={() => handleEdit(employee)}>
                                                แก้ไข
                                            </button>
                                            <button className="btn btn-danger" onClick={() => handleDelete(employee.employee_id)}>
                                                ลบ
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <EmployeeForm
                    employee={editEmployee}
                    onClose={() => setShowModal(false)}
                    onSuccess={handleFormSuccess}
                />
            )}
        </div>
    );
}

export default EmployeeList;
