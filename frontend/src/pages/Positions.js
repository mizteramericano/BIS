import React, { useState, useEffect } from 'react';
import { positionAPI } from '../services/api';
import PositionForm from '../components/PositionForm';

function Positions() {
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editPosition, setEditPosition] = useState(null);

    useEffect(() => {
        fetchPositions();
    }, []);

    const fetchPositions = async () => {
        try {
            setLoading(true);
            const response = await positionAPI.getAll();
            setPositions(response.data);
            setError(null);
        } catch (err) {
            setError('ไม่สามารถโหลดข้อมูลตำแหน่งได้');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditPosition(null);
        setShowModal(true);
    };

    const handleEdit = (position) => {
        setEditPosition(position);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('คุณต้องการลบตำแหน่งนี้หรือไม่?')) {
            try {
                await positionAPI.delete(id);
                fetchPositions();
            } catch (err) {
                alert(err.response?.data?.error || 'ไม่สามารถลบตำแหน่งได้');
                console.error(err);
            }
        }
    };

    const handleFormSuccess = () => {
        setShowModal(false);
        fetchPositions();
    };

    if (loading) return <div className="loading">กำลังโหลด...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>จัดการตำแหน่ง</h2>
                <button className="btn" onClick={handleAdd}>
                    + เพิ่มตำแหน่ง
                </button>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>รหัสตำแหน่ง</th>
                            <th>ชื่อตำแหน่ง</th>
                            <th>ระดับ</th>
                            <th>จำนวนพนักงาน</th>
                            <th>คำอธิบาย</th>
                            <th>การดำเนินการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {positions.map(pos => (
                            <tr key={pos.position_id}>
                                <td>{pos.position_code}</td>
                                <td>{pos.position_name}</td>
                                <td>
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '12px',
                                        fontSize: '0.85rem',
                                        backgroundColor: '#e3f2fd',
                                        color: '#1976d2'
                                    }}>
                                        Level {pos.level}
                                    </span>
                                </td>
                                <td>{pos.employee_count}</td>
                                <td>{pos.description || '-'}</td>
                                <td>
                                    <button className="btn btn-secondary" onClick={() => handleEdit(pos)}>
                                        แก้ไข
                                    </button>
                                    <button className="btn btn-danger" onClick={() => handleDelete(pos.position_id)}>
                                        ลบ
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <PositionForm
                    position={editPosition}
                    onClose={() => setShowModal(false)}
                    onSuccess={handleFormSuccess}
                />
            )}
        </div>
    );
}

export default Positions;
