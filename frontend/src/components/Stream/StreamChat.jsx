import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authAPI, api, chatAPI } from '../../services/api';

const StreamChat = ({ streamId, chatId: propChatId }) => {
  const { user: contextUser } = useAuth();
  const [user, setUser] = useState(null);
  const [chatId, setChatId] = useState(propChatId);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [chatSocket, setChatSocket] = useState(null);
  const messagesEndRef = useRef(null);

  // Отслеживаем состояние для отладки
  useEffect(() => {
    console.log('🔍 Состояние чата:', {
      chatId,
      connected,
      loading,
      user: user?.username,
      messagesCount: messages.length,
      socketReadyState: chatSocket?.readyState
    });
  }, [chatId, connected, loading, user, messages, chatSocket]);

  // Если chatId передан как пропс - используем его
  useEffect(() => {
    if (propChatId) {
      console.log(`✅ Chat ID получен как пропс: ${propChatId}`);
      setChatId(propChatId);
    } else {
      console.log('⚠️ Chat ID не передан как пропс');
    }
  }, [propChatId]);

  // Загружаем пользователя
  useEffect(() => {
    const loadUser = async () => {
      // Если пользователь уже есть в контексте
      if (contextUser) {
        console.log('✅ Пользователь из контекста:', contextUser.username);
        setUser(contextUser);
        return;
      }
      
      // Пробуем из localStorage
      try {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          console.log('✅ Пользователь из localStorage:', parsedUser.username);
          setUser(parsedUser);
          return;
        }
      } catch (e) {
        console.error('Ошибка парсинга пользователя:', e);
      }
      
      // Если ничего нет, загружаем с сервера
      console.log('🔄 Загружаю пользователя с сервера...');
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const response = await authAPI.getCurrentUser();
          const userData = response.data;
          console.log('✅ Пользователь загружен с сервера:', userData);
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } catch (error) {
          console.error('❌ Не удалось загрузить пользователя:', error);
        }
      } else {
        console.log('⚠️ Нет токена, пользователь не авторизован');
      }
    };

    loadUser();
  }, [contextUser]);

  // Инициализация WebSocket
  useEffect(() => {
    // Проверяем все необходимые условия
    if (!chatId) {
      console.log('⏳ Ожидаю chatId...');
      return;
    }

    if (!user) {
      console.log('⏳ Ожидаю пользователя...');
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      console.error('❌ Нет токена для WebSocket');
      return;
    }

    setLoading(true);
    console.log('🔌 Инициализация WebSocket:', { 
      chatId, 
      user: user.username,
      userId: user.id 
    });

    // Пробуем разные варианты WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    
    // Варианты WebSocket endpoints (пробуем по очереди)
    const wsUrls = [
      `${protocol}//${host}/api/chats/${chatId}/ws?token=${token}`,
      `${protocol}//${host}/ws/chats/${chatId}?token=${token}`,
      `${protocol}//${host}/api/chats/${chatId}?token=${token}`,
      `${protocol}//${host}/api/ws/chats/${chatId}?token=${token}`
    ];
    
    let currentWsUrlIndex = 0;
    let socket = null;

    const connectWebSocket = (urlIndex = 0) => {
      if (urlIndex >= wsUrls.length) {
        console.error('❌ Все WebSocket URLs не сработали');
        setLoading(false);
        setConnected(false);
        return;
      }

      const wsUrl = wsUrls[urlIndex];
      console.log(`🔌 Пробуем WebSocket URL ${urlIndex + 1}:`, wsUrl);

      try {
        socket = new WebSocket(wsUrl);
        
        socket.onopen = () => {
          console.log('✅ WebSocket подключен к URL:', wsUrl);
          setConnected(true);
          setLoading(false);
          // Загружаем историю сообщений
          loadMessageHistory();
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('📩 Получены данные от сервера:', data);
            
            // Обрабатываем разные форматы сообщений
            let message;
            
            // Если это JSON объект с полем content (новый формат)
            if (typeof data === 'object' && data.content) {
              // Если content это JSON строка, парсим её
              let content = data.content;
              if (typeof content === 'string' && content.startsWith('{') && content.endsWith('}')) {
                try {
                  const parsed = JSON.parse(content);
                  content = parsed.content || content;
                } catch (e) {
                  // Оставляем как есть если не JSON
                }
              }
              
              message = {
                id: data.id || `msg_${Date.now()}_${Math.random()}`,
                content: content,
                author: { 
                  id: data.user_id || data.author?.id || 'unknown', 
                  username: data.username || data.author?.username || 'Аноним'
                },
                chat: data.chat || { id: chatId },
                created_at: data.created_at || data.timestamp || new Date().toISOString()
              };
            } 
            // Если это уже отформатированное сообщение
            else if (typeof data === 'object' && data.author && data.content) {
              message = data;
            }
            // Если это строка (старый формат)
            else if (typeof data === 'string') {
              // Пробуем распарсить как JSON
              try {
                const parsed = JSON.parse(data);
                message = {
                  id: parsed.id || `msg_${Date.now()}_${Math.random()}`,
                  content: parsed.content || data,
                  author: { 
                    id: parsed.user_id || 'unknown', 
                    username: parsed.username || 'Аноним'
                  },
                  chat: parsed.chat || { id: chatId },
                  created_at: parsed.created_at || parsed.timestamp || new Date().toISOString()
                };
              } catch (e) {
                // Если не JSON, создаем простое сообщение
                message = {
                  id: `msg_${Date.now()}_${Math.random()}`,
                  content: data,
                  author: { id: 'unknown', username: 'Аноним' },
                  chat: { id: chatId },
                  created_at: new Date().toISOString()
                };
              }
            }
            
            if (message) {
              console.log('✅ Обработанное сообщение:', message);
              
              setMessages(prev => {
                // Убираем временные сообщения этого пользователя
                const filtered = prev.filter(m => {
                  // Сохраняем системные сообщения
                  if (m.author?.id === 'system') return true;
                  // Убираем временные сообщения если они от текущего пользователя
                  if (m.is_temp && m.author?.id === user?.id) return false;
                  // Сохраняем остальные
                  return true;
                });
                
                // Проверяем дубликаты
                const isDuplicate = filtered.some(m => m.id === message.id);
                if (isDuplicate) {
                  console.log('⚠️ Дубликат сообщения, пропускаем');
                  return filtered;
                }
                
                // Добавляем реальное сообщение
                return [...filtered, message];
              });
            } else {
              console.warn('⚠️ Неизвестный формат сообщения:', data);
            }
          } catch (error) {
            console.error('❌ Ошибка парсинга сообщения:', error, 'Данные:', event.data);
          }
        };

        socket.onclose = (event) => {
          console.log('🔴 WebSocket отключен:', {
            url: wsUrl,
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
          });
          setConnected(false);
          setLoading(false);
          
          // Пытаемся переподключиться через 3 секунды с другим URL
          if (event.code !== 1000) { // Не переподключаемся при нормальном закрытии
            setTimeout(() => {
              console.log('🔄 Пытаюсь переподключиться...');
              connectWebSocket((urlIndex + 1) % wsUrls.length);
            }, 3000);
          }
        };

        socket.onerror = (error) => {
          console.error('❌ WebSocket ошибка на URL:', wsUrl, error);
          // Пробуем следующий URL
          socket.close();
          setTimeout(() => {
            connectWebSocket(urlIndex + 1);
          }, 1000);
        };

        setChatSocket(socket);

      } catch (error) {
        console.error('❌ Ошибка создания WebSocket:', error);
        // Пробуем следующий URL
        setTimeout(() => {
          connectWebSocket(urlIndex + 1);
        }, 1000);
      }
    };

    connectWebSocket();

    return () => {
      if (socket) {
        console.log('🧹 Очистка WebSocket');
        socket.close(1000, 'Компонент размонтирован');
      }
    };
  }, [chatId, user]);

  // Загрузка истории сообщений
  const loadMessageHistory = async () => {
    if (!chatId) return;

    try {
      console.log(`📡 Загружаю историю для chat: ${chatId}`);
      
      const response = await chatAPI.getChatMessages(chatId, {
        page: 1,
        limit: 50,
        sort: 'desc'
      });
      
      console.log('📨 Ответ от сервера:', response);
      
      let history = [];
      
      // Обработка разных форматов ответа
      if (Array.isArray(response)) {
        history = response;
      } else if (response && Array.isArray(response.data)) {
        history = response.data;
      } else if (response && response.data && Array.isArray(response.data.items)) {
        history = response.data.items;
      } else if (response && response.data && Array.isArray(response.data.messages)) {
        history = response.data.messages;
      }
      
      // Обрабатываем каждое сообщение - проверяем не JSON ли это
      const processedHistory = history.map(msg => {
        // Если сообщение - это JSON строка, парсим её
        if (typeof msg === 'string') {
          try {
            const parsed = JSON.parse(msg);
            return {
              id: parsed.id || `msg_${Date.now()}_${Math.random()}`,
              content: parsed.content || msg, // Если есть content, используем его
              author: parsed.author || { 
                id: parsed.user_id || 'unknown', 
                username: parsed.username || 'Аноним' 
              },
              chat: parsed.chat || { id: chatId },
              created_at: parsed.created_at || parsed.timestamp || new Date().toISOString()
            };
          } catch (e) {
            // Если не JSON, возвращаем как обычный текст
            return {
              id: `msg_${Date.now()}_${Math.random()}`,
              content: msg,
              author: { id: 'unknown', username: 'Аноним' },
              chat: { id: chatId },
              created_at: new Date().toISOString()
            };
          }
        }
        
        // Если уже объект, проверяем поле content
        if (msg && typeof msg === 'object') {
          // Если content это JSON строка, парсим её
          if (typeof msg.content === 'string' && msg.content.startsWith('{') && msg.content.endsWith('}')) {
            try {
              const parsedContent = JSON.parse(msg.content);
              return {
                ...msg,
                content: parsedContent.content || msg.content,
                author: msg.author || { 
                  id: parsedContent.user_id || 'unknown', 
                  username: parsedContent.username || 'Аноним' 
                },
                created_at: msg.created_at || parsedContent.timestamp || new Date().toISOString()
              };
            } catch (e) {
              // Если не удалось распарсить, оставляем как есть
              return msg;
            }
          }
          // Если content это просто текст, оставляем как есть
          return msg;
        }
        
        return msg;
      });
      
      // Разворачиваем историю (новые сообщения в конце)
      history = processedHistory.reverse();
      
      console.log(`📊 Загружено ${history.length} сообщений`, history);
      
      if (history.length > 0) {
        setMessages(history);
      } else {
        // Пустой чат
        setMessages([{
          id: 'welcome_' + Date.now(),
          content: "💬 Добро пожаловать в чат стрима! Напишите первое сообщение.",
          author: { id: 'system', username: "Система" },
          chat: { id: chatId },
          created_at: new Date().toISOString(),
          is_system: true
        }]);
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки истории:', error);
      // Fallback сообщение
      setMessages([{
        id: 'error_' + Date.now(),
        content: "⚠️ Не удалось загрузить историю сообщений",
        author: { id: 'system', username: "Система" },
        chat: { id: chatId },
        created_at: new Date().toISOString(),
        is_error: true
      }]);
    }
  };

  // Отправка сообщения через WebSocket
  const handleSendMessage = () => {
    if (!newMessage.trim() || !user) {
      console.log('⚠️ Не могу отправить: нет сообщения или пользователя');
      return;
    }

    if (!connected || !chatSocket) {
      console.log('⚠️ WebSocket не подключен, пробую отправить через API');
      sendMessageViaAPI();
      return;
    }

    if (chatSocket.readyState !== WebSocket.OPEN) {
      console.error('WebSocket не в состоянии OPEN:', chatSocket.readyState);
      sendMessageViaAPI();
      return;
    }

    // Временное сообщение с уникальным ID
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const tempMsg = {
      id: tempId,
      content: newMessage.trim(),
      author: { 
        id: user.id, 
        username: user.username 
      },
      chat: { id: chatId },
      created_at: new Date().toISOString(),
      is_temp: true
    };
    
    console.log('📤 Добавляю временное сообщение:', tempMsg);
    setMessages(prev => [...prev, tempMsg]);

    try {
      // Формат данных для WebSocket
      const messageData = {
        content: newMessage.trim(),
        user_id: user.id,
        username: user.username,
        chat_id: chatId,
        timestamp: new Date().toISOString()
      };
      
      console.log('📤 Отправляю через WebSocket:', messageData);
      chatSocket.send(JSON.stringify(messageData));
      
      // Очищаем поле ввода
      setNewMessage('');
      
    } catch (error) {
      console.error('❌ Ошибка отправки через WebSocket:', error);
      // Убираем временное сообщение
      setTimeout(() => {
        setMessages(prev => prev.filter(m => m.id !== tempId));
        // Пробуем через API
        sendMessageViaAPI(newMessage.trim());
      }, 100);
    }
  };

  // Отправка сообщения через REST API (fallback)
  const sendMessageViaAPI = async (contentToSend = null) => {
    const messageContent = contentToSend || newMessage.trim();
    if (!messageContent || !user || !chatId) return;

    const tempId = `temp_api_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const tempMsg = {
      id: tempId,
      content: messageContent,
      author: { 
        id: user.id, 
        username: user.username 
      },
      chat: { id: chatId },
      created_at: new Date().toISOString(),
      is_temp: true,
      via_api: true
    };
    
    console.log('📤 Отправляю через API (fallback):', tempMsg);
    setMessages(prev => [...prev, tempMsg]);

    try {
      // Попробуем разные endpoints для отправки сообщений
      const endpoints = [
        `/chats/${chatId}/send`,
        `/chats/${chatId}/message`,
        `/chats/${chatId}/messages/send`
      ];

      let success = false;
      let lastError = null;

      for (const endpoint of endpoints) {
        try {
          console.log(`🔄 Пробую endpoint: ${endpoint}`);
          const response = await api.post(endpoint, {
            content: messageContent,
            chat_id: chatId,
            user_id: user.id
          });
          
          console.log('✅ Сообщение отправлено через API:', response.data);
          success = true;
          
          // Убираем временное сообщение
          setMessages(prev => prev.filter(m => m.id !== tempId));
          
          // Загружаем обновленную историю
          setTimeout(() => {
            loadMessageHistory();
          }, 500);
          
          break;
        } catch (err) {
          lastError = err;
          console.log(`❌ Endpoint ${endpoint} не сработал:`, err.message);
        }
      }

      if (!success) {
        throw lastError || new Error('Все endpoints не сработали');
      }

      if (!contentToSend) {
        setNewMessage('');
      }
      
    } catch (error) {
      console.error('❌ Ошибка отправки через API:', error);
      
      // Обновляем временное сообщение с ошибкой
      setMessages(prev => prev.map(m => 
        m.id === tempId 
          ? { 
              ...m, 
              content: `⚠️ Не отправлено: ${messageContent}`,
              is_error: true 
            } 
          : m
      ));
      
      // Через 5 секунд удаляем сообщение об ошибке
      setTimeout(() => {
        setMessages(prev => prev.filter(m => m.id !== tempId));
      }, 5000);
    }
  };

  // Автоскролл к последнему сообщению
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end' 
        });
      }, 100);
    }
  }, [messages]);

  // Enter для отправки
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Функция для форматирования времени
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      const now = new Date();
      
      // Если сегодня
      if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString('ru-RU', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }
      
      // Если вчера
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) {
        return `вчера ${date.toLocaleTimeString('ru-RU', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}`;
      }
      
      // Старые сообщения
      return date.toLocaleDateString('ru-RU', { 
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return '';
    }
  };

  // Простая проверка - если страница белая, покажем хотя бы что-то
  if (!chatId && !user) {
    return (
      <div style={{
        padding: '20px',
        color: '#fff',
        background: '#0e0e10',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ fontSize: '48px' }}>💬</div>
        <div>Загрузка чата...</div>
        <div style={{ fontSize: '12px', color: '#666' }}>
          Stream ID: {streamId}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#0e0e10',
      color: '#fff'
    }}>
      {/* Заголовок с информацией */}
      <div style={{
        padding: '15px 20px',
        borderBottom: '1px solid #333',
        background: '#18181b',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>💬 Чат стрима</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: connected ? '#00ff7f' : '#ff6b6b',
              animation: connected ? 'pulse 2s infinite' : 'none'
            }} />
            <span style={{ 
              fontSize: '12px', 
              color: connected ? '#00ff7f' : '#ff6b6b',
              fontWeight: '500'
            }}>
              {connected ? 'Подключен' : 'Отключен'}
            </span>
            {messages.length > 0 && (
              <span style={{ 
                fontSize: '12px', 
                color: '#adadb8',
                marginLeft: '10px'
              }}>
                {messages.filter(m => !m.is_temp && !m.is_system).length} сообщений
              </span>
            )}
          </div>
        </div>
        <button
          onClick={loadMessageHistory}
          disabled={loading}
          style={{
            background: '#252525',
            color: '#adadb8',
            border: '1px solid #444',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            opacity: loading ? 0.5 : 1
          }}
        >
          {loading ? '⏳' : '🔄'} Обновить
        </button>
      </div>

      {/* Сообщения */}
      <div style={{
        flex: 1,
        padding: '20px',
        overflowY: 'auto',
        background: '#0e0e10',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {loading && messages.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: '#666',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '15px'
          }}>
            <div style={{
              width: '30px',
              height: '30px',
              border: '3px solid rgba(145, 71, 255, 0.3)',
              borderTopColor: '#9147ff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <div>Загрузка сообщений...</div>
          </div>
        ) : messages.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: '#666',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '15px'
          }}>
            <div style={{ fontSize: '48px' }}>💬</div>
            <div>{connected ? 'Пока нет сообщений' : 'Ожидание подключения...'}</div>
            {!connected && (
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: '#9147ff',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  marginTop: '10px'
                }}
              >
                Переподключиться
              </button>
            )}
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                background: msg.is_temp 
                  ? 'rgba(145, 71, 255, 0.1)' 
                  : msg.is_system 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : msg.is_error
                      ? 'rgba(255, 107, 107, 0.1)'
                      : '#252525',
                border: `1px solid ${
                  msg.is_temp ? '#9147ff' 
                  : msg.is_system ? '#666' 
                  : msg.is_error ? '#ff6b6b' 
                  : '#333'
                }`,
                borderRadius: '8px',
                padding: '12px',
                opacity: msg.is_temp ? 0.8 : 1,
                animation: msg.is_temp ? 'pulse 2s infinite' : 'none'
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '6px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px' 
                }}>
                  <strong style={{ 
                    color: msg.author?.id === user?.id 
                      ? '#00ff7f' 
                      : msg.author?.id === 'system'
                        ? '#adadb8'
                        : '#9147ff',
                    fontSize: '14px'
                  }}>
                    {msg.author?.username || 'Аноним'}
                    {msg.is_temp && ' (отправка...)'}
                    {msg.via_api && ' (через API)'}
                  </strong>
                  {msg.author?.id === user?.id && !msg.is_temp && (
                    <span style={{
                      fontSize: '10px',
                      background: 'rgba(0, 255, 127, 0.1)',
                      color: '#00ff7f',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      fontWeight: 'normal'
                    }}>
                      Вы
                    </span>
                  )}
                </div>
                <span style={{ 
                  color: '#666', 
                  fontSize: '11px',
                  whiteSpace: 'nowrap'
                }}>
                  {formatMessageTime(msg.created_at) || 'только что'}
                </span>
              </div>
              <div style={{ 
                color: msg.is_error ? '#ff6b6b' : '#efeff1', 
                fontSize: '14px',
                lineHeight: '1.4',
                wordBreak: 'break-word'
              }}>
                {msg.content}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Форма отправки */}
      <div style={{
        padding: '15px 20px',
        borderTop: '1px solid #333',
        background: '#18181b'
      }}>
        <div style={{ 
          display: 'flex', 
          gap: '10px',
          alignItems: 'center'
        }}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              !connected 
                ? "Подключение к чату..." 
                : !user
                  ? "Войдите в аккаунт..."
                  : "Напишите сообщение..."
            }
            disabled={!connected || !user}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              outline: 'none',
              transition: 'border 0.2s'
            }}
            onFocus={(e) => e.target.style.border = '1px solid #9147ff'}
            onBlur={(e) => e.target.style.border = '1px solid #333'}
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !connected || !user}
            style={{
              background: !newMessage.trim() || !connected || !user 
                ? '#333' 
                : '#9147ff',
              color: 'white',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '8px',
              cursor: !newMessage.trim() || !connected || !user 
                ? 'not-allowed' 
                : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              minWidth: '50px',
              transition: 'all 0.2s',
              opacity: !newMessage.trim() || !connected || !user ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              if (newMessage.trim() && connected && user) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 12px rgba(145, 71, 255, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            {loading ? '⏳' : '➤'}
          </button>
        </div>
        <div style={{
          fontSize: '11px',
          color: '#666',
          marginTop: '8px',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span>
            {connected 
              ? user 
                ? `Вы вошли как: ${user.username}` 
                : 'Не авторизован'
              : 'Отключен от чата'
            }
          </span>
          <span>
            {newMessage.trim().length > 0 && `${newMessage.trim().length}/500`}
          </span>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 0.5; }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        * {
          scrollbar-width: thin;
          scrollbar-color: #333 transparent;
        }
        
        *::-webkit-scrollbar {
          width: 6px;
        }
        
        *::-webkit-scrollbar-track {
          background: transparent;
        }
        
        *::-webkit-scrollbar-thumb {
          background-color: #333;
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
};

export default StreamChat;