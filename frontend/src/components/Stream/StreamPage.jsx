import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { streamAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import StreamPlayer from './StreamPlayer'
import StreamChat from './StreamChat'
import api from '../../services/api'

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

  // Функция для получения URL аватара
  const getAvatarUrl = async (fileKey) => {
    if (!fileKey) return null
    
    try {
      const response = await api.post('/files/', null, {
        params: { file_key: fileKey }
      })
      
      let signedUrl = response.data
      
      if (typeof signedUrl === 'string') {
        if (signedUrl.includes('storage:9000')) {
          signedUrl = signedUrl.replace('storage:9000', 'localhost:9000')
        }
        
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

  // Загрузка данных стрима
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

  // Загрузка информации о стримере
  const fetchStreamerInfo = async (userId) => {
    try {
      setStreamerLoading(true)
      const response = await streamAPI.getUserPublicInfo(userId)
      const streamerData = response.data
      
      setStreamerInfo(streamerData)
      
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

  // Загрузка тематик
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

  // Эффект для первоначальной загрузки
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

  // Эффект для проверки если чат только что создан
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
      'just_chatting': '💬 Общение',
      'art': '🎨 Искусство',
      'sports': '⚽ Спорт',
      'education': '📚 Образование',
      'technology': '💻 Технологии',
      'cooking': '🍳 Кулинария'
    }
    return themeNames[themeName] || themeName
  }

  // Функция для получения цвета тематики
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

  // Функция для получения тематик стрима
  const getStreamThemes = () => {
    if (!stream || !stream.themes || !Array.isArray(stream.themes)) return []
    
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

  // Статус стрима с иконкой
  const renderStreamStatus = () => {
    const statusConfig = {
      'live': { icon: '🔴', color: '#00ff7f', text: 'В ЭФИРЕ' },
      'offline': { icon: '⚫', color: '#adadb8', text: 'ОФФЛАЙН' },
      'starting': { icon: '🟡', color: '#ff9f43', text: 'ЗАПУСК' },
      'ended': { icon: '⚫', color: '#666', text: 'ЗАВЕРШЕН' },
      'loading': { icon: '⏳', color: '#9147ff', text: 'ЗАГРУЗКА' }
    }
    
    const config = statusConfig[streamStatus] || statusConfig.offline
    
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        background: `${config.color}20`,
        border: `1px solid ${config.color}`,
        padding: '6px 12px',
        borderRadius: '20px',
        marginBottom: '15px'
      }}>
        <span style={{ fontSize: '12px' }}>{config.icon}</span>
        <span style={{ 
          color: config.color, 
          fontSize: '12px', 
          fontWeight: 'bold',
          letterSpacing: '0.5px'
        }}>
          {config.text}
        </span>
      </div>
    )
  }

  if (loading) return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      flexDirection: 'column',
      gap: '20px',
      background: '#0e0e10'
    }}>
      <div style={{ 
        width: '50px', 
        height: '50px', 
        border: '3px solid rgba(145, 71, 255, 0.3)',
        borderTopColor: '#9147ff',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <div style={{ color: '#efeff1', fontSize: '18px' }}>Загрузка стрима...</div>
      <div style={{ color: '#adadb8', fontSize: '14px' }}>Stream ID: {streamId}</div>
    </div>
  )
  
  if (error) return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      flexDirection: 'column',
      gap: '20px',
      background: '#0e0e10'
    }}>
      <div style={{ fontSize: '48px' }}>❌</div>
      <div style={{ color: '#efeff1', fontSize: '24px' }}>{error}</div>
      <button
        onClick={() => navigate('/')}
        style={{
          background: '#9147ff',
          color: 'white',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
          marginTop: '20px'
        }}
      >
        ← На главную
      </button>
    </div>
  )
  
  if (!stream) return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      flexDirection: 'column',
      gap: '20px',
      background: '#0e0e10'
    }}>
      <div style={{ fontSize: '48px' }}>🔍</div>
      <div style={{ color: '#efeff1', fontSize: '24px' }}>Стрим не найден</div>
      <button
        onClick={() => navigate('/')}
        style={{
          background: '#9147ff',
          color: 'white',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
          marginTop: '20px'
        }}
      >
        ← На главную
      </button>
    </div>
  )

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: '1fr 400px', 
      height: '100vh',
      background: '#0e0e10'
    }}>
      
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        
        <div style={{ height: '60vh', minHeight: '400px' }}>
          <StreamPlayer stream={stream} />
        </div>
        
        <div style={{ 
          padding: '20px', 
          color: 'white', 
          position: 'relative',
          overflowY: 'auto',
          flex: 1
        }}>
          
          {isStreamOwner && (
            <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10 }}>
              <button
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                style={{
                  background: '#252525',
                  color: 'white',
                  border: '1px solid #444',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#333'}
                onMouseLeave={(e) => e.target.style.background = '#252525'}
              >
                ⚙️ Управление стримом
              </button>
              
              {showSettingsMenu && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  background: '#18181b',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  padding: '8px 0',
                  minWidth: '200px',
                  zIndex: 1000,
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                  marginTop: '5px'
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
                      padding: '12px 16px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#252525'}
                    onMouseLeave={(e) => e.target.style.background = 'transparent'}
                  >
                    <span>📝</span>
                    <span>Настройки стрима</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowSettingsMenu(false)
                      handleDeleteStream()
                    }}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      color: '#ff6b6b',
                      border: 'none',
                      padding: '12px 16px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = 'rgba(255, 107, 107, 0.1)'}
                    onMouseLeave={(e) => e.target.style.background = 'transparent'}
                  >
                    <span>🗑️</span>
                    <span>Удалить стрим</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {renderStreamStatus()}

          <h1 style={{ 
            margin: '0 0 15px 0', 
            fontSize: '24px', 
            paddingRight: isStreamOwner ? '180px' : '0',
            lineHeight: '1.3'
          }}>
            {stream.title}
          </h1>
          
          {stream.description && (
            <p style={{ 
              color: '#adadb8', 
              marginBottom: '20px',
              fontSize: '16px',
              lineHeight: '1.5'
            }}>
              {stream.description}
            </p>
          )}
          
          {renderThemes()}
          
          <div style={{ 
            display: 'flex', 
            gap: '25px', 
            color: '#adadb8', 
            flexWrap: 'wrap',
            marginBottom: '25px',
            padding: '15px',
            background: '#18181b',
            borderRadius: '8px',
            border: '1px solid #333'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#00ff7f' }}>
                {stream.viewers_count || 0}
              </div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>ЗРИТЕЛЕЙ</div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#9147ff' }}>
                {stream.author?.username || 'Streamer'}
              </div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>СТРИМЕР</div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#54a0ff' }}>
                {new Date(stream.created_at).toLocaleDateString('ru-RU')}
              </div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>ДАТА СОЗДАНИЯ</div>
            </div>
            
            {stream.started_at && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ff9f43' }}>
                  {new Date(stream.started_at).toLocaleTimeString('ru-RU', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>НАЧАЛО СТРИМА</div>
              </div>
            )}
          </div>

          {stream.author && (
            <div style={{
              background: '#18181b',
              borderRadius: '8px',
              padding: '20px',
              border: '1px solid #333',
              marginBottom: '20px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '20px'
              }}>
                <h3 style={{ color: 'white', margin: 0, fontSize: '18px' }}>🎮 О СТРИМЕРЕ</h3>
                <Link 
                  to={`/user/${stream.author.id}`}
                  style={{
                    background: '#9147ff',
                    color: 'white',
                    padding: '8px 20px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#772ce8'
                    e.target.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#9147ff'
                    e.target.style.transform = 'translateY(0)'
                  }}
                >
                  <span>📋</span>
                  <span>Профиль</span>
                </Link>
              </div>

              {streamerLoading ? (
                <div style={{ 
                  padding: '30px', 
                  textAlign: 'center', 
                  color: '#adadb8',
                  background: '#0e0e10',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '15px'
                }}>
                  <div style={{
                    width: '30px',
                    height: '30px',
                    border: '3px solid rgba(255, 255, 255, 0.3)',
                    borderTopColor: '#9147ff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  <div>Загрузка информации о стримере...</div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: 'white',
                    overflow: 'hidden',
                    flexShrink: 0,
                    border: '3px solid #9147ff',
                    boxShadow: '0 4px 12px rgba(145, 71, 255, 0.3)'
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
                        fontSize: '32px',
                        fontWeight: 'bold'
                      }}>
                        {(streamerInfo?.username || stream.author.username)?.charAt(0).toUpperCase() || 'S'}
                      </div>
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                      <h4 style={{ 
                        margin: 0, 
                        color: 'white',
                        fontSize: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        {streamerInfo?.username || stream.author.username}
                        {streamerInfo?.is_verified && (
                          <span style={{
                            background: '#00ff7f',
                            color: 'white',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}>
                            ✓
                          </span>
                        )}
                      </h4>
                    </div>

                    {streamerInfo?.bio && (
                      <p style={{ 
                        color: '#adadb8', 
                        margin: '0 0 15px 0',
                        fontSize: '15px',
                        lineHeight: '1.5',
                        fontStyle: 'italic'
                      }}>
                        "{streamerInfo.bio}"
                      </p>
                    )}

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                      gap: '15px',
                      background: '#0e0e10',
                      padding: '15px',
                      borderRadius: '8px',
                      marginBottom: '15px'
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ color: '#9147ff', fontSize: '20px', fontWeight: 'bold' }}>
                          {streamerInfo?.total_streams || '?'}
                        </div>
                        <div style={{ color: '#adadb8', fontSize: '12px', marginTop: '4px' }}>Всего стримов</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ color: '#00ff7f', fontSize: '20px', fontWeight: 'bold' }}>
                          {streamerInfo?.total_viewers || '?'}
                        </div>
                        <div style={{ color: '#adadb8', fontSize: '12px', marginTop: '4px' }}>Всего просмотров</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ color: '#00d2d3', fontSize: '20px', fontWeight: 'bold' }}>
                          {streamerInfo?.followers_count || '?'}
                        </div>
                        <div style={{ color: '#adadb8', fontSize: '12px', marginTop: '4px' }}>Подписчиков</div>
                      </div>
                    </div>

                    <div style={{ 
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '15px',
                      fontSize: '14px',
                      color: '#adadb8'
                    }}>
                      {streamerInfo?.country && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '16px' }}>🌍</span>
                          <span>{streamerInfo.country}</span>
                        </div>
                      )}
                      {streamerInfo?.city && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '16px' }}>🏙️</span>
                          <span>{streamerInfo.city}</span>
                        </div>
                      )}
                      {streamerInfo?.created_at && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '16px' }}>📅</span>
                          <span>Участник с {new Date(streamerInfo.created_at).toLocaleDateString('ru-RU')}</span>
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

      <div style={{
        background: '#18181b',
        borderLeft: '1px solid #333',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'none' }}>
          Stream ID: {streamId} | Chat ID: {chatId} | Owner: {isStreamOwner ? 'YES' : 'NO'}
        </div>
        
        <StreamChat 
          streamId={streamId} 
          chatId={chatId}
          stream={stream} 
        />
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

export default StreamPage