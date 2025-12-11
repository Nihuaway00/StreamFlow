import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import './PublicProfile.css'

const PublicProfile = () => {
  const { userId } = useParams()
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userStreams, setUserStreams] = useState([])
  const [streamsLoading, setStreamsLoading] = useState(true)
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [streamPreviews, setStreamPreviews] = useState({}) // Для хранения превью стримов

  // Функция для извлечения file_key
  const extractFileKey = (url) => {
    if (!url) return null
    if (!url.includes('://') && !url.startsWith('/')) {
      return url
    }
    try {
      if (url.startsWith('/')) {
        return url.substring(1)
      }
      const urlObj = new URL(url)
      return urlObj.pathname.substring(1)
    } catch {
      return url
    }
  }

  // Функция для получения URL превью стрима
  const getStreamPreviewUrl = async (previewUrl) => {
    if (!previewUrl) {
      console.log('❌ previewUrl пустой')
      return null
    }
    
    try {
      const fileKey = extractFileKey(previewUrl)
      if (!fileKey) {
        console.log('❌ Не удалось извлечь file_key из превью')
        return null
      }
      
      const response = await api.post('/files/', null, {
        params: { file_key: fileKey }
      })
      
      let signedUrl = response.data
      if (signedUrl.includes('storage:9000')) {
        signedUrl = signedUrl.replace('storage:9000', 'localhost:9000')
      }
      
      console.log('✅ URL превью получен:', signedUrl)
      return signedUrl
      
    } catch (error) {
      console.error('❌ Ошибка получения URL превью:', error)
      return null
    }
  }

  // Компонент превью стрима
  const StreamPreview = ({ previewUrl, title, style }) => {
    const [imgUrl, setImgUrl] = useState(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
      const loadPreview = async () => {
        if (!previewUrl) {
          setImgUrl('/no-preview.jpg')
          setLoading(false)
          return
        }
        
        try {
          setLoading(true)
          const url = await getStreamPreviewUrl(previewUrl)
          setImgUrl(url)
        } catch (error) {
          console.error('Ошибка загрузки превью стрима:', error)
          setImgUrl('/no-preview.jpg')
        } finally {
          setLoading(false)
        }
      }
      
      loadPreview()
    }, [previewUrl])

    if (loading) {
      return (
        <div style={{
          ...style,
          background: '#111',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#666',
          borderRadius: '8px'
        }}>
          ⏳
        </div>
      )
    }

    if (imgUrl) {
      return (
        <img 
          src={imgUrl} 
          alt={title || "Превью стрима"}
          style={{
            ...style,
            borderRadius: '8px',
            objectFit: 'cover'
          }}
          onError={(e) => {
            console.error('❌ Ошибка загрузки изображения превью')
            e.target.onerror = null
            e.target.src = '/no-preview.jpg'
          }}
        />
      )
    }

    return (
      <img 
        src="/no-preview.jpg"
        alt="Нет превью"
        style={{
          ...style,
          borderRadius: '8px',
          objectFit: 'cover'
        }}
      />
    )
  }

  // Функция для получения эмодзи стрима
  const getStreamEmoji = (title) => {
    if (!title) return '🎥'
    const lowerTitle = title.toLowerCase()
    if (lowerTitle.includes('музыка') || lowerTitle.includes('трек')) return '🎵'
    if (lowerTitle.includes('игра') || lowerTitle.includes('cs2')) return '🎮'
    if (lowerTitle.includes('dota') || lowerTitle.includes('дота')) return '⚔️'
    if (lowerTitle.includes('общение') || lowerTitle.includes('chat')) return '💬'
    if (lowerTitle.includes('рисование') || lowerTitle.includes('арт')) return '🎨'
    return '🎥'
  }

  // Загрузка данных пользователя
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true)
        console.log('🔄 Загружаю данные пользователя:', userId)

        const response = await api.get(`/users/${userId}`)
        console.log('✅ Ответ от сервера:', response.data)

        let userData
        if (typeof response.data === 'string') {
          try {
            userData = JSON.parse(response.data)
          } catch (parseError) {
            console.error('Ошибка парсинга:', parseError)
            userData = response.data
          }
        } else {
          userData = response.data
        }

        setUser(userData)

        // Загружаем аватар если есть
        if (userData.avatar_url) {
          await loadAvatar(userData.avatar_url)
        }

      } catch (err) {
        console.error('❌ Ошибка загрузки пользователя:', err)
        setError('Пользователь не найден')
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [userId])

  // Загрузка стримов пользователя
  useEffect(() => {
    if (!user) return

    const fetchUserStreams = async () => {
      try {
        setStreamsLoading(true)
        console.log('📡 Загружаю стримы пользователя...')

        // Сначала пробуем получить все стримы
        const response = await api.get('/streams', {
          params: { limit: 100, page: 1 }
        })

        console.log('📦 Все стримы:', response.data)

        // Фильтруем стримы этого пользователя
        let allStreams = []

        if (Array.isArray(response.data)) {
          allStreams = response.data
        } else if (response.data && Array.isArray(response.data.items)) {
          allStreams = response.data.items
        }

        const userStreamsFiltered = allStreams.filter(stream => {
          return stream.author?.id === userId || 
                 stream.user_id === userId ||
                 stream.owner_id === userId
        })

        console.log('✅ Стримы пользователя:', userStreamsFiltered)
        setUserStreams(userStreamsFiltered)

      } catch (err) {
        console.error('Ошибка загрузки стримов:', err)
        setUserStreams([])
      } finally {
        setStreamsLoading(false)
      }
    }

    fetchUserStreams()
  }, [user, userId])

  // Функция для загрузки аватара
  const loadAvatar = async (avatarUrl) => {
    try {
      console.log('🔄 Загрузка аватара:', avatarUrl)

      const fileKey = extractFileKey(avatarUrl)
      if (!fileKey) return

      // Получаем signed URL
      const response = await api.post('/files/', null, {
        params: { file_key: fileKey }
      })

      let signedUrl = response.data
      if (signedUrl.includes('storage:9000')) {
        signedUrl = signedUrl.replace('storage:9000', 'localhost:9000')
      }

      console.log('✅ URL аватара:', signedUrl)
      setAvatarUrl(signedUrl)

    } catch (error) {
      console.error('Ошибка загрузки аватара:', error)
    }
  }

  // Форматирование даты
  const formatDate = (dateString) => {
    if (!dateString) return 'Неизвестно'
    try {
      return new Date(dateString).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return 'Неизвестно'
    }
  }

  if (loading) {
    return (
      <div className="public-profile" style={{ padding: '40px', textAlign: 'center', color: '#adadb8' }}>
        <div style={{ fontSize: '24px', marginBottom: '20px' }}>🌀</div>
        <div>Загрузка профиля...</div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="public-profile" style={{ padding: '40px', textAlign: 'center', color: '#adadb8' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>😕</div>
        <div style={{ fontSize: '20px', marginBottom: '10px' }}>Пользователь не найден</div>
        <p style={{ marginBottom: '20px' }}>Такого пользователя не существует или у вас нет доступа</p>
        <button
          onClick={() => navigate(-1)}
          className="pp-button-primary"
          style={{
            background: '#9147ff',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ← Назад
        </button>
      </div>
    )
  }

  return (
    <div className="public-profile">
      {/* ШАПКА ПРОФИЛЯ */}
      <div className="pp-card">
        <div className="pp-header-gradient" />
        <div className="pp-header-inner">
          {/* АВАТАР */}
          <div className="pp-avatar">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={user.username}
                onError={(e) => {
                  console.error('Ошибка загрузки аватара')
                  e.target.style.display = 'none'
                }}
              />
            ) : (
              <div className="pp-avatar-fallback">
                {user.username?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </div>

          {/* ИНФОРМАЦИЯ */}
          <div className="pp-user-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
              <h1 className="pp-username">{user.username}</h1>
              {user.is_verified && (
                <span className="pp-verified">✅ Подтвержден</span>
              )}
            </div>

            {user.first_name && user.last_name && (
              <p className="pp-fullname">
                {user.first_name} {user.last_name}
              </p>
            )}

            {user.bio && (
              <p className="pp-bio">
                "{user.bio}"
              </p>
            )}
          </div>

          {/* СТАТИСТИКА */}
          <div className="pp-mini-stats">
            <div className="pp-mini-stats-grid">
              <div>
                <div className="pp-mini-number">{userStreams.length}</div>
                <div className="pp-mini-label">Стримов</div>
              </div>
              <div>
                <div className="pp-mini-number">{userStreams.filter(s => s.status === 'live').length}</div>
                <div className="pp-mini-label">Онлайн</div>
              </div>
            </div>
          </div>
        </div>

        {/* ИНФО СТРОКА */}
        <div className="pp-header-info">
          {user.email && (
            <div className="pp-header-info-item">
              <span>📧</span>
              <span>{user.email}</span>
            </div>
          )}

          {(user.country || user.city) && (
            <div className="pp-header-info-item">
              <span>📍</span>
              <span>{[user.city, user.country].filter(Boolean).join(', ')}</span>
            </div>
          )}

          {user.created_at && (
            <div className="pp-header-info-item">
              <span>📅</span>
              <span>Зарегистрирован: {formatDate(user.created_at)}</span>
            </div>
          )}

          {user.website && (
            <div className="pp-header-info-item">
              <span>🌐</span>
              <a 
                href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="pp-link"
                style={{ color: '#9147ff', textDecoration: 'none' }}
              >
                {user.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="pp-columns">
        {/* ЛЕВАЯ КОЛОНКА - СТРИМЫ */}
        <div>
          <div className="pp-card streams-list" style={{ marginBottom: '20px' }}>
            <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              🎥 Стримы {user.username}
              <span style={{
                background: '#333',
                color: '#adadb8',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px'
              }}>
                {userStreams.length} всего
              </span>
            </h2>

            {streamsLoading ? (
              <div className="pp-empty">
                <div style={{ fontSize: '24px', marginBottom: '10px' }}>🌀</div>
                <div>Загрузка стримов...</div>
              </div>
            ) : userStreams.length === 0 ? (
              <div className="pp-empty">
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎥</div>
                <div style={{ fontSize: '18px', marginBottom: '10px' }}>Стримов пока нет</div>
                <p>Этот пользователь еще не начал ни одного стрима</p>
              </div>
            ) : (
              <div className="streams-wrapper">
                {userStreams.map((stream) => (
                  <div 
                    key={stream.id}
                    onClick={() => navigate(`/stream/${stream.id}`)}
                    className="stream-item"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/stream/${stream.id}`) }}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* ПРЕВЬЮ СТРИМА */}
                    <div style={{ 
                      width: '100%', 
                      height: '180px', 
                      borderRadius: '8px', 
                      overflow: 'hidden', 
                      marginBottom: '15px',
                      position: 'relative'
                    }}>
                      <StreamPreview 
                        previewUrl={stream.preview_url}
                        title={stream.title}
                        style={{ width: '100%', height: '100%' }}
                      />
                      
                      {/* БЕЙДЖ СТАТУСА НАД ПРЕВЬЮ */}
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        background: stream.status === 'live' ? '#e91916' : '#333',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}>
                        {stream.status === 'live' ? '🔴 LIVE' : '⚫ OFFLINE'}
                      </div>
                      
                      {/* КОЛИЧЕСТВО ЗРИТЕЛЕЙ */}
                      {stream.viewers_count > 0 && (
                        <div style={{
                          position: 'absolute',
                          bottom: '10px',
                          left: '10px',
                          background: 'rgba(0, 0, 0, 0.7)',
                          color: 'white',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}>
                          👁️ {stream.viewers_count}
                        </div>
                      )}
                    </div>

                    {/* ИНФОРМАЦИЯ О СТРИМЕ */}
                    <div>
                      <h3 style={{ 
                        margin: '0 0 8px 0', 
                        color: '#efeff1', 
                        fontSize: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        <span style={{ fontSize: '20px' }}>{getStreamEmoji(stream.title)}</span>
                        {stream.title || 'Без названия'}
                      </h3>

                      {stream.description && (
                        <p style={{ 
                          margin: '0 0 15px 0', 
                          color: '#adadb8', 
                          fontSize: '14px', 
                          lineHeight: '1.5',
                          maxHeight: '60px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          {stream.description}
                        </p>
                      )}

                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        paddingTop: '15px', 
                        borderTop: '1px solid rgba(255,255,255,0.06)', 
                        fontSize: '12px', 
                        color: '#adadb8' 
                      }}>
                        <div style={{ display: 'flex', gap: '15px' }}>
                          {stream.started_at && (
                            <span>🕐 {new Date(stream.started_at).toLocaleDateString('ru-RU')}</span>
                          )}

                          {stream.themes && stream.themes.length > 0 && (
                            <span>🎯 {stream.themes.length} тематик</span>
                          )}
                        </div>

                        <span className="pp-link" style={{ 
                          background: '#333', 
                          padding: '5px 12px', 
                          borderRadius: '4px',
                          transition: 'all 0.2s',
                          ':hover': {
                            background: '#444'
                          }
                        }}>
                          Смотреть →
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ИНФОРМАЦИЯ О ПОЛЬЗОВАТЕЛЕ */}
          <div className="pp-card" style={{ marginBottom: '20px' }}>
            <h2 style={{ marginBottom: '20px' }}>📝 О пользователе</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              {user.phone && (
                <div className="pp-info-box">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                    <span style={{ fontSize: '20px' }}>📱</span>
                    <strong style={{ color: '#efeff1' }}>Телефон</strong>
                  </div>
                  <div style={{ color: '#adadb8', fontSize: '14px' }}>{user.phone}</div>
                </div>
              )}

              {user.date_of_birth && (
                <div className="pp-info-box">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                    <span style={{ fontSize: '20px' }}>🎂</span>
                    <strong style={{ color: '#efeff1' }}>Дата рождения</strong>
                  </div>
                  <div style={{ color: '#adadb8', fontSize: '14px' }}>
                    {formatDate(user.date_of_birth)}
                  </div>
                </div>
              )}

              {(user.country || user.city) && (
                <div className="pp-info-box">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                    <span style={{ fontSize: '20px' }}>📍</span>
                    <strong style={{ color: '#efeff1' }}>Местоположение</strong>
                  </div>
                  <div style={{ color: '#adadb8', fontSize: '14px' }}>
                    {[user.city, user.country].filter(Boolean).join(', ') || 'Не указано'}
                  </div>
                </div>
              )}

              {user.website && (
                <div className="pp-info-box">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                    <span style={{ fontSize: '20px' }}>🌐</span>
                    <strong style={{ color: '#efeff1' }}>Веб-сайт</strong>
                  </div>
                  <div style={{ color: '#adadb8', fontSize: '14px' }}>
                    <a 
                      href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#9147ff', textDecoration: 'none' }}
                    >
                      {user.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ */}
            <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 style={{ marginBottom: '15px', color: '#efeff1' }}>📊 Дополнительная информация</h3>
              <div className="pp-extra-box">
                <p style={{ margin: '0 0 10px 0' }}>
                  <strong>Статус аккаунта:</strong> {user.is_active ? '✅ Активен' : '❌ Не активен'}
                </p>
                <p style={{ margin: '0 0 10px 0' }}>
                  <strong>Подтверждение email:</strong> {user.is_verified ? '✅ Подтвержден' : '🟡 Не подтвержден'}
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Дата регистрации:</strong> {formatDate(user.created_at)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА - ДЕЙСТВИЯ */}
        <div>
          {/* КНОПКИ ДЕЙСТВИЙ */}
          <div className="pp-card quick-actions" style={{ marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '15px' }}>⚡ Действия</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => {
                  // TODO: Реализовать подписку
                  alert(`Подписка на ${user.username}`)
                }}
                className="pp-action-btn pp-action-subscribe"
                style={{ background: '#9147ff', color: 'white', border: 'none', padding: '12px', borderRadius: '4px', cursor: 'pointer', textAlign: 'left', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}
              >
                <span style={{ fontSize: '16px' }}>➕</span>
                Подписаться
              </button>

              <button
                onClick={() => {
                  // TODO: Реализовать сообщение
                  alert(`Отправка сообщения ${user.username}`)
                }}
                className="pp-action-btn pp-action-message"
                style={{ background: '#333', color: 'white', border: 'none', padding: '12px', borderRadius: '4px', cursor: 'pointer', textAlign: 'left', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}
              >
                <span style={{ fontSize: '16px' }}>💬</span>
                Написать сообщение
              </button>

              <button
                onClick={() => navigate(-1)}
                className="pp-action-btn pp-action-back"
                style={{ background: 'transparent', color: '#efeff1', border: '1px solid #333', padding: '12px', borderRadius: '4px', cursor: 'pointer', textAlign: 'left', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}
              >
                <span style={{ fontSize: '16px' }}>←</span>
                Назад
              </button>
            </div>
          </div>

          {/* СТАТИСТИКА */}
          <div className="pp-card profile-info-box" style={{ marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '15px' }}>📊 Статистика</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ color: '#adadb8', fontSize: '14px' }}>Всего стримов</span>
                  <span style={{ color: 'white', fontWeight: 'bold' }}>{userStreams.length}</span>
                </div>
                <div style={{ height: '4px', background: '#333', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '100%', background: '#9147ff', borderRadius: '2px' }}/>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ color: '#adadb8', fontSize: '14px' }}>Активных стримов</span>
                  <span style={{ color: 'white', fontWeight: 'bold' }}>
                    {userStreams.filter(s => s.status === 'live').length}
                  </span>
                </div>
                <div style={{ height: '4px', background: '#333', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${(userStreams.filter(s => s.status === 'live').length / Math.max(userStreams.length, 1)) * 100}%`, 
                    background: '#e91916', 
                    borderRadius: '2px' 
                  }}/>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ color: '#adadb8', fontSize: '14px' }}>Всего зрителей</span>
                  <span style={{ color: 'white', fontWeight: 'bold' }}>
                    {userStreams.reduce((sum, stream) => sum + (stream.viewers_count || 0), 0)}
                  </span>
                </div>
                <div style={{ height: '4px', background: '#333', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '100%', background: '#00ff7f', borderRadius: '2px' }}/>
                </div>
              </div>
            </div>
          </div>

          {/* КОНТАКТЫ */}
          <div className="pp-card" style={{ marginBottom: '0' }}>
            <h3 style={{ marginBottom: '15px' }}>📞 Контакты</h3>
            <div className="pp-contact-box">
              {user.email && (
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ color: '#adadb8', fontSize: '12px', marginBottom: '5px' }}>Email</div>
                  <div style={{ color: '#efeff1', fontSize: '14px', wordBreak: 'break-all' }}>
                    {user.email}
                  </div>
                </div>
              )}

              {user.phone && (
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ color: '#adadb8', fontSize: '12px', marginBottom: '5px' }}>Телефон</div>
                  <div style={{ color: '#efeff1', fontSize: '14px' }}>
                    {user.phone}
                  </div>
                </div>
              )}

              {user.website && (
                <div>
                  <div style={{ color: '#adadb8', fontSize: '12px', marginBottom: '5px' }}>Веб-сайт</div>
                  <div style={{ color: '#efeff1', fontSize: '14px' }}>
                    <a 
                      href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#9147ff', textDecoration: 'none' }}
                    >
                      {user.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                </div>
              )}

              {!user.email && !user.phone && !user.website && (
                <div style={{ textAlign: 'center', color: '#adadb8', padding: '10px' }}>
                  Контакты не указаны
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PublicProfile