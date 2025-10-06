import React, { useState, useEffect } from 'react';
import { positionAPI } from '../services/api';

function PositionForm({ position, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        position_code: '',
        position_name: '',
        level: '',
        description: ''
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (position) {
            setFormData({
                position_code: position.position_code || '',
                position_name: position.position_name || '',
                level: position.level || '',
                description: position.description || ''
            });
        }
    }, [position]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (position) {
                await positionAPI.update(position.position_id, formData);
            } else {
                await positionAPI.create(formData);
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
                <h2>{position ? 'แก้ไขตำแหน่ง' : 'เพิ่มตำแหน่งใหม่'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>รหัสตำแหน่ง *</label>
                        <input
                            type="text"
                            name="position_code"
                            value={formData.position_code}
                            onChange={handleChange}
                            required
                            disabled={!!position}
                        />
                    </div>

                    <div className="form-group">
                        <label>ชื่อตำแหน่ง *</label>
                        <input
                            type="text"
                            name="position_name"
                            value={formData.position_name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>ระดับ</label>
                        <input
                            type="number"
                            name="level"
                            value={formData.level}
                            onChange={handleChange}
                            min="1"
                            max="10"
                        />
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

export default PositionForm;
