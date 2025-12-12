import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authAPI, api, chatAPI } from '../../services/api';
import './StreamChat.css';

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

  useEffect(() => {
    if (propChatId) {
      console.log(`✅ Chat ID получен как пропс: ${propChatId}`);
      setChatId(propChatId);
    } else {
      console.log('⚠️ Chat ID не передан как пропс');
    }
  }, [propChatId]);

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

  useEffect(() => {
    if (!chatId || !user) return;

    console.log('🚀 Запускаю автообновление чата');
    
    loadMessageHistory();
    
    pollingIntervalRef.current = setInterval(() => {
      console.log('🔄 Автообновление чата...');
      loadMessageHistory();
    }, 1000);
    
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
        setTimeout(() => loadMessageHistory(), 100);
      };
      
      socket.onclose = () => {
        console.log('🔴 WebSocket отключен');
        setConnected(false);
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

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !chatId) return;
    
    const messageContent = newMessage.trim();
    
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
      if (connected && chatSocket && chatSocket.readyState === WebSocket.OPEN) {
        chatSocket.send(messageContent);
        console.log('✅ Отправлено через WebSocket');
      } else {
        console.log('⚠️ WebSocket недоступен, отправляю через API');
        await trySendViaAPI(messageContent);
      }
      
      setTimeout(() => loadMessageHistory(), 500);
      
    } catch (error) {
      console.error('❌ Ошибка отправки:', error);
      
      setMessages(prev => prev.map(msg => 
        msg.id === tempMsg.id 
          ? { ...msg, content: `❌ Ошибка: ${messageContent}`, is_error: true }
          : msg
      ));
      
      setTimeout(() => {
        setMessages(prev => prev.filter(msg => msg.id !== tempMsg.id));
        loadMessageHistory();
      }, 3000);
    }
    
    setNewMessage('');
  };

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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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

  const getMessageClass = (msg) => {
    if (msg.is_temp) return 'chat-message message-temp';
    if (msg.is_system) return 'chat-message message-system';
    if (msg.is_error) return 'chat-message message-error';
    if (msg.author?.id === user?.id) return 'chat-message message-own';
    return 'chat-message message-other';
  };

  return (
    <div className="stream-chat">
      {/* Заголовок */}
      <div className="chat-header">
        <div className="chat-title-section">
          <h3 className="chat-title">💬 Чат стрима</h3>
          <div className="chat-status-bar">
            <div className="status-indicator">
              <div className={`status-dot ${connected ? 'connected' : 'disconnected'}`} />
              <span className={`status-text ${connected ? 'connected' : 'disconnected'}`}>
                {connected ? 'WebSocket' : 'Polling (1s)'}
              </span>
            </div>
            <span className="message-count-badge">
              {messages.filter(m => !m.is_temp && !m.is_system).length} сообщений
            </span>
          </div>
        </div>
        <span className="auto-update-label">
          Автообновление
        </span>
      </div>

      {/* Сообщения */}
      <div className="chat-messages">
        {loading ? (
          <div className="chat-loading">
            <div className="chat-loading-spinner" />
            <div>Загрузка чата...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="chat-empty">
            <div className="empty-icon">💬</div>
            <div className="empty-text">Чат пуст</div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={getMessageClass(msg)}
            >
              <div className="message-header">
                <div className="message-author">
                  <strong className="author-name">
                    {msg.author?.username || 'Аноним'}
                    {msg.is_temp && ' (отправка...)'}
                  </strong>
                  {msg.author?.id === user?.id && !msg.is_temp && (
                    <span className="author-badge">
                      Вы
                    </span>
                  )}
                </div>
                <span className="message-time">
                  {formatMessageTime(msg.created_at)}
                </span>
              </div>
              <div className="message-content">
                {msg.content}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Форма отправки */}
      <div className="chat-form">
        <div className="form-controls">
          <input
            type="text"
            className="glass-input"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={user ? "Сообщение..." : "Войдите для чата..."}
            disabled={!user}
          />
          <button
            className="send-button"
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !user}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
};

export default StreamChat;