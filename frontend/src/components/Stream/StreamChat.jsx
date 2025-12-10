import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api'; // добавим импорт

const StreamChat = ({ streamId }) => {
  const { user: contextUser } = useAuth();
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [chatSocket, setChatSocket] = useState(null);
  const messagesEndRef = useRef(null);

  // Функция для получения актуального пользователя
  const getCurrentUser = () => {
    // 1. Пробуем из контекста
    if (contextUser) return contextUser;
    
    // 2. Пробуем из localStorage
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        return JSON.parse(savedUser);
      }
    } catch (e) {
      console.error('Ошибка парсинга пользователя:', e);
    }
    
    return null;
  };

  // Загружаем пользователя при монтировании
  useEffect(() => {
    const loadUser = async () => {
      const currentUser = getCurrentUser();
      
      if (currentUser) {
        console.log('✅ Пользователь найден:', currentUser.username);
        setUser(currentUser);
      } else {
        console.log('🔄 Пользователь не найден, пробую загрузить с сервера...');
        
        // Проверяем есть ли токен
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
      }
    };

    loadUser();
  }, [contextUser]);

  // Глобальный объект для отладки
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.debugChat = {
        getToken: () => localStorage.getItem('access_token'),
        getUser: () => user || JSON.parse(localStorage.getItem('user') || 'null'),
        getMessages: () => messages,
        getConnection: () => connected,
        getSocket: () => chatSocket,
        getSocketState: () => chatSocket ? chatSocket.readyState : 'NO_SOCKET',
        forceSend: (text) => {
          const currentUser = user || JSON.parse(localStorage.getItem('user') || 'null');
          const socket = chatSocket;
          
          console.log('ForceSend debug:', {
            user: currentUser,
            socketExists: !!socket,
            socketState: socket ? socket.readyState : 'none',
            text
          });
          
          if (currentUser && socket && socket.readyState === WebSocket.OPEN) {
            const messageData = {
              user_id: currentUser.id,
              content: text
            };
            socket.send(JSON.stringify(messageData));
            console.log('✅ Сообщение отправлено:', messageData);
            return 'Отправлено';
          } else {
            console.error('❌ Не могу отправить:', {
              hasUser: !!currentUser,
              hasSocket: !!socket,
              socketState: socket ? socket.readyState : 'none'
            });
            return 'Ошибка: нет соединения';
          }
        },
        reloadUser: async () => {
          try {
            const response = await authAPI.getCurrentUser();
            const userData = response.data;
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
            console.log('✅ Пользователь перезагружен:', userData);
            return userData;
          } catch (error) {
            console.error('❌ Ошибка перезагрузки пользователя:', error);
            return null;
          }
        }
      };
    }
  }, [chatSocket, connected, messages, user]);

  // Получаем токен из localStorage
  const getToken = () => {
    return localStorage.getItem('access_token');
  };

  // Загрузка истории сообщений (если есть REST endpoint)
  const loadMessageHistory = async () => {
    try {
      // Временно: начальное сообщение
      if (messages.length === 0) {
        setMessages([
          {
            id: 'welcome',
            content: "Добро пожаловать в чат стрима!",
            author: { 
              id: 'system',
              username: "Система",
              avatar_url: null 
            },
            chat: { id: streamId },
            created_at: new Date().toISOString()
          }
        ]);
      }
    } catch (error) {
      console.error('Ошибка загрузки истории:', error);
    }
  };

  // Инициализация WebSocket
  useEffect(() => {
    const token = getToken();
    const currentUser = user || JSON.parse(localStorage.getItem('user') || 'null');
    
    console.log('WebSocket init:', {
      token: token ? 'Есть' : 'Нет',
      user: currentUser ? `Есть (${currentUser.username})` : 'Нет',
      streamId
    });

    if (!token || !currentUser) {
      console.error('❌ Нет токена или пользователя для WebSocket:', { 
        token: !!token, 
        user: !!currentUser,
        userId: currentUser?.id 
      });
      setLoading(false);
      return;
    }

    // Формируем URL для WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host; // localhost:5173
    const wsUrl = `${protocol}//${host}/api/chats/${streamId}?token=${token}`;
    
    console.log('🔌 Подключаюсь к WebSocket:', wsUrl);

    // Создаем WebSocket соединение
    const socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      console.log('✅ WebSocket чата подключен');
      setConnected(true);
      setLoading(false);
      loadMessageHistory();
    };

    socket.onmessage = (event) => {
      console.log('📩 Получено сообщение от сервера:', event.data);
      
      try {
        const message = JSON.parse(event.data);
        console.log('📦 Parsed message:', message);
        
        // Проверяем структуру сообщения
        if (!message.id || !message.author || !message.content) {
          console.warn('⚠️ Неполное сообщение от сервера:', message);
          return;
        }
        
        // Убираем временное сообщение с таким же content
        setMessages(prev => {
          const filtered = prev.filter(m => 
            !m.is_temp || 
            (m.is_temp && m.content !== message.content)
          );
          
          // Проверяем дубликаты
          const isDuplicate = filtered.some(m => m.id === message.id);
          if (isDuplicate) {
            console.log('⚠️ Дубликат сообщения, пропускаем:', message.id);
            return filtered;
          }
          
          return [...filtered, message];
        });
      } catch (error) {
        console.error('❌ Ошибка парсинга сообщения:', error, 'Data:', event.data);
      }
    };

    socket.onclose = (event) => {
      console.log('🔴 WebSocket чата отключен. Code:', event.code, 'Reason:', event.reason);
      setConnected(false);
      
      // Пытаемся переподключиться через 5 секунд
      setTimeout(() => {
        console.log('🔄 Пытаюсь переподключиться...');
      }, 5000);
    };

    socket.onerror = (error) => {
      console.error('❌ WebSocket ошибка:', error);
      setConnected(false);
    };

    // Сохраняем глобально для отладки
    if (typeof window !== 'undefined') {
      window.currentChatSocket = socket;
    }
    
    setChatSocket(socket);

    // Очистка при размонтировании
    return () => {
      console.log('🧹 Очистка WebSocket соединения');
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close(1000, 'Компонент размонтирован');
      }
    };
  }, [streamId, user]); // Добавили user в зависимости

  // Отправка сообщения через WebSocket
  const handleSendMessage = () => {
    const currentUser = user || JSON.parse(localStorage.getItem('user') || 'null');
    
    if (!newMessage.trim() || !currentUser || !connected || !chatSocket) {
      console.log('❌ Не могу отправить:', { 
        hasMessage: !!newMessage.trim(),
        hasUser: !!currentUser,
        user: currentUser,
        connected,
        hasSocket: !!chatSocket 
      });
      return;
    }

    if (chatSocket.readyState !== WebSocket.OPEN) {
      console.error('❌ WebSocket не подключен. State:', chatSocket.readyState);
      alert('Соединение с чатом потеряно. Переподключаюсь...');
      return;
    }

    // Временное сообщение для мгновенного отображения
    const tempMsg = {
      id: `temp_${Date.now()}`,
      content: newMessage.trim(),
      author: {
        id: currentUser.id,
        username: currentUser.username,
        avatar_url: null
      },
      chat: { id: streamId },
      created_at: new Date().toISOString(),
      is_temp: true
    };
    
    console.log('📝 Добавляю временное сообщение:', tempMsg);
    setMessages(prev => [...prev, tempMsg]);

    try {
      // ОТПРАВЛЯЕМ ПО СТРУКТУРЕ КАК СКАЗАЛ ТОВАРИЩ
      const messageData = {
        user_id: currentUser.id,
        content: newMessage.trim()
      };
      
      console.log('📤 Отправляю сообщение на сервер:', messageData);
      chatSocket.send(JSON.stringify(messageData));
      
      // Очищаем поле ввода
      setNewMessage('');
      
    } catch (error) {
      console.error('❌ Ошибка отправки:', error);
      alert('Не удалось отправить сообщение');
      
      // Убираем временное сообщение при ошибке
      setTimeout(() => {
        setMessages(prev => prev.filter(m => !m.is_temp || m.id !== tempMsg.id));
      }, 3000);
    }
  };

  // Автоскролл
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Enter для отправки
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Форматирование времени
  const formatTime = (dateString) => {
    try {
      return new Date(dateString).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return '--:--';
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#adadb8' }}>
        <div style={{ marginBottom: '10px' }}>🌀 Подключение к чату...</div>
        <div style={{ fontSize: '12px', color: '#666' }}>
          ID стрима: {streamId}
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px' 
      }}>
        <h3 style={{ color: 'white', margin: 0 }}>
          💬 Чат стрима
        </h3>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px',
          fontSize: '14px'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '5px' 
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: connected ? '#00ff7f' : '#ff6b6b',
              animation: connected ? 'pulse 2s infinite' : 'none'
            }} />
            <span style={{ color: connected ? '#00ff7f' : '#ff6b6b' }}>
              {connected ? 'подключен' : 'отключен'}
            </span>
          </div>
          <span style={{ color: '#666' }}>
            ({messages.filter(m => !m.is_temp).length})
          </span>
        </div>
      </div>

      {/* Статус подключения */}
      {!connected && (
        <div style={{
          background: '#ff6b6b20',
          border: '1px solid #ff6b6b',
          borderRadius: '8px',
          padding: '10px',
          marginBottom: '15px',
          color: '#ff6b6b',
          textAlign: 'center',
          fontSize: '14px'
        }}>
          ⚠️ Нет подключения к чату. Сообщения могут не отправляться.
        </div>
      )}

      {/* Кнопка загрузки пользователя если его нет */}
      {!user && (
        <div style={{
          background: '#9147ff20',
          border: '1px solid #9147ff',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '15px',
          textAlign: 'center'
        }}>
          <p style={{ color: '#efeff1', margin: '0 0 10px 0' }}>
            Пользователь не загружен. Нужно загрузить данные для отправки сообщений.
          </p>
          <button
            onClick={async () => {
              try {
                const response = await authAPI.getCurrentUser();
                const userData = response.data;
                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));
                console.log('✅ Пользователь загружен:', userData);
                alert(`Добро пожаловать, ${userData.username}!`);
              } catch (error) {
                console.error('❌ Не удалось загрузить пользователя:', error);
                alert('Ошибка загрузки пользователя. Попробуйте перезагрузить страницу.');
              }
            }}
            style={{
              background: '#9147ff',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🔄 Загрузить данные пользователя
          </button>
        </div>
      )}

      {/* Сообщения */}
      <div style={{
        flex: 1,
        background: '#0e0e10',
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '15px',
        overflowY: 'auto',
        minHeight: '300px',
        maxHeight: '400px'
      }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
            {connected ? 'Пока нет сообщений. Будьте первым!' : 'Ожидание подключения...'}
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                background: msg.is_temp ? '#9147ff20' : '#252525',
                border: `1px solid ${msg.is_temp ? '#9147ff' : '#333'}`,
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '10px',
                opacity: msg.is_temp ? 0.8 : 1,
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {msg.author?.avatar_url ? (
                    <img 
                      src={msg.author.avatar_url} 
                      alt={msg.author.username}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: '#9147ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      color: 'white'
                    }}>
                      {msg.author?.username?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  <strong style={{ 
                    color: msg.author?.id === user?.id ? '#00ff7f' : '#9147ff',
                    fontSize: '14px'
                  }}>
                    {msg.author?.username || 'Аноним'}
                    {msg.is_temp && ' (отправка...)'}
                    {msg.author?.id === 'system' && ' 🤖'}
                  </strong>
                </div>
                <span style={{ color: '#666', fontSize: '11px' }}>
                  {formatTime(msg.created_at)}
                </span>
              </div>
              <div style={{ 
                color: '#efeff1', 
                marginTop: '8px', 
                marginLeft: '32px',
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
      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={!user ? "Загрузите данные пользователя" : (!connected ? "Подключение к чату..." : "Напишите сообщение...")}
          disabled={!user || !connected}
          style={{
            flex: 1,
            padding: '12px',
            background: '#1a1a1a',
            border: `1px solid ${connected ? (user ? '#9147ff' : '#333') : '#ff6b6b'}`,
            borderRadius: '4px',
            color: user ? 'white' : '#666',
            fontSize: '14px'
          }}
        />
        <button
          onClick={handleSendMessage}
          disabled={!user || !newMessage.trim() || !connected}
          style={{
            background: !user || !newMessage.trim() || !connected ? '#333' : '#9147ff',
            color: !user || !newMessage.trim() || !connected ? '#666' : 'white',
            border: 'none',
            padding: '0 20px',
            borderRadius: '4px',
            cursor: !user || !newMessage.trim() || !connected ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '50px'
          }}
          title={!user ? "Загрузите данные пользователя" : (!connected ? "Нет подключения" : "Отправить")}
        >
          {!connected ? '🔴' : '➤'}
        </button>
      </div>

      {/* Отладочная информация */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          marginTop: '10px',
          padding: '10px',
          background: '#1a1a1a',
          borderRadius: '4px',
          fontSize: '11px',
          color: '#666',
          border: '1px solid #333',
          display: 'flex',
          flexDirection: 'column',
          gap: '5px'
        }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div>Stream: {streamId}</div>
            <div>User: {user?.username || 'не загружен'}</div>
            <div>WS: {connected ? '🟢' : '🔴'}</div>
            <div>Сообщений: {messages.length}</div>
          </div>
          
          <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
            <button 
              onClick={() => {
                console.log('=== CHAT DEBUG ===');
                console.log('User:', user);
                console.log('Messages:', messages);
                console.log('Socket:', chatSocket ? {
                  readyState: chatSocket.readyState,
                  url: chatSocket.url
                } : null);
                console.log('LocalStorage user:', JSON.parse(localStorage.getItem('user') || 'null'));
              }}
              style={{
                background: '#9147ff',
                color: 'white',
                border: 'none',
                padding: '2px 8px',
                borderRadius: '3px',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              Debug Log
            </button>
            
            <button 
              onClick={() => {
                const currentUser = user || JSON.parse(localStorage.getItem('user') || 'null');
                if (currentUser && chatSocket?.readyState === WebSocket.OPEN) {
                  const testMsg = { 
                    user_id: currentUser.id, 
                    content: 'Тест ' + Date.now() 
                  };
                  chatSocket.send(JSON.stringify(testMsg));
                  console.log('Тест отправлен:', testMsg);
                } else {
                  console.log('Не могу отправить тест:', {
                    user: !!currentUser,
                    socket: chatSocket?.readyState
                  });
                }
              }}
              style={{
                background: '#00ff7f',
                color: '#000',
                border: 'none',
                padding: '2px 8px',
                borderRadius: '3px',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              Тест отправки
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        div[style*="background: #9147ff20"] {
          animation: fadeIn 0.3s ease;
        }
      `}</style>
    </>
  );
};

export default StreamChat;