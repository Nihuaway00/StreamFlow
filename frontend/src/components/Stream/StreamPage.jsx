import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { streamAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import StreamPlayer from './StreamPlayer'
import StreamChat from './StreamChat'
import api from '../../services/api' // Добавьте этот импорт!

const StreamPage = () => {
  const { streamId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [stream, setStream] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [streamerInfo, setStreamerInfo] = useState(null)
  const [streamerLoading, setStreamerLoading] = useState(false)
  const [themes, setThemes] = useState([])
  const [themesLoading, setThemesLoading] = useState(false)
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)
  const [streamerAvatarUrl, setStreamerAvatarUrl] = useState(null) // Новое состояние для аватара стримера

  // Функция для получения URL аватара
  const getAvatarUrl = async (fileKey) => {
    if (!fileKey) return null
    
    try {
      // POST запрос, а не GET!
      const response = await api.post('/files/', null, {
        params: { file_key: fileKey }
      })
      
      let signedUrl = response.data
      
      if (typeof signedUrl === 'string') {
        // Заменяем storage:9000 на localhost:9000
        if (signedUrl.includes('storage:9000')) {
          signedUrl = signedUrl.replace('storage:9000', 'localhost:9000')
        }
        
        // Проверяем что URL валидный
        try {
          new URL(signedUrl)
          return signedUrl
        } catch {
          return null
        }
      }
      return null
      
    } catch (error) {
      console.error('Ошибка получения URL аватара:', error)
      return null
    }
  }

  // Функция для извлечения file_key из avatar_url
  const extractFileKey = (avatarUrl) => {
    if (!avatarUrl) return null
    
    // Если это уже file_key (простая строка без слэшей и точек)
    if (typeof avatarUrl === 'string' && 
        !avatarUrl.includes('://') && 
        !avatarUrl.startsWith('/')) {
      return avatarUrl
    }
    
    // Если это URL, извлекаем путь
    try {
      // Иногда сервер возвращает относительный путь
      if (avatarUrl.startsWith('/')) {
        return avatarUrl.substring(1)
      }
      
      // Если это полный URL
      const url = new URL(avatarUrl)
      return url.pathname.substring(1)
    } catch (error) {
      // Если не URL, возвращаем как есть
      return avatarUrl
    }
  }

  useEffect(() => {
    const fetchStream = async () => {
      try {
        const response = await streamAPI.getStream(streamId)
        setStream(response.data)
        
        // Если есть автор стрима, загружаем его публичные данные
        if (response.data.author?.id) {
          fetchStreamerInfo(response.data.author.id)
        }
      } catch (err) {
        setError('Стрим не найден')
        console.error('Error fetching stream:', err)
      } finally {
        setLoading(false)
      }
    }

    const fetchStreamerInfo = async (userId) => {
      try {
        setStreamerLoading(true)
        const response = await streamAPI.getUserPublicInfo(userId)
        const streamerData = response.data
        
        setStreamerInfo(streamerData)
        
        // Загружаем аватар стримера если есть
        if (streamerData.avatar_url) {
          const fileKey = extractFileKey(streamerData.avatar_url)
          if (fileKey) {
            const avatarUrl = await getAvatarUrl(fileKey)
            setStreamerAvatarUrl(avatarUrl)
          }
        }
        
      } catch (err) {
        console.error('Error fetching streamer info:', err)
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

    fetchStream()
    fetchThemes()

    const interval = setInterval(fetchStream, 10000)
    return () => clearInterval(interval)
  }, [streamId])

  // Обработчик ошибок загрузки изображения
  const handleImageError = (e) => {
    console.error('Ошибка загрузки аватара стримера')
    e.target.style.display = 'none'
  }

  // Проверяем, является ли пользователь автором стрима
  const isStreamOwner = user && stream?.author?.id === user.id

  // Функция для удаления стрима
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

  // Функция для получения русского названия тематики
  const getThemeDisplayName = (themeName) => {
    const themeNames = {
      'gaming': '🎮 Игры',
      'music': '🎵 Музыка', 
      'just_chatting': '💬 Общение'
    }
    return themeNames[themeName] || themeName
  }

  // Функция для получения цвета тематики
  const getThemeColor = (themeName) => {
    const themeColors = {
      'gaming': '#9147ff',
      'music': '#00ff7f',
      'just_chatting': '#00d2d3'
    }
    return themeColors[themeName] || '#9147ff'
  }

  // Функция для получения тематик стрима
  const getStreamThemes = () => {
    if (!stream.themes || !Array.isArray(stream.themes)) return []
    
    if (stream.themes.length > 0 && typeof stream.themes[0] === 'object') {
      return stream.themes
    }
    
    return stream.themes.map(themeId => {
      return themes.find(theme => theme.id === themeId) || { id: themeId, name: 'unknown' }
    }).filter(theme => theme.name !== 'unknown')
  }

  // Функция для отображения тематик
  const renderThemes = () => {
    const streamThemes = getStreamThemes()
    
    if (streamThemes.length === 0) {
      return (
        <div style={{ marginBottom: '15px' }}>
          <p style={{ color: '#adadb8', fontSize: '14px' }}>
            🎯 Тематики не указаны
          </p>
        </div>
      )
    }

    return (
      <div style={{ marginBottom: '15px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {streamThemes.map((theme) => (
            <span
              key={theme.id}
              style={{
                background: `${getThemeColor(theme.name)}20`,
                color: getThemeColor(theme.name),
                border: `1px solid ${getThemeColor(theme.name)}`,
                padding: '6px 12px',
                borderRadius: '16px',
                fontSize: '13px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {getThemeDisplayName(theme.name)}
            </span>
          ))}
        </div>
      </div>
    )
  }

  if (loading) return (
    <div style={{ padding: '50px', textAlign: 'center', color: 'white' }}>
      <div style={{ fontSize: '32px', marginBottom: '10px' }}>⏳</div>
      Загрузка стрима...
    </div>
  )
  
  if (error) return (
    <div style={{ padding: '50px', textAlign: 'center', color: 'white' }}>
      <div style={{ fontSize: '32px', marginBottom: '10px' }}>❌</div>
      {error}
    </div>
  )
  
  if (!stream) return (
    <div style={{ padding: '50px', textAlign: 'center', color: 'white' }}>
      <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔍</div>
      Стрим не найден
    </div>
  )

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: '1fr 400px', 
      height: 'calc(100vh - 50px)',
      background: '#0e0e10'
    }}>
      
      {/* ЛЕВАЯ ЧАСТЬ - ВИДЕОПЛЕЕР И ИНФО */}
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        
        {/* ВИДЕОПЛЕЕР */}
        <StreamPlayer stream={stream} />
        
        {/* ИНФОРМАЦИЯ О СТРИМЕ */}
        <div style={{ padding: '20px', color: 'white', position: 'relative' }}>
          
          {/* КНОПКА НАСТРОЕК ДЛЯ ВЛАДЕЛЬЦА СТРИМА */}
          {isStreamOwner && (
            <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
              <button
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                style={{
                  background: '#333',
                  color: 'white',
                  border: '1px solid #444',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                ⚙️ Управление
              </button>
              
              {/* ВЫПАДАЮЩЕЕ МЕНЮ НАСТРОЕК */}
              {showSettingsMenu && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  background: '#18181b',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  padding: '8px 0',
                  minWidth: '180px',
                  zIndex: 1000,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
                }}>
                  <button
                    onClick={() => {
                      setShowSettingsMenu(false)
                      navigate(`/stream/${streamId}/settings`)
                    }}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      color: 'white',
                      border: 'none',
                      padding: '10px 16px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#252525'}
                    onMouseLeave={(e) => e.target.style.background = 'transparent'}
                  >
                    📝 Настройки стрима
                  </button>
                  
                  <div style={{
                    height: '1px',
                    background: '#333',
                    margin: '4px 0'
                  }} />
                  
                  <button
                    onClick={() => {
                      setShowSettingsMenu(false)
                      handleDeleteStream()
                    }}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      color: '#ff4757',
                      border: 'none',
                      padding: '10px 16px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#2a1a1a'}
                    onMouseLeave={(e) => e.target.style.background = 'transparent'}
                  >
                    🗑️ Удалить стрим
                  </button>
                </div>
              )}
            </div>
          )}

          <h1 style={{ margin: '0 0 10px 0', fontSize: '24px', paddingRight: isStreamOwner ? '120px' : '0' }}>
            {stream.title}
          </h1>
          <p style={{ color: '#adadb8', marginBottom: '15px' }}>
            {stream.description || 'Описание отсутствует'}
          </p>
          
          {/* ТЕМАТИКИ */}
          {renderThemes()}
          
          <div style={{ display: 'flex', gap: '20px', color: '#adadb8', flexWrap: 'wrap' }}>
            <span>👁️ {stream.viewers_count || 0} зрителей</span>
            <span>👤 {stream.author?.username || 'Streamer'}</span>
            <span>📅 {new Date(stream.created_at).toLocaleDateString('ru-RU')}</span>
            {stream.started_at && (
              <span>⏱️ {new Date(stream.started_at).toLocaleTimeString('ru-RU')}</span>
            )}
          </div>
        </div>

        {/* БЛОК СТРИМЕРА */}
        {stream.author && (
          <div style={{
            background: '#18181b',
            margin: '0 20px 20px 20px',
            borderRadius: '8px',
            padding: '20px',
            border: '1px solid #333'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '15px'
            }}>
              <h3 style={{ color: 'white', margin: 0 }}>🎮 О стримере</h3>
              <Link 
                to={`/user/${stream.author.id}`} // Исправлено на /user/
                style={{
                  background: '#9147ff',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#772ce8'}
                onMouseLeave={(e) => e.target.style.background = '#9147ff'}
              >
                📋 Перейти в профиль
              </Link>
            </div>

            {streamerLoading ? (
              <div style={{ 
                padding: '20px', 
                textAlign: 'center', 
                color: '#adadb8',
                background: '#0e0e10',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}>
                <div className="spinner" style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTopColor: 'white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Загрузка информации о стримере...
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                {/* АВАТАР СТРИМЕРА */}
                <div style={{
                  width: '60px',
                  height: '60px',
                  background: streamerAvatarUrl ? 'transparent' : 'linear-gradient(45deg, #9147ff, #772ce8)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: 'white',
                  overflow: 'hidden',
                  flexShrink: 0,
                  border: '2px solid #fff'
                }}>
                  {streamerAvatarUrl ? (
                    <img 
                      src={streamerAvatarUrl} 
                      alt="Avatar" 
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={handleImageError}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'linear-gradient(45deg, #9147ff, #772ce8)',
                      color: 'white',
                      fontSize: '20px',
                      fontWeight: 'bold'
                    }}>
                      {(streamerInfo?.username || stream.author.username)?.charAt(0).toUpperCase() || 'S'}
                    </div>
                  )}
                </div>

                {/* ИНФОРМАЦИЯ О СТРИМЕРЕ */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <h4 style={{ 
                      margin: 0, 
                      color: 'white',
                      fontSize: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {streamerInfo?.username || stream.author.username}
                      {streamerInfo?.is_verified && (
                        <span style={{
                          color: '#00ff7f',
                          fontSize: '14px'
                        }}>
                          ✓
                        </span>
                      )}
                    </h4>
                  </div>

                  {streamerInfo?.bio && (
                    <p style={{ 
                      color: '#adadb8', 
                      margin: '0 0 10px 0',
                      fontSize: '14px',
                      lineHeight: '1.4',
                      fontStyle: 'italic'
                    }}>
                      "{streamerInfo.bio}"
                    </p>
                  )}

                  {/* СТАТИСТИКА СТРИМЕРА */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: '10px',
                    background: '#0e0e10',
                    padding: '12px',
                    borderRadius: '6px',
                    marginBottom: '10px'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: '#9147ff', fontSize: '16px', fontWeight: 'bold' }}>
                        {streamerInfo?.total_streams || '?'}
                      </div>
                      <div style={{ color: '#adadb8', fontSize: '12px' }}>Стримов</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: '#00ff7f', fontSize: '16px', fontWeight: 'bold' }}>
                        {streamerInfo?.total_viewers || '?'}
                      </div>
                      <div style={{ color: '#adadb8', fontSize: '12px' }}>Просмотров</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: '#00d2d3', fontSize: '16px', fontWeight: 'bold' }}>
                        {streamerInfo?.followers_count || '?'}
                      </div>
                      <div style={{ color: '#adadb8', fontSize: '12px' }}>Подписчиков</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ 
                        color: stream.status === 'live' ? '#00ff7f' : '#adadb8', 
                        fontSize: '16px', 
                        fontWeight: 'bold' 
                      }}>
                        {stream.status === 'live' ? '🟢 В эфире' : '🔴 Офлайн'}
                      </div>
                      <div style={{ color: '#adadb8', fontSize: '12px' }}>Статус</div>
                    </div>
                  </div>

                  {/* ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ */}
                  <div style={{ 
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '15px',
                    fontSize: '12px',
                    color: '#adadb8'
                  }}>
                    {streamerInfo?.country && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span>🌍</span>
                        <span>{streamerInfo.country}</span>
                      </div>
                    )}
                    {streamerInfo?.city && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span>🏙️</span>
                        <span>{streamerInfo.city}</span>
                      </div>
                    )}
                    {streamerInfo?.created_at && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span>📅</span>
                        <span>Участник с {new Date(streamerInfo.created_at).toLocaleDateString('ru-RU')}</span>
                      </div>
                    )}
                    {streamerInfo?.last_login && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span>🕐</span>
                        <span>Был онлайн {new Date(streamerInfo.last_login).toLocaleDateString('ru-RU')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ПРАВАЯ ЧАСТЬ - ЧАТ */}
      <div style={{
        background: '#18181b',
        borderLeft: '1px solid #333',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <StreamChat streamId={streamId} stream={stream} />
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default StreamPage