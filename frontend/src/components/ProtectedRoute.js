import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children, requiredRole, requiredPermission }) {
    const { user, loading, hasRole, hasPermission } = useAuth();

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh'
            }}>
                <div>กำลังโหลด...</div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Check role if required
    if (requiredRole && !hasRole(requiredRole)) {
        return (
            <div style={{
                padding: '40px',
                textAlign: 'center'
            }}>
                <h2>ไม่มีสิทธิ์เข้าถึง</h2>
                <p>คุณไม่มีสิทธิ์ในการเข้าถึงหน้านี้</p>
            </div>
        );
    }

    // Check permission if required
    if (requiredPermission && !hasPermission(requiredPermission)) {
        return (
            <div style={{
                padding: '40px',
                textAlign: 'center'
            }}>
                <h2>ไม่มีสิทธิ์เข้าถึง</h2>
                <p>คุณไม่มีสิทธิ์ในการเข้าถึงหน้านี้</p>
            </div>
        );
    }

    return children;
}

export default ProtectedRoute;
