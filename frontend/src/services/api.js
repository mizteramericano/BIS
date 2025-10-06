import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests if available
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Employees API
export const employeeAPI = {
    getAll: () => api.get('/employees'),
    getById: (id) => api.get(`/employees/${id}`),
    create: (data) => api.post('/employees', data),
    update: (id, data) => api.put(`/employees/${id}`, data),
    delete: (id) => api.delete(`/employees/${id}`),
    searchByYears: (years) => api.get(`/employees/search/years/${years}`),
    addHistory: (id, data) => api.post(`/employees/${id}/history`, data),
    transfer: (id, data) => api.post(`/employees/${id}/transfer`, data)
};

// Departments API
export const departmentAPI = {
    getAll: () => api.get('/departments'),
    getById: (id) => api.get(`/departments/${id}`),
    create: (data) => api.post('/departments', data),
    update: (id, data) => api.put(`/departments/${id}`, data),
    delete: (id) => api.delete(`/departments/${id}`)
};

// Positions API
export const positionAPI = {
    getAll: () => api.get('/positions'),
    getById: (id) => api.get(`/positions/${id}`),
    create: (data) => api.post('/positions', data),
    update: (id, data) => api.put(`/positions/${id}`, data),
    delete: (id) => api.delete(`/positions/${id}`)
};

// Leaves API
export const leaveAPI = {
    getAll: () => api.get('/leaves'),
    getById: (id) => api.get(`/leaves/${id}`),
    getByEmployee: (employeeId) => api.get(`/leaves/employee/${employeeId}`),
    getSummary: (employeeId) => api.get(`/leaves/summary/${employeeId}`),
    create: (data) => api.post('/leaves', data),
    update: (id, data) => api.put(`/leaves/${id}`, data),
    updateStatus: (id, data) => api.put(`/leaves/${id}/status`, data),
    delete: (id) => api.delete(`/leaves/${id}`)
};

// Auth API
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (data) => api.post('/auth/register', data),
    getProfile: () => api.get('/auth/me'),
    changePassword: (data) => api.post('/auth/change-password', data),
    logout: () => api.post('/auth/logout')
};

export default api;
