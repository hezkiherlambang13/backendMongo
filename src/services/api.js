import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ================= AUTH API =================
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  loginWithGoogle: (credential) => api.post('/auth/google', { credential }),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// ================= PACKAGE API =================
export const packageAPI = {
  getAll: (params) => api.get('/packages', { params }),
  getById: (id) => api.get(`/packages/${id}`),
  create: (formData) => api.post('/packages', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, formData) => api.put(`/packages/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id) => api.delete(`/packages/${id}`),
};

// ================= BOOKING API =================
export const bookingAPI = {
  getAll: () => api.get('/bookings'),
  getById: (id) => api.get(`/bookings/${id}`),
  create: (data) => api.post('/bookings', data),
  updateStatus: (id, status) => api.patch(`/bookings/${id}/status`, { status }),
  updatePayment: (id, paymentStatus) => api.patch(`/bookings/${id}/payment`, { paymentStatus }),
  cancel: (id) => api.patch(`/bookings/${id}/cancel`),
  delete: (id) => api.delete(`/bookings/${id}`),
  getStats: () => api.get('/bookings/stats/summary'),
};

// ================= STUDIO API ================= ✅ NEW
export const studioAPI = {
  getAll: () => api.get('/studios'),
  getById: (id) => api.get(`/studios/${id}`),
  toggle: (id) => api.patch(`/studios/${id}/toggle`),
  update: (id, data) => api.put(`/studios/${id}`, data),
};

// ================= ADMIN API =================
export const adminAPI = {
  getUsers: () => api.get('/admin/users'),
  updateUserRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
};

// ================= LOGIN BACKGROUND API =================
export const loginBgAPI = {
  getAll: () => api.get('/login-backgrounds'),
  create: (formData) => api.post('/login-backgrounds', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id) => api.delete(`/login-backgrounds/${id}`),
};

export const emailTemplateAPI = {
  get: () => api.get('/email-template'),
  update: (data) => api.put('/email-template', data),
  reset: () => api.post('/email-template/reset'),
};

export const managerStatsAPI = {
  get: (params) => api.get('/bookings/manager-stats', { params }),
};


// ================= TIME SLOT API =================
export const timeSlotAPI = {
  getAll: () => api.get('/time-slots'),
  create: (data) => api.post('/time-slots', data),
  update: (id, data) => api.put(`/time-slots/${id}`, data),
  delete: (id) => api.delete(`/time-slots/${id}`),
};

export default api;