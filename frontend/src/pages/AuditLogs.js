import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './AuditLogs.css';

function AuditLogs() {
    const { hasRole } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState(null);

    // Filters
    const [filters, setFilters] = useState({
        page: 1,
        limit: 50,
        action: '',
        table_name: '',
        search: '',
        start_date: '',
        end_date: ''
    });

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0
    });

    const isAdmin = hasRole('Admin');

    useEffect(() => {
        if (isAdmin) {
            fetchAuditLogs();
            fetchStats();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, isAdmin]);

    const fetchAuditLogs = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            // Build query string
            const queryParams = new URLSearchParams();
            Object.keys(filters).forEach(key => {
                if (filters[key]) {
                    queryParams.append(key, filters[key]);
                }
            });

            const response = await fetch(`http://localhost:5000/api/audit-logs?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch audit logs');
            }

            const data = await response.json();
            setLogs(data.logs || []);
            setPagination(data.pagination);
            setError(null);
        } catch (err) {
            setError('ไม่สามารถโหลดข้อมูล Audit Logs ได้');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/audit-logs/stats/summary', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);

        const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
                           'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

        const day = date.getDate();
        const month = thaiMonths[date.getMonth()];
        const year = date.getFullYear() + 543; // แปลงเป็น พ.ศ.
        const hour = String(date.getHours()).padStart(2, '0');
        const minute = String(date.getMinutes()).padStart(2, '0');
        const second = String(date.getSeconds()).padStart(2, '0');

        return `${day} ${month} ${year} ${hour}:${minute}:${second}`;
    };

    const getActionColor = (action) => {
        switch (action) {
            case 'CREATE':
                return '#28a745';
            case 'UPDATE':
                return '#ffc107';
            case 'DELETE':
                return '#dc3545';
            case 'LOGIN':
                return '#17a2b8';
            case 'LOGOUT':
                return '#6c757d';
            default:
                return '#007bff';
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value,
            page: 1 // Reset to first page when filter changes
        }));
    };

    const handlePageChange = (newPage) => {
        setFilters(prev => ({
            ...prev,
            page: newPage
        }));
    };

    const resetFilters = () => {
        setFilters({
            page: 1,
            limit: 50,
            action: '',
            table_name: '',
            search: '',
            start_date: '',
            end_date: ''
        });
    };

    // ตรวจสอบสิทธิ์ - เฉพาะ Admin
    if (!isAdmin) {
        return (
            <div className="error-message">
                <h2>ไม่มีสิทธิ์เข้าถึง</h2>
                <p>คุณไม่มีสิทธิ์เข้าถึงหน้า Audit Logs (เฉพาะ Admin เท่านั้น)</p>
            </div>
        );
    }

    return (
        <div className="audit-logs-container">
            <div className="page-header">
                <h1>Audit Logs</h1>
                <p>ประวัติการเปลี่ยนแปลงข้อมูลในระบบ</p>
            </div>

            {/* Statistics Cards */}
            {stats && (
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">📊</div>
                        <div className="stat-content">
                            <h3>Total Logs</h3>
                            <p className="stat-value">{stats.total.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">👥</div>
                        <div className="stat-content">
                            <h3>Active Users (30d)</h3>
                            <p className="stat-value">{stats.topUsers?.length || 0}</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">📋</div>
                        <div className="stat-content">
                            <h3>Tables Monitored</h3>
                            <p className="stat-value">{stats.tableStats?.length || 0}</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">⚡</div>
                        <div className="stat-content">
                            <h3>Actions Today</h3>
                            <p className="stat-value">
                                {stats.recentActivity?.[0]?.count || 0}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="filters-section">
                <div className="filters-grid">
                    <div className="filter-item">
                        <label>Search</label>
                        <input
                            type="text"
                            placeholder="ค้นหา username, description..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                        />
                    </div>
                    <div className="filter-item">
                        <label>Action</label>
                        <select
                            value={filters.action}
                            onChange={(e) => handleFilterChange('action', e.target.value)}
                        >
                            <option value="">ทั้งหมด</option>
                            <option value="CREATE">CREATE</option>
                            <option value="UPDATE">UPDATE</option>
                            <option value="DELETE">DELETE</option>
                            <option value="LOGIN">LOGIN</option>
                            <option value="LOGOUT">LOGOUT</option>
                            <option value="TRANSFER">TRANSFER</option>
                            <option value="PROMOTE">PROMOTE</option>
                        </select>
                    </div>
                    <div className="filter-item">
                        <label>Table</label>
                        <select
                            value={filters.table_name}
                            onChange={(e) => handleFilterChange('table_name', e.target.value)}
                        >
                            <option value="">ทั้งหมด</option>
                            <option value="employees">Employees</option>
                            <option value="departments">Departments</option>
                            <option value="positions">Positions</option>
                            <option value="users">Users</option>
                            <option value="employee_history">Employee History</option>
                            <option value="employee_terminations">Terminations</option>
                        </select>
                    </div>
                    <div className="filter-item">
                        <label>Start Date</label>
                        <input
                            type="date"
                            value={filters.start_date}
                            onChange={(e) => handleFilterChange('start_date', e.target.value)}
                        />
                    </div>
                    <div className="filter-item">
                        <label>End Date</label>
                        <input
                            type="date"
                            value={filters.end_date}
                            onChange={(e) => handleFilterChange('end_date', e.target.value)}
                        />
                    </div>
                    <div className="filter-item">
                        <button className="btn-secondary" onClick={resetFilters}>
                            Reset Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            {loading ? (
                <div className="loading">กำลังโหลด...</div>
            ) : error ? (
                <div className="error">{error}</div>
            ) : (
                <>
                    <div className="table-container">
                        <table className="audit-table">
                            <thead>
                                <tr>
                                    <th>Timestamp</th>
                                    <th>User</th>
                                    <th>Action</th>
                                    <th>Table</th>
                                    <th>Record ID</th>
                                    <th>Description</th>
                                    <th>IP Address</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.length > 0 ? (
                                    logs.map(log => (
                                        <tr key={log.log_id}>
                                            <td className="timestamp-cell">
                                                {formatDate(log.timestamp)}
                                            </td>
                                            <td>
                                                <div className="user-info">
                                                    <strong>
                                                        {log.first_name && log.last_name
                                                            ? `${log.first_name} ${log.last_name}`
                                                            : log.username}
                                                    </strong>
                                                    {log.employee_code && (
                                                        <span className="employee-code">
                                                            ({log.employee_code})
                                                        </span>
                                                    )}
                                                    {log.role_name && (
                                                        <span className="role-badge">
                                                            {log.role_name}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <span
                                                    className="action-badge"
                                                    style={{
                                                        backgroundColor: getActionColor(log.action),
                                                        color: 'white'
                                                    }}
                                                >
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="table-name">{log.table_name}</td>
                                            <td className="record-id">{log.record_id || '-'}</td>
                                            <td className="description">{log.description || '-'}</td>
                                            <td className="ip-address">{log.ip_address || '-'}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: 'center' }}>
                                            ไม่พบข้อมูล Audit Logs
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="pagination">
                            <button
                                onClick={() => handlePageChange(pagination.page - 1)}
                                disabled={pagination.page === 1}
                                className="btn-secondary"
                            >
                                Previous
                            </button>
                            <span className="page-info">
                                Page {pagination.page} of {pagination.totalPages}
                                ({pagination.total} total records)
                            </span>
                            <button
                                onClick={() => handlePageChange(pagination.page + 1)}
                                disabled={pagination.page === pagination.totalPages}
                                className="btn-secondary"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default AuditLogs;
