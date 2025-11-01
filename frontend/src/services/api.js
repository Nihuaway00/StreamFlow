import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (userData) => api.post('/auth/login', userData),
  logout: () => api.post('/auth/logout'),
};

export const streamAPI = {
  createStream: (streamData) => api.post('/streams', streamData),
  getStreams: (params = {}) => api.get('/streams', { params }),
  getMyStreams: () => api.get('/streams/my'),
  getStream: (streamId) => api.get(`/streams/${streamId}`),
};

export default api;