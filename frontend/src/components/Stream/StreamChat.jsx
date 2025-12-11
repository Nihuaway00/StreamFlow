import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authAPI, api, chatAPI } from '../../services/api';

const StreamChat = ({ streamId, chatId: propChatId }) => {
  const { user: contextUser } = useAuth();
  const [user, setUser] = useState(null);
  const [chatId, setChatId] = useState(propChatId);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [chatSocket, setChatSocket] = useState(null);
  const messagesEndRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const retryCountRef = useRef(0);
  const maxRetries = 5;

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
      if (contextUser) {
        setUser(contextUser);
        return;
      }
      
      try {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          return;
        }
      } catch (e) {
        console.error('Ошибка парсинга пользователя:', e);
      }
      
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const response = await authAPI.getCurrentUser();
          const userData = response.data;
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } catch (error) {
          console.error('❌ Не удалось загрузить пользователя:', error);
        }
      }
    };

    loadUser();
  }, [contextUser]);

  // Основной эффект для загрузки и обновления чата
  useEffect(() => {
    if (!chatId || !user) return;

    console.log('🚀 Запускаю автообновление чата');
    
    // Сразу загружаем историю
    loadMessageHistory();
    
    // Запускаем интервал для обновления каждую секунду
    pollingIntervalRef.current = setInterval(() => {
      console.log('🔄 Автообновление чата...');
      loadMessageHistory();
    }, 1000); // Каждую секунду
    
    // Пытаемся подключить WebSocket
    setupWebSocket();
    
    return () => {
      console.log('🧹 Очистка интервалов и WebSocket');
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (chatSocket) {
        chatSocket.close();
      }
    };
  }, [chatId, user]);

  // Настройка WebSocket
  const setupWebSocket = () => {
    if (!chatId || !user) return;
    
    const token = localStorage.getItem('access_token');
    if (!token) return;
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/api/chats/${chatId}?token=${token}`;
    
    console.log(`🔌 Пробую WebSocket: ${wsUrl}`);
    
    try {
      const socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        console.log('✅ WebSocket подключен');
        setConnected(true);
        retryCountRef.current = 0;
      };
      
      socket.onmessage = (event) => {
        console.log('📩 Сообщение через WebSocket:', event.data);
        // Если пришло сообщение через WS, обновляем чат
        setTimeout(() => loadMessageHistory(), 100);
      };
      
      socket.onclose = () => {
        console.log('🔴 WebSocket отключен');
        setConnected(false);
        // Пробуем переподключиться через 3 секунды
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          setTimeout(() => setupWebSocket(), 3000);
        }
      };
      
      socket.onerror = (error) => {
        console.error('❌ WebSocket ошибка:', error);
        setConnected(false);
      };
      
      setChatSocket(socket);
    } catch (error) {
      console.error('❌ Ошибка создания WebSocket:', error);
    }
  };

  // Загрузка истории сообщений
  const loadMessageHistory = async () => {
    if (!chatId) return;
    
    try {
      console.log(`📡 Запрос истории чата ${chatId}`);
      
      const response = await chatAPI.getChatMessages(chatId, {
        page: 1,
        limit: 100,
        sort: 'desc'
      });
      
      let history = [];
      
      // Обработка разных форматов ответа
      if (Array.isArray(response.data)) {
        history = response.data;
      } else if (response.data && Array.isArray(response.data.items)) {
        history = response.data.items;
      } else if (response.data && Array.isArray(response.data.messages)) {
        history = response.data.messages;
      } else if (Array.isArray(response)) {
        history = response;
      }
      
      if (history.length > 0) {
        const processedMessages = history.reverse().map(msg => {
          let content = '';
          
          // Обрабатываем content
          if (msg.content && typeof msg.content === 'string') {
            try {
              const parsed = JSON.parse(msg.content);
              content = parsed.content || msg.content;
            } catch {
              content = msg.content;
            }
          } else if (msg.content) {
            content = msg.content;
          }
          
          return {
            id: msg.id || `msg_${Date.now()}_${Math.random()}`,
            content: content,
            author: msg.author || { 
              id: msg.user_id || 'unknown', 
              username: msg.username || 'Аноним' 
            },
            chat: msg.chat || { id: chatId },
            created_at: msg.created_at || new Date().toISOString()
          };
        });
        
        // Обновляем сообщения только если они изменились
        setMessages(prev => {
          const prevIds = prev.map(m => m.id).join(',');
          const newIds = processedMessages.map(m => m.id).join(',');
          
          if (prevIds !== newIds) {
            console.log(`🔄 Обновляю чат: ${processedMessages.length} сообщений`);
            return processedMessages;
          }
          
          return prev;
        });
        
        setLoading(false);
      } else {
        setMessages([{
          id: 'welcome_' + Date.now(),
          content: "💬 Чат пуст. Напишите первое сообщение!",
          author: { id: 'system', username: "Система" },
          chat: { id: chatId },
          created_at: new Date().toISOString(),
          is_system: true
        }]);
        setLoading(false);
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки истории:', error);
      setLoading(false);
      
      if (!messages.length) {
        setMessages([{
          id: 'error_' + Date.now(),
          content: "⚠️ Ошибка загрузки чата. Попробуйте обновить страницу.",
          author: { id: 'system', username: "Система" },
          chat: { id: chatId },
          created_at: new Date().toISOString(),
          is_error: true
        }]);
      }
    }
  };

  // Отправка сообщения
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !chatId) return;
    
    const messageContent = newMessage.trim();
    
    // Временное сообщение
    const tempMsg = {
      id: `temp_${Date.now()}`,
      content: messageContent,
      author: { 
        id: user.id, 
        username: user.username 
      },
      chat: { id: chatId },
      created_at: new Date().toISOString(),
      is_temp: true
    };
    
    setMessages(prev => [...prev, tempMsg]);
    
    try {
      // Пробуем отправить через WebSocket
      if (connected && chatSocket && chatSocket.readyState === WebSocket.OPEN) {
        chatSocket.send(messageContent);
        console.log('✅ Отправлено через WebSocket');
      } else {
        console.log('⚠️ WebSocket недоступен, отправляю через API');
        // Пробуем разные endpoints API
        await trySendViaAPI(messageContent);
      }
      
      // Обновляем чат через 500мс
      setTimeout(() => loadMessageHistory(), 500);
      
    } catch (error) {
      console.error('❌ Ошибка отправки:', error);
      
      // Показываем ошибку
      setMessages(prev => prev.map(msg => 
        msg.id === tempMsg.id 
          ? { ...msg, content: `❌ Ошибка: ${messageContent}`, is_error: true }
          : msg
      ));
      
      // Через 3 секунды удаляем сообщение об ошибке
      setTimeout(() => {
        setMessages(prev => prev.filter(msg => msg.id !== tempMsg.id));
        // И пытаемся снова загрузить историю
        loadMessageHistory();
      }, 3000);
    }
    
    setNewMessage('');
  };

  // Fallback отправка через API
  const trySendViaAPI = async (content) => {
    const endpoints = [
      `/chats/${chatId}/send`,
      `/chats/${chatId}/message`,
      `/chats/${chatId}/messages/send`,
      `/api/chats/${chatId}/send`,
      `/api/chats/${chatId}/message`
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`🔄 Пробую endpoint: ${endpoint}`);
        await api.post(endpoint, {
          content: content,
          chat_id: chatId,
          user_id: user.id
        });
        console.log(`✅ Успешно через ${endpoint}`);
        return;
      } catch (err) {
        console.log(`❌ ${endpoint} не сработал:`, err.message);
      }
    }
    
    throw new Error('Все endpoints не сработали');
  };

  // Автоскролл
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'nearest' 
        });
      }, 100);
    }
  }, [messages]);

  // Обработка Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Форматирование времени
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return '';
    }
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#0e0e10',
      color: '#fff'
    }}>
      {/* Заголовок */}
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
              animation: 'pulse 1s infinite'
            }} />
            <span style={{ 
              fontSize: '12px', 
              color: connected ? '#00ff7f' : '#ff6b6b',
              fontWeight: '500'
            }}>
              {connected ? 'WebSocket' : 'Polling (1s)'}
            </span>
            <span style={{ 
              fontSize: '12px', 
              color: '#adadb8'
            }}>
              {messages.filter(m => !m.is_temp && !m.is_system).length} сообщений
            </span>
          </div>
        </div>
        <span style={{ 
          fontSize: '11px', 
          color: '#666',
          fontStyle: 'italic'
        }}>
          Автообновление
        </span>
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
        {loading ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: '#666'
          }}>
            <div style={{
              width: '30px',
              height: '30px',
              border: '3px solid rgba(145, 71, 255, 0.3)',
              borderTopColor: '#9147ff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 15px'
            }} />
            <div>Загрузка чата...</div>
          </div>
        ) : messages.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: '#666'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>💬</div>
            <div>Чат пуст</div>
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
                      : msg.author?.id === user?.id
                        ? 'rgba(145, 71, 255, 0.15)'
                        : '#252525',
                border: `1px solid ${
                  msg.is_temp ? '#9147ff' 
                  : msg.is_system ? '#666' 
                  : msg.is_error ? '#ff6b6b' 
                  : msg.author?.id === user?.id ? '#9147ff'
                  : '#333'
                }`,
                borderRadius: '8px',
                padding: '12px',
                opacity: msg.is_temp ? 0.7 : 1,
                animation: msg.is_temp ? 'pulse 1s infinite' : 'none'
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
                  </strong>
                  {msg.author?.id === user?.id && !msg.is_temp && (
                    <span style={{
                      fontSize: '10px',
                      background: 'rgba(0, 255, 127, 0.1)',
                      color: '#00ff7f',
                      padding: '2px 6px',
                      borderRadius: '10px'
                    }}>
                      Вы
                    </span>
                  )}
                </div>
                <span style={{ 
                  color: '#666', 
                  fontSize: '11px'
                }}>
                  {formatMessageTime(msg.created_at)}
                </span>
              </div>
              <div style={{ 
                color: msg.is_error ? '#ff6b6b' : '#efeff1', 
                fontSize: '14px',
                lineHeight: '1.4'
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
            placeholder={user ? "Сообщение..." : "Войдите для чата..."}
            disabled={!user}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px'
            }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !user}
            style={{
              background: !newMessage.trim() || !user ? '#333' : '#9147ff',
              color: 'white',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '8px',
              cursor: !newMessage.trim() || !user ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              minWidth: '50px'
            }}
          >
            ➤
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
            {user ? `Вы: ${user.username}` : 'Не авторизован'}
          </span>
          <span>
            {newMessage.trim().length}/500
          </span>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
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