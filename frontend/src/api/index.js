import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const getMe = () => api.get('/auth/me');

// Sites
export const getSites = () => api.get('/sites');
export const createSite = (data) => api.post('/sites', data);
export const getSite = (id) => api.get(`/sites/${id}`);
export const updateSite = (id, data) => api.put(`/sites/${id}`, data);
export const deleteSite = (id) => api.delete(`/sites/${id}`);
export const getSiteChecks = (id, range) => api.get(`/sites/${id}/checks`, { params: { range } });
export const getSiteUptime = (id, range) => api.get(`/sites/${id}/uptime`, { params: { range } });

// Public status
export const getPublicStatus = (slug) => api.get(`/status/${slug}`);

export default api;
