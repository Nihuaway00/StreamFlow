import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});

// Интерцептор для добавления токена
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Интерцептор для обработки ошибок авторизации
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Очищаем токен и перенаправляем на страницу входа
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      
      // Перенаправляем на страницу логина
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (userData) => api.post('/auth/login', userData),
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    return api.post('/auth/logout');
  },
  refreshToken: () => api.post('/auth/refresh'),
  // ДОБАВЛЯЕМ ЭТОТ МЕТОД ↓
  getCurrentUser: () => api.get('/users/me'),
};

export const streamAPI = {
  createStream: (streamData) => api.post('/streams', streamData),
  getStreams: (params = {}) => api.get('/streams', { params }),
  getMyStreams: () => api.get('/streams/my'),
  getStream: (streamId) => api.get(`/streams/${streamId}`),
};

// Функция для проверки авторизации
export const isAuthenticated = () => {
  return !!localStorage.getItem('access_token');
};

// Функция для получения текущего пользователя (из localStorage)
export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export default api;