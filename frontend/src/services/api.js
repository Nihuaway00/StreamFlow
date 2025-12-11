import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
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
      
      return Promise.reject({
        ...error,
        isAuthError: true
      });
    }
    
    return Promise.reject(error);
  }
);

// ==================== AUTH API ====================
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

// ==================== STREAMS API ====================
export const streamAPI = {
  // Создать стрим (POST /api/streams) - с поддержкой файлов
  createStream: (formData) => api.post('/streams', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  
  // Получить список стримов (GET /api/streams)
  getStreams: (params = {}) => api.get('/streams', { 
    params: {
      page: params.page || 1,
      limit: params.limit || 20,
      status: params.status,
      show_deleted: params.show_deleted || false
    }
  }),
  
  // Получить мои стримы (GET /api/streams/my)
  getMyStreams: () => api.get('/streams/my'),
  
  // Получить стрим по ID (GET /api/streams/{stream_id})
  getStream: (streamId) => api.get(`/streams/${streamId}`),
  
  // Получить темы (GET /api/themes/)
  getThemes: () => api.get('/themes/'),
  
  // Обновить стрим (PATCH /api/streams/{stream_id}) - с поддержкой файлов
  updateStream: (streamId, formData) => api.patch(`/streams/${streamId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  
  // Удалить стрим (DELETE /api/streams/{stream_id})
  deleteStream: (streamId) => api.delete(`/streams/${streamId}`),
};

// ==================== CHAT API ====================
export const chatAPI = {
  // Получить сообщения чата (POST /api/chats/{chat_id}/messages)
  getChatMessages: (chatId, params = {}) => 
    api.post(`/chats/${chatId}/messages`, null, { 
      params: {
        page: params.page || 1,
        limit: params.limit || 20,
        sort: params.sort || 'desc'
      }
    }),
  
  // Отправить сообщение в чат - нужен endpoint
  // Если нет endpoint, используем WebSocket
  sendMessage: (chatId, content) => {
    console.warn('⚠️ sendMessage endpoint не найден в документации');
    return Promise.reject(new Error('Метод отправки сообщений не реализован'));
  },
  
  // Получить информацию о чате - если есть endpoint
  getChatInfo: (chatId) => {
    console.warn('⚠️ getChatInfo endpoint не найден в документации');
    return Promise.reject(new Error('Метод не реализован'));
  },
  
  // Получить список чатов пользователя - если есть endpoint
  getUserChats: () => {
    console.warn('⚠️ getUserChats endpoint не найден в документации');
    return Promise.reject(new Error('Метод не реализован'));
  },
};

// ==================== USERS API ====================
export const usersAPI = {
  getCurrentUser: () => api.get('/users/me'),
  getUser: (userId) => api.get(`/users/${userId}`),
  updateUser: (userData) => api.post('/users/me', userData),
};

// ==================== FILES API ====================
export const filesAPI = {
  // Получить URL файла (POST /api/files/ с query параметром file_key)
  getFileUrl: (fileKey) => api.post('/files/', null, { 
    params: { file_key: fileKey } 
  }),
};

// ==================== HELPER FUNCTIONS ====================
// Функция для проверки авторизации
export const isAuthenticated = () => {
  return !!localStorage.getItem('access_token');
};

// Функция для получения текущего пользователя (из localStorage)
export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Обновляем текущего пользователя в localStorage
export const updateCurrentUser = (userData) => {
  localStorage.setItem('user', JSON.stringify(userData));
};

// Хелпер для работы с аватарами
export const avatarHelper = {
  // Извлечь file_key из avatar_url
  extractFileKey: (avatarUrl) => {
    if (!avatarUrl) return null;
    
    if (typeof avatarUrl === 'string' && 
        !avatarUrl.includes('://') && 
        !avatarUrl.startsWith('/')) {
      return avatarUrl;
    }
    
    try {
      if (avatarUrl.startsWith('/')) {
        return avatarUrl.substring(1);
      }
      
      const url = new URL(avatarUrl);
      return url.pathname.substring(1);
    } catch (error) {
      return avatarUrl;
    }
  },
  
  // Получить полный URL для отображения аватара
  getAvatarUrl: async (avatarUrl) => {
    const fileKey = avatarHelper.extractFileKey(avatarUrl);
    if (!fileKey) return null;
    
    try {
      const response = await filesAPI.getFileUrl(fileKey);
      const url = response.data;
      
      // Заменяем storage:9000 на localhost:9000 для разработки
      if (url && typeof url === 'string' && url.includes('storage:9000')) {
        return url.replace('storage:9000', 'localhost:9000');
      }
      return url;
    } catch (error) {
      console.error('Ошибка получения URL аватара:', error);
      return null;
    }
  }
};

// Хелперы для тематик
export const themeHelpers = {
  getDisplayName: (themeName) => {
    const themeNames = {
      'gaming': '🎮 Игры',
      'music': '🎵 Музыка', 
      'just_chatting': '💬 Общение',
      'art': '🎨 Искусство',
      'sports': '⚽ Спорт',
      'education': '📚 Образование',
      'technology': '💻 Технологии',
      'cooking': '🍳 Кулинария'
    };
    return themeNames[themeName] || themeName;
  },
  
  getColor: (themeName) => {
    const themeColors = {
      'gaming': '#9147ff',
      'music': '#00ff7f',
      'just_chatting': '#00d2d3',
      'art': '#ff6b6b',
      'sports': '#ff9f43',
      'education': '#54a0ff',
      'technology': '#2e86de',
      'cooking': '#ff9ff3'
    };
    return themeColors[themeName] || '#9147ff';
  }
};

// Хелпер для WebSocket
export const wsHelper = {
  createChatWebSocket: (chatId) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('Нет токена для WebSocket');
    }
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    
    // Пробуем разные варианты WebSocket endpoints
    const wsUrls = [
      `${protocol}//${host}/api/chats/${chatId}/ws?token=${token}`,
      `${protocol}//${host}/ws/chats/${chatId}?token=${token}`,
      `${protocol}//${host}/api/chats/${chatId}?token=${token}`,
      `${protocol}//${host}/api/ws/chats/${chatId}?token=${token}`
    ];
    
    return {
      urls: wsUrls,
      createConnection: (urlIndex = 0) => {
        if (urlIndex >= wsUrls.length) {
          throw new Error('Все WebSocket URLs не сработали');
        }
        return new WebSocket(wsUrls[urlIndex]);
      }
    };
  }
};

export { api };
export default api;