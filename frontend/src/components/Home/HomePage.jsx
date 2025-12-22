import React, { useMemo, useState, useEffect } from "react"
import { Link } from "react-router-dom"
import veschanieBackground from "../../veschanie.png"
import Thumbnail from "../Stream/Thumbnail"
import api from "../../services/api"
import { themeHelpers } from "../../services/api"
import "./Home.css"

// Компонент для получения signed URL аватара
const AvatarWithSignedUrl = ({ avatarUrl, username, size = 32 }) => {
  const [signedUrl, setSignedUrl] = useState(null)
  const [loading, setLoading] = useState(false)

  const extractFileKey = (url) => {
    if (!url) return null
    
    if (typeof url === 'string' && 
        !url.includes('://') && 
        !url.startsWith('/')) {
      return url
    }
    
    try {
      if (url.startsWith('/')) {
        return url.substring(1)
      }
      
      const parsedUrl = new URL(url)
      return parsedUrl.pathname.substring(1)
    } catch (error) {
      return url
    }
  }

  const getSignedAvatarUrl = async (fileKey) => {
    if (!fileKey) return null
    
    try {
      const response = await api.post('/files/', null, {
        params: { file_key: fileKey }
      })
      
      let url = response.data
      
      if (typeof url === 'string') {
        if (url.includes('storage:9000')) {
          url = url.replace('storage:9000', 'localhost:9000')
        }
        return url
      }
      return null
    } catch (error) {
      console.error('Ошибка получения signed URL аватара:', error)
      return null
    }
  }

  useEffect(() => {
    const loadAvatar = async () => {
      if (!avatarUrl) {
        setSignedUrl(null)
        return
      }

      setLoading(true)
      try {
        const fileKey = extractFileKey(avatarUrl)
        if (fileKey) {
          const url = await getSignedAvatarUrl(fileKey)
          setSignedUrl(url)
        } else {
          setSignedUrl(null)
        }
      } catch (error) {
        console.error('Ошибка загрузки аватара:', error)
        setSignedUrl(null)
      } finally {
        setLoading(false)
      }
    }

    loadAvatar()
  }, [avatarUrl])

  const displayLetter = username?.charAt(0).toUpperCase() || 'U'

  if (loading) {
    return (
      <div 
        className="author-avatar loading" 
        style={{
          width: `${size}px`,
          height: `${size}px`,
          fontSize: `${size * 0.4}px`
        }}
      >
        {displayLetter}
      </div>
    )
  }

  if (signedUrl) {
    return (
      <div 
        className="author-avatar"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          backgroundImage: `url(${signedUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
        title={username}
      >
        <span style={{ opacity: 0 }}>{displayLetter}</span>
      </div>
    )
  }

  return (
    <div 
      className="author-avatar no-avatar"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        fontSize: `${size * 0.4}px`,
        background: 'linear-gradient(45deg, #9147ff, #772ce8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold'
      }}
      title={username}
    >
      {displayLetter}
    </div>
  )
}

// Основной компонент с фильтрацией по тематикам
const HomePage = ({ streams = [], liveStreams = [], loading = false }) => {
  const [userCache, setUserCache] = useState({})
  const [themes, setThemes] = useState([])
  const [selectedTheme, setSelectedTheme] = useState('all') // 'all' или id тематики
  const [themesLoading, setThemesLoading] = useState(false)

  // Загружаем тематики при монтировании
  useEffect(() => {
    const fetchThemes = async () => {
      setThemesLoading(true)
      try {
        const response = await api.get('/themes/')
        setThemes(response.data || [])
      } catch (error) {
        console.error('Ошибка загрузки тематик:', error)
        // Демо данные на случай ошибки
        setThemes([
          { id: 1, name: "gaming", description: "Стримы про видеоигры" },
          { id: 2, name: "music", description: "Музыкальные стримы" },
          { id: 3, name: "just_chatting", description: "Разговорные стримы" },
          { id: 4, name: "art", description: "Искусство и творчество" },
          { id: 5, name: "sports", description: "Спортивные трансляции" },
          { id: 6, name: "technology", description: "Технологии и программирование" },
        ])
      } finally {
        setThemesLoading(false)
      }
    }
    fetchThemes()
  }, [])

  // Получаем уникальные ID авторов
  const allAuthorIds = useMemo(() => {
    const allStreams = [...liveStreams, ...streams];
    const ids = [];
    const seen = new Set();
    
    allStreams.forEach(stream => {
      if (stream.author?.id && !seen.has(stream.author.id)) {
        seen.add(stream.author.id);
        ids.push(stream.author.id);
      }
    });
    
    return ids;
  }, [streams, liveStreams])

  // Загружаем данные пользователей
  useEffect(() => {
    const fetchUsers = async () => {
      if (allAuthorIds.length === 0) return;
      
      const newCache = { ...userCache };
      let hasUpdates = false;
      
      for (const userId of allAuthorIds) {
        if (!newCache[userId]) {
          try {
            const response = await api.get(`/users/${userId}`);
            newCache[userId] = response.data;
            hasUpdates = true;
          } catch (error) {
            console.warn(`Не удалось загрузить пользователя ${userId}:`, error);
            const stream = [...streams, ...liveStreams].find(s => s.author?.id === userId);
            if (stream?.author) {
              newCache[userId] = { 
                id: userId, 
                username: stream.author.username,
                avatar_url: null 
              };
              hasUpdates = true;
            }
          }
        }
      }
      
      if (hasUpdates) {
        setUserCache(newCache);
      }
    };

    fetchUsers();
  }, [allAuthorIds])

  // Фильтруем стримы по выбранной тематике
  const filteredStreams = useMemo(() => {
    if (selectedTheme === 'all') {
      return streams;
    }
    
    return streams.filter(stream => {
      // Проверяем, есть ли у стрима темы и содержит ли он выбранную тему
      if (!stream.themes || !Array.isArray(stream.themes)) {
        return false;
      }
      
      return stream.themes.some(theme => {
        // Может быть объектом темы или просто ID
        const themeId = theme.id || theme;
        return themeId === parseInt(selectedTheme);
      });
    });
  }, [streams, selectedTheme]);

  // Фильтруем LIVE стримы по выбранной тематике
  const filteredLiveStreams = useMemo(() => {
    if (selectedTheme === 'all') {
      return liveStreams;
    }
    
    return liveStreams.filter(stream => {
      if (!stream.themes || !Array.isArray(stream.themes)) {
        return false;
      }
      
      return stream.themes.some(theme => {
        const themeId = theme.id || theme;
        return themeId === parseInt(selectedTheme);
      });
    });
  }, [liveStreams, selectedTheme]);

  // Сортируем стримы для отображения (сначала LIVE, потом остальные)
  const sortedStreams = useMemo(() => {
    const liveIds = new Set(filteredLiveStreams.map(s => s.id))
    const others = filteredStreams.filter(s => !liveIds.has(s.id))
    return [...filteredLiveStreams, ...others].slice(0, 27)
  }, [filteredStreams, filteredLiveStreams])

  // Функция для получения русского названия тематики
  const getThemeDisplayName = (themeName) => {
    return themeHelpers.getDisplayName(themeName);
  }

  // Функция для получения цвета тематики
  const getThemeColor = (themeName) => {
    return themeHelpers.getColor(themeName);
  }

  // Обработчик выбора тематики
  const handleThemeSelect = (themeId) => {
    setSelectedTheme(themeId);
  }

  return (
    <div className="home-page-root">
      <div className="profile-bg" aria-hidden="true" />
      <div className="home-wrapper">
        {/* LIVE секция */}
        {filteredLiveStreams?.length > 0 && (
          <section className="live-section">
            <div className="glass section-header">
              <h2 className="live-heading">
                <span className="live-icon">🔴</span>
                Прямо сейчас в эфире
              </h2>
              <div className="live-count">
                <span className="live-badge-count">{filteredLiveStreams.length}</span>
                <span>стримов</span>
              </div>
            </div>
            <div className="stream-grid">
              {filteredLiveStreams.map(stream => {
                const isLive = true
                const userData = userCache[stream.author?.id]
                return (
                  <Link key={stream.id} to={`/stream/${stream.id}`} className="stream-card glass">
                    <div className={`preview ${isLive ? "preview-live" : ""}`}>
                      <span className="live-badge">LIVE</span>
                      <Thumbnail
                        previewUrl={stream.preview_url}
                        className="thumb-img"
                        alt={stream.title || "Превью стрима"}
                      />
                    </div>
                    <div className="card-body">
                      <h3 className="card-title">{stream.title || "Название стрима"}</h3>
                      <div className="card-author">
                        <AvatarWithSignedUrl 
                          avatarUrl={userData?.avatar_url}
                          username={userData?.username || stream.author?.username}
                          size={32}
                        />
                        <div className="card-sub">{userData?.username || stream.author?.username || "Streamer"}</div>
                      </div>
                      <div className="card-bottom">
                        <div className="views">
                          <span className="view-icon">👁</span>
                          <span className="view-count">{stream.viewers_count || 0}</span>
                        </div>
                        <div className="status status-online">online</div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* Секция всех стримов */}
        <section className="all-section">
          <div className="glass section-header all-header">
            <div className="header-content">
              <h3 className="section-title">
                <span className="section-icon"></span>
                Все стримы
                {selectedTheme !== 'all' && (
                  <span className="theme-filter-indicator">
                    {themes.find(t => t.id === parseInt(selectedTheme))?.name && 
                     ` · ${getThemeDisplayName(themes.find(t => t.id === parseInt(selectedTheme)).name)}`}
                  </span>
                )}
              </h3>
              <div className="stream-count">
                <span className="count-number">{sortedStreams.length}</span>
                <span>всего</span>
              </div>
            </div>
            
            {/* Фильтры по тематикам */}
            <div className="stream-tags">
              <span 
                className={`stream-tag ${selectedTheme === 'all' ? 'active' : ''}`}
                onClick={() => handleThemeSelect('all')}
                style={selectedTheme === 'all' ? {
                  background: 'rgba(145, 71, 255, 0.2)',
                  borderColor: 'rgba(145, 71, 255, 0.3)',
                  color: '#9147ff'
                } : {}}
              >
                Все
              </span>
              
              {themesLoading ? (
                <span className="stream-tag loading">
                  Загрузка...
                </span>
              ) : (
                themes.slice(0, 6).map(theme => (
                  <span
                    key={theme.id}
                    className={`stream-tag ${selectedTheme === theme.id.toString() ? 'active' : ''}`}
                    onClick={() => handleThemeSelect(theme.id.toString())}
                    style={selectedTheme === theme.id.toString() ? {
                      background: `${getThemeColor(theme.name)}20`,
                      borderColor: getThemeColor(theme.name),
                      color: getThemeColor(theme.name)
                    } : {}}
                  >
                    {getThemeDisplayName(theme.name)}
                  </span>
                ))
              )}
              
              {themes.length > 6 && (
                <span className="stream-tag more">
                  +{themes.length - 6} ещё
                </span>
              )}
            </div>
          </div>

          {loading ? (
            <div className="glass loading-container">
              <div className="loading-spinner"></div>
              <p>Загрузка стримов...</p>
            </div>
          ) : sortedStreams.length > 0 ? (
            <div className="stream-grid">
              {sortedStreams.map(stream => {
                const isLive = stream?.status === "live" || stream?.status === "LIVE"
                const userData = userCache[stream.author?.id]
                
                // Получаем темы стрима для отображения
                const streamThemes = stream.themes || []
                const themeNames = streamThemes.map(theme => {
                  const themeObj = themes.find(t => t.id === (theme.id || theme))
                  return themeObj ? getThemeDisplayName(themeObj.name) : null
                }).filter(Boolean)
                
                return (
                  <Link key={stream.id} to={`/stream/${stream.id}`} className="stream-card glass">
                    <div className={`preview ${isLive ? "preview-live" : ""}`}>
                      {isLive && <span className="live-badge">LIVE</span>}
                      <Thumbnail
                        previewUrl={stream.preview_url}
                        className="thumb-img"
                        alt={stream.title || "Превью стрима"}
                      />
                    </div>
                    <div className="card-body">
                      <h3 className="card-title">{stream.title || "Название стрима"}</h3>
                      <div className="card-author">
                        <AvatarWithSignedUrl 
                          avatarUrl={userData?.avatar_url}
                          username={userData?.username || stream.author?.username}
                          size={32}
                        />
                        <div className="card-sub">{userData?.username || stream.author?.username || "Streamer"}</div>
                      </div>
                      
                      {/* Теги тематик в карточке */}
                      {themeNames.length > 0 && (
                        <div className="card-themes">
                          {themeNames.slice(0, 3).map((name, index) => (
                            <span 
                              key={index}
                              className="card-theme-tag"
                              style={{
                                background: `${getThemeColor(themes.find(t => 
                                  getThemeDisplayName(t.name) === name
                                )?.name || 'gaming')}20`,
                                color: getThemeColor(themes.find(t => 
                                  getThemeDisplayName(t.name) === name
                                )?.name || 'gaming')
                              }}
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className="card-bottom">
                        <div className="views">
                          <span className="view-icon">👁</span>
                          <span className="view-count">{stream.viewers_count || 0}</span>
                        </div>
                        <div className={`status ${isLive ? "status-online" : "status-offline"}`}>
                          {isLive ? "online" : "offline"}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="glass empty-streams">
              <div className="empty-icon">🎥</div>
              <h4>
                {selectedTheme === 'all' 
                  ? 'Стримов пока нет' 
                  : `Нет стримов в тематике "${getThemeDisplayName(themes.find(t => t.id === parseInt(selectedTheme))?.name || '')}"`}
              </h4>
              <p>
                {selectedTheme === 'all' 
                  ? 'Будьте первым, кто начнет трансляцию!' 
                  : 'Попробуйте выбрать другую тематику или создайте стрим в этой категории'}
              </p>
              <div className="empty-actions">
                <Link to="/stream" className="btn btn-primary">
                  🎥 Начать стрим
                </Link>
                {selectedTheme !== 'all' && (
                  <button 
                    onClick={() => handleThemeSelect('all')}
                    className="btn btn-ghost"
                  >
                    Показать все стримы
                  </button>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Нижний блок */}
        <div className="glass start-block">
          <div className="start-bg" style={{ backgroundImage: `url(${veschanieBackground})` }}></div>
          <div className="start-content">
            <div className="start-text">
              <h3 className="start-title">Готовы начать вещание?</h3>
              <p className="start-description">
                Присоединяйтесь к сообществу стримеров и делитесь своим контентом с миром
              </p>
            </div>
            <div className="start-actions">
              <Link to="/stream" className="btn btn-primary start-btn">
                <span className="btn-icon">🎥</span>
                Начать стрим
              </Link>
              <Link to="/profile" className="btn btn-ghost">
                <span className="btn-icon">👤</span>
                Мой профиль
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage