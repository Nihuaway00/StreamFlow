import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // просто /api
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
  async (error) => {
    const originalRequest = error.config;
    const url = originalRequest.url || '';
    
    console.log('❌ Interceptor caught error:', {
      url: url,
      status: error.response?.status,
      method: originalRequest.method
    });
    
    // НЕ ОБРАБАТЫВАЕМ ошибки этих endpoints:
    const ignoreEndpoints = [
      '/auth/login',
      '/auth/register', 
      '/auth/refresh',
      '/auth/logout'
    ];
    
    if (ignoreEndpoints.some(ep => url.includes(ep))) {
      return Promise.reject(error);
    }
    
    // Только для 401 ошибок (не авторизован)
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('🔐 401 error detected, trying refresh...');
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          console.log('🔄 Attempting token refresh...');
          const response = await api.post('/auth/refresh', {
            refresh_token: refreshToken
          });
          
          const { access_token, refresh_token } = response.data;
          console.log('✅ Tokens refreshed successfully');
          
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', refresh_token);
          
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.log('❌ Refresh token failed:', refreshError);
      }
      
      // Если refresh не сработал - SOFT logout (без редиректа)
      console.log('⚠️ Soft logout (clearing tokens but staying on page)');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      
      // НЕ редиректим сразу! Пусть компонент сам решит что делать
      // if (window.location.pathname !== '/login') {
      //   window.location.href = '/login';
      // }
      
      // Просто отклоняем ошибку
      return Promise.reject({
        ...error,
        isAuthError: true // Добавляем флаг
      });
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
  getCurrentUser: () => api.get('/users/me'),
};

export const streamAPI = {
  createStream: (streamData) => api.post('/streams', streamData),
  getStreams: (params = {}) => api.get('/streams', { params }),
  getMyStreams: () => api.get('/streams/my'),
  getStream: (streamId) => api.get(`/streams/${streamId}`),
  getUserPublicInfo: (userId) => api.get(`/users/${userId}`),
  getThemes: () => api.get('/themes/'),
  deleteStream: (streamId) => api.delete(`/streams/${streamId}`),
  updateStream: (streamId, streamData) => api.patch(`/streams/${streamId}`, streamData),
};

// Функция для проверки авторизации
export const isAuthenticated = () => {
  return !!localStorage.getItem('access_token');
};

export const chatAPI = {
  // Получить сообщения чата: POST с query params, body пустой
  getChatMessages: (chatId, params = {}) => 
    api.post(`/chats/${chatId}/messages`, null, { 
      params: {
        page: params.page || 1,
        limit: params.limit || 20,
        sort: params.sort || 'desc'
      }
    }),
  
  // Отправить сообщение: POST с content в body
  sendMessage: (chatId, content) => 
    api.post(`/chats/${chatId}/messages`, {
      content: content
      // author_id бэкенд возьмет из токена
    }).then(response => {
      // ВАЖНО: возвращаем данные сообщения, а не весь response
      return response.data;
    }),
  // Получить список чатов пользователя
  getUserChats: () => api.get('/chats'),
};

// Функция для получения текущего пользователя (из localStorage)
export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Прикол, пользователи с БЭКА!!!
export const usersAPI = {
  getCurrentUser: () => api.get('/users/me'),
  getUser: (userId) => api.get(`/users/${userId}`),
  updateUser: (userData) => api.post('/users/me', userData),
};

// я дошёл до аваатарок))) чувакииии)
export const filesAPI = {
  getFileUrl: (fileKey) => api.post('/files/', null, { 
    params: { file_key: fileKey } 
  }), // POST запрос??
};

export default api;
