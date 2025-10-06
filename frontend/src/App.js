import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import EmployeeList from './pages/EmployeeList';
import EmployeeDetail from './pages/EmployeeDetail';
import Departments from './pages/Departments';
import Positions from './pages/Positions';
import AuditLogs from './pages/AuditLogs';

function AppContent() {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="App">
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>Mitsubishi Electric</h1>
          <p>Business Information System</p>
        </div>
        <ul className="navbar-menu">
          <li><Link to="/">Dashboard</Link></li>
          <li><Link to="/employees">Employees</Link></li>
          {(user.role === 'Manager' || user.role === 'Executive' || user.role === 'Admin') && (
            <>
              <li><Link to="/departments">Departments</Link></li>
              <li><Link to="/positions">Positions</Link></li>
            </>
          )}
          {user.role === 'Admin' && (
            <li><Link to="/audit-logs">Audit Logs</Link></li>
          )}
        </ul>
        <div className="navbar-user">
          <span>{user.first_name} {user.last_name} ({user.role})</span>
          <button onClick={logout} className="logout-button">ออกจากระบบ</button>
        </div>
      </nav>

      <div className="container">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/employees" element={<EmployeeList />} />
          <Route path="/employees/:id" element={<EmployeeDetail />} />
          <Route path="/departments" element={
            <ProtectedRoute requiredRole={['Manager', 'Executive', 'Admin']}>
              <Departments />
            </ProtectedRoute>
          } />
          <Route path="/positions" element={
            <ProtectedRoute requiredRole={['Manager', 'Executive', 'Admin']}>
              <Positions />
            </ProtectedRoute>
          } />
          <Route path="/audit-logs" element={
            <ProtectedRoute requiredRole={['Admin']}>
              <AuditLogs />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <AppContent />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

function Dashboard() {
  return (
    <div className="dashboard">
      <div className="dashboard-hero">
        <div className="hero-accent"></div>
        <h1>ยินดีต้อนรับสู่ระบบ Mitsubishi Electric</h1>
        <p className="hero-subtitle">Business Information System - ระบบจัดการข้อมูลพนักงาน</p>
      </div>

      <div className="dashboard-cards">
        <Link to="/employees" className="dashboard-card">
          <h3>จัดการพนักงาน</h3>
          <p>จัดการข้อมูลพนักงาน ประวัติ และเอกสารต่างๆ</p>
        </Link>

        <Link to="/departments" className="dashboard-card">
          <h3>จัดการแผนก</h3>
          <p>จัดการแผนกและหน่วยงานภายในบริษัท</p>
        </Link>

        <Link to="/positions" className="dashboard-card">
          <h3>จัดการตำแหน่ง</h3>
          <p>จัดการตำแหน่งงานและระดับพนักงาน</p>
        </Link>
      </div>
    </div>
  );
}

export default App;
