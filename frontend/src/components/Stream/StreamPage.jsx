import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { streamAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import StreamPlayer from './StreamPlayer'
import StreamChat from './StreamChat'
import api from '../../services/api'
import './StreamPage.css'

const StreamPage = () => {
  const { streamId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [stream, setStream] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [chatId, setChatId] = useState(null)
  const [streamerInfo, setStreamerInfo] = useState(null)
  const [streamerLoading, setStreamerLoading] = useState(false)
  const [themes, setThemes] = useState([])
  const [themesLoading, setThemesLoading] = useState(false)
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)
  const [streamerAvatarUrl, setStreamerAvatarUrl] = useState(null)
  const [streamStatus, setStreamStatus] = useState('loading')

  const getAvatarUrl = async (avatarUrl) => {
    if (!avatarUrl) return null;
    
    console.log('🔄 Получаю URL аватара:', avatarUrl);
    
    // Если это уже полный URL (http/https), возвращаем его
    if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
      console.log('✅ Уже полный URL, возвращаем как есть');
      return avatarUrl;
    }
    
    // Если это путь (/files/...), добавляем базовый URL
    if (avatarUrl.startsWith('/')) {
      const fullUrl = `http://91.186.197.80${avatarUrl}`;
      console.log('✅ Сформирован URL:', fullUrl);
      return fullUrl;
    }
    
    // Если это просто ключ файла (без пути)
    try {
      console.log('🔑 Получаю URL для ключа файла:', avatarUrl);
      
      // Используем API для получения URL
      const response = await api.post('/files/', null, {
        params: { file_key: avatarUrl }
      });
      
      let signedUrl = response.data;
      console.log('📥 Получен signed URL:', signedUrl);
      
      // Убедимся, что это полный URL
      if (signedUrl && !signedUrl.startsWith('http')) {
        signedUrl = `http://91.186.197.80${signedUrl.startsWith('/') ? '' : '/'}${signedUrl}`;
      }
      
      console.log('✅ Финальный URL аватара:', signedUrl);
      return signedUrl;
      
    } catch (error) {
      console.error('❌ Ошибка получения URL аватара:', error);
      
      // Пробуем создать URL самостоятельно
      const fallbackUrl = `http://91.186.197.80/api/files/preview/${avatarUrl}`;
      console.log('🔄 Пробую fallback URL:', fallbackUrl);
      return fallbackUrl;
    }
  }

  const extractFileKey = (avatarUrl) => {
    if (!avatarUrl) return null
    
    if (typeof avatarUrl === 'string' && 
        !avatarUrl.includes('://') && 
        !avatarUrl.startsWith('/')) {
      return avatarUrl
    }
    
    try {
      if (avatarUrl.startsWith('/')) {
        return avatarUrl.substring(1)
      }
      
      const url = new URL(avatarUrl)
      return url.pathname.substring(1)
    } catch (error) {
      return avatarUrl
    }
  }

  const fetchStream = async () => {
    try {
      const response = await streamAPI.getStream(streamId)
      const streamData = response.data
      setStream(streamData)
      
      if (streamData.chat && streamData.chat.id) {
        console.log(`✅ Chat ID найден: ${streamData.chat.id}`)
        setChatId(streamData.chat.id)
      } else {
        console.error('❌ Chat ID не найден в данных стрима:', streamData)
      }
      
      setStreamStatus(streamData.status || 'offline')
      
      if (streamData.author?.id) {
        fetchStreamerInfo(streamData.author.id)
      }
      
    } catch (err) {
      setError('Стрим не найден')
      console.error('Error fetching stream:', err)
      setLoading(false)
    }
  }

  const fetchStreamerInfo = async (userId) => {
    try {
      setStreamerLoading(true)
      const response = await streamAPI.getUserPublicInfo(userId)
      const streamerData = response.data
      
      console.log('📊 Данные стримера получены:', streamerData)
      
      setStreamerInfo(streamerData)
      
      // Получаем URL аватара
      if (streamerData.avatar_url) {
        console.log('🔄 Получен avatar_url:', streamerData.avatar_url)
        const avatarUrl = await getAvatarUrl(streamerData.avatar_url)
        console.log('✅ Преобразованный URL аватара:', avatarUrl)
        setStreamerAvatarUrl(avatarUrl)
      } else {
        console.log('ℹ️ У стримера нет аватара в данных')
        setStreamerAvatarUrl(null)
      }
      
    } catch (err) {
      console.error('❌ Ошибка получения информации о стримере:', err)
      setStreamerInfo({
        username: stream?.author?.username,
        id: userId
      })
    } finally {
      setStreamerLoading(false)
    }
  }

  const fetchThemes = async () => {
    try {
      setThemesLoading(true)
      const response = await streamAPI.getThemes()
      setThemes(response.data)
    } catch (err) {
      console.error('Error fetching themes:', err)
    } finally {
      setThemesLoading(false)
    }
  }

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await fetchStream()
        await fetchThemes()
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()

    const interval = setInterval(fetchStream, 10000)
    return () => clearInterval(interval)
  }, [streamId])

  useEffect(() => {
    try {
      const lastStreamData = localStorage.getItem('last_created_stream')
      if (lastStreamData) {
        const parsed = JSON.parse(lastStreamData)
        if (parsed.stream_id === streamId && parsed.chat_id) {
          console.log(`🔄 Chat ID из localStorage: ${parsed.chat_id}`)
          setChatId(parsed.chat_id)
          localStorage.removeItem('last_created_stream')
        }
      }
    } catch (e) {
      console.log('Ошибка чтения localStorage:', e)
    }
  }, [streamId])

  const handleImageError = (e) => {
    console.error('Ошибка загрузки аватара стримера')
    e.target.style.display = 'none'
  }

  const isStreamOwner = user && stream?.author?.id === user.id

  const handleDeleteStream = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить этот стрим? Это действие нельзя отменить.')) {
      return
    }

    try {
      await streamAPI.deleteStream(streamId)
      alert('✅ Стрим успешно удален!')
      navigate('/profile')
    } catch (err) {
      console.error('Error deleting stream:', err)
      alert('❌ Ошибка при удалении стрима')
    }
  }

  const getThemeDisplayName = (themeName) => {
    const themeNames = {
      'gaming': '🎮 Игры',
      'music': '🎵 Музыка', 
      'just_chatting': '💬 Общение',
      'art': '🎨 Искусство',
      'sports': '⚽ Спорт',
      'education': '📚 Образование',
      'technology': '💻 Технологии',
      'cooking': '🍳 Кулинария'
    }
    return themeNames[themeName] || themeName
  }

  const getThemeColor = (themeName) => {
    const themeColors = {
      'gaming': '#9147ff',
      'music': '#00ff7f',
      'just_chatting': '#00d2d3',
      'art': '#ff6b6b',
      'sports': '#ff9f43',
      'education': '#54a0ff',
      'technology': '#2e86de',
      'cooking': '#ff9ff3'
    }
    return themeColors[themeName] || '#9147ff'
  }

  const getStreamThemes = () => {
    if (!stream || !stream.themes || !Array.isArray(stream.themes)) return []
    
    if (stream.themes.length > 0 && typeof stream.themes[0] === 'object') {
      return stream.themes
    }
    
    return stream.themes.map(themeId => {
      return themes.find(theme => theme.id === themeId) || { id: themeId, name: 'unknown' }
    }).filter(theme => theme.name !== 'unknown')
  }

  const renderThemes = () => {
    const streamThemes = getStreamThemes()
    
    if (streamThemes.length === 0) {
      return (
        <div style={{ marginBottom: '15px' }}>
          <p style={{ color: 'rgba(173, 173, 184, 0.8)', fontSize: '14px' }}>
            🎯 Тематики не указаны
          </p>
        </div>
      )
    }

    return (
      <div className="stream-themes-container">
        {streamThemes.map((theme) => (
          <span
            key={theme.id}
            className="stream-theme-tag"
            style={{
              background: `${getThemeColor(theme.name)}20`,
              color: getThemeColor(theme.name),
              borderColor: getThemeColor(theme.name)
            }}
          >
            {getThemeDisplayName(theme.name)}
          </span>
        ))}
      </div>
    )
  }

  const renderStreamStatus = () => {
    const statusConfig = {
      'live': { icon: '🔴', color: '#ff5555', text: 'В ЭФИРЕ' },
      'offline': { icon: '⚫', color: '#adadb8', text: 'ОФФЛАЙН' },
      'starting': { icon: '🟡', color: '#ff9f43', text: 'ЗАПУСК' },
      'ended': { icon: '⚫', color: '#666', text: 'ЗАВЕРШЕН' },
      'loading': { icon: '⏳', color: '#9147ff', text: 'ЗАГРУЗКА' }
    }
    
    const config = statusConfig[streamStatus] || statusConfig.offline
    
    return (
      <div className={`stream-status-badge ${streamStatus}`}>
        <span>{config.icon}</span>
        <span>{config.text}</span>
      </div>
    )
  }

  if (loading) return (
    <div className="stream-loading-state">
      <div className="glass-spinner" />
      <div className="state-title">Загрузка стрима...</div>
      <div className="state-subtitle">Stream ID: {streamId}</div>
    </div>
  )
  
  if (error) return (
    <div className="stream-error-state">
      <div className="state-title">❌</div>
      <div className="state-title">{error}</div>
      <button
        className="glass-button"
        onClick={() => navigate('/')}
      >
        ← На главную
      </button>
    </div>
  )
  
  if (!stream) return (
    <div className="stream-notfound-state">
      <div className="state-title">🔍</div>
      <div className="state-title">Стрим не найден</div>
      <button
        className="glass-button"
        onClick={() => navigate('/')}
      >
        ← На главную
      </button>
    </div>
  )

  return (
    <div className="stream-page">
      <div className="stream-bg" />
      
      <div className="stream-container">
        {/* Левая часть - видео и информация */}
        <div className="stream-video-section">
          {/* Плеер */}
          <div className="stream-player-container stream-glass">
            <StreamPlayer stream={stream} />
          </div>
          
          {/* Информация о стриме */}
          <div className="stream-info-card stream-glass">
            {/* Кнопка настроек для владельца */}
            {isStreamOwner && (
              <div className="stream-settings-button">
                <button
                  className="glass-btn"
                  onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                >
                  ⚙️ Управление стримом
                </button>
                
                {showSettingsMenu && (
                  <div className="glass-menu">
                    <button
                      className="glass-menu-item"
                      onClick={() => {
                        setShowSettingsMenu(false)
                        navigate(`/stream/${streamId}/settings`)
                      }}
                    >
                      <span>📝</span>
                      <span>Настройки стрима</span>
                    </button>
                    
                    <button
                      className="glass-menu-item delete"
                      onClick={() => {
                        setShowSettingsMenu(false)
                        handleDeleteStream()
                      }}
                    >
                      <span>🗑️</span>
                      <span>Удалить стрим</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Статус стрима */}
            {renderStreamStatus()}

            {/* Заголовок и описание */}
            <h1 className="stream-title">
              {stream.title}
            </h1>
            
            {stream.description && (
              <p className="stream-description">
                {stream.description}
              </p>
            )}
            
            {/* Тематики */}
            {renderThemes()}
            
            {/* Статистика стрима */}
            <div className="stream-stats-grid">
              <div className="stream-stat-item">
                <div className="stream-stat-value" style={{ color: '#00ff7f' }}>
                  {stream.viewers_count || 0}
                </div>
                <div className="stream-stat-label">ЗРИТЕЛЕЙ</div>
              </div>
              
              <div className="stream-stat-item">
                <div className="stream-stat-value" style={{ color: '#9147ff' }}>
                  {stream.author?.username || 'Streamer'}
                </div>
                <div className="stream-stat-label">СТРИМЕР</div>
              </div>
              
              <div className="stream-stat-item">
                <div className="stream-stat-value" style={{ color: '#54a0ff' }}>
                  {new Date(stream.created_at).toLocaleDateString('ru-RU')}
                </div>
                <div className="stream-stat-label">ДАТА СОЗДАНИЯ</div>
              </div>
              
              {stream.started_at && (
                <div className="stream-stat-item">
                  <div className="stream-stat-value" style={{ color: '#ff9f43' }}>
                    {new Date(stream.started_at).toLocaleTimeString('ru-RU', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                  <div className="stream-stat-label">НАЧАЛО СТРИМА</div>
                </div>
              )}
            </div>

            {/* Карточка стримера */}
            {stream.author && (
              <div className="streamer-glass-card stream-glass">
                <div className="streamer-card-header">
                  <h3 className="streamer-card-title">🎮 О СТРИМЕРЕ</h3>
                  <Link 
                    to={`/user/${stream.author.id}`}
                    className="glass-link"
                  >
                    <span>📋</span>
                    <span>Профиль</span>
                  </Link>
                </div>

                {streamerLoading ? (
                  <div className="streamer-loading">
                    <div className="glass-spinner" style={{ width: '40px', height: '40px' }} />
                    <div>Загрузка информации о стримере...</div>
                  </div>
                ) : (
                  <div className="streamer-content">
                    <div className="glass-avatar">
                      {streamerAvatarUrl ? (
                        <img 
                          src={streamerAvatarUrl} 
                          alt="Avatar" 
                          className="avatar-img"
                          onError={handleImageError}
                        />
                      ) : (
                        <div className="avatar-fallback">
                          {(streamerInfo?.username || stream.author.username)?.charAt(0).toUpperCase() || 'S'}
                        </div>
                      )}
                    </div>

                    <div className="streamer-info">
                      <div className="streamer-name-row">
                        <h4 className="streamer-name">
                          {streamerInfo?.username || stream.author.username}
                        </h4>
                        {streamerInfo?.is_verified && (
                          <span className="verified-badge">
                            ✓
                          </span>
                        )}
                      </div>

                      {streamerInfo?.bio && (
                        <p className="streamer-bio">
                          "{streamerInfo.bio}"
                        </p>
                      )}

                      <div className="streamer-stats">
                        <div className="streamer-stat">
                          <div className="streamer-stat-value" style={{ color: '#9147ff' }}>
                            {streamerInfo?.total_streams || '?'}
                          </div>
                          <div className="streamer-stat-label">Всего стримов</div>
                        </div>
                        <div className="streamer-stat">
                          <div className="streamer-stat-value" style={{ color: '#00ff7f' }}>
                            {streamerInfo?.total_viewers || '?'}
                          </div>
                          <div className="streamer-stat-label">Всего просмотров</div>
                        </div>
                        <div className="streamer-stat">
                          <div className="streamer-stat-value" style={{ color: '#00d2d3' }}>
                            {streamerInfo?.followers_count || '?'}
                          </div>
                          <div className="streamer-stat-label">Подписчиков</div>
                        </div>
                      </div>

                      <div className="streamer-meta">
                        {streamerInfo?.country && (
                          <div className="meta-item">
                            <span className="meta-icon">🌍</span>
                            <span className="meta-text">{streamerInfo.country}</span>
                          </div>
                        )}
                        {streamerInfo?.city && (
                          <div className="meta-item">
                            <span className="meta-icon">🏙️</span>
                            <span className="meta-text">{streamerInfo.city}</span>
                          </div>
                        )}
                        {streamerInfo?.created_at && (
                          <div className="meta-item">
                            <span className="meta-icon">📅</span>
                            <span className="meta-text">Участник с {new Date(streamerInfo.created_at).toLocaleDateString('ru-RU')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Правая часть - чат */}
        <div className="stream-chat-container">
          <StreamChat 
            streamId={streamId} 
            chatId={chatId}
            stream={stream} 
          />
        </div>
      </div>
    </div>
  )
}

export default StreamPage