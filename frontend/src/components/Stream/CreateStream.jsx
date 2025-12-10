import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { streamAPI } from '../../services/api'

const CreateStream = () => {
  const { user } = useAuth()
  const [streamData, setStreamData] = useState({
    title: '',
    description: '',
    theme_ids: [] // Добавляем тематики
  })
  const [themes, setThemes] = useState([]) // Стейт для тематик
  const [loading, setLoading] = useState(false)
  const [themesLoading, setThemesLoading] = useState(true)
  const [createdStream, setCreatedStream] = useState(null)

  // Загружаем тематики при монтировании
  useEffect(() => {
    const fetchThemes = async () => {
      try {
        const response = await streamAPI.getThemes()
        // streamAPI.getThemes() уже возвращает response.data
        setThemes(response.data || [])
      } catch (error) {
        console.error('Ошибка загрузки тематик:', error)
        // Демо данные на случай ошибки
        setThemes([
          { id: 1, name: "gaming", description: "Стримы про видеоигры" },
          { id: 2, name: "music", description: "Музыкальные стримы" },
          { id: 3, name: "just_chatting", description: "Разговорные стримы" },
        ])
      } finally {
        setThemesLoading(false)
      }
    }
    fetchThemes()
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setStreamData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Обработчик выбора тематик
  const handleThemeToggle = (themeId) => {
    setStreamData(prev => ({
      ...prev,
      theme_ids: prev.theme_ids.includes(themeId)
        ? prev.theme_ids.filter(id => id !== themeId) // Убираем если уже выбран
        : [...prev.theme_ids, themeId] // Добавляем если не выбран
    }))
  }

  const handleStartStream = async () => {
    if (!streamData.title.trim()) {
      alert('Введите название стрима')
      return
    }

    setLoading(true)
    try {
      const response = await streamAPI.createStream({
        title: streamData.title,
        description: streamData.description,
        theme_ids: streamData.theme_ids // Отправляем выбранные тематики
      })
      
      setCreatedStream(response.data)
      alert(`Стрим "${streamData.title}" создан! Настройте OBS и начните трансляцию.`)
      
    } catch (error) {
      console.error('Ошибка создания стрима:', error)
      alert('Ошибка создания стрима. Проверьте подключение к бэкенду.')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    alert('Скопировано в буфер обмена!')
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

  const streamKey = createdStream?.stream_key || `live_${user?.username}_${Date.now()}`
  const rtmpUrl = 'rtmp://localhost:1935/live'
  const hlsUrl = `http://localhost:8080/live/${streamKey}/index.m3u8`

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* ЗАГОЛОВОК */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '36px', marginBottom: '10px' }}>🎥 Начать стрим</h1>
        <p style={{ color: '#adadb8', fontSize: '18px' }}>
          Настройте трансляцию и начните вещание
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '30px'
      }}>
        
        {/* ЛЕВАЯ КОЛОНКА - НАСТРОЙКИ СТРИМА */}
        <div>
          
          {/* ОСНОВНЫЕ НАСТРОЙКИ */}
          <div style={{
            background: '#18181b',
            borderRadius: '8px',
            padding: '25px',
            marginBottom: '20px',
            border: '1px solid #333'
          }}>
            <h2 style={{ marginBottom: '20px', color: '#efeff1' }}>📝 Основные настройки</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              
              {/* НАЗВАНИЕ СТРИМА */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  color: '#adadb8',
                  fontWeight: '500'
                }}>
                  Название стрима *
                </label>
                <input
                  type="text"
                  name="title"
                  value={streamData.title}
                  onChange={handleInputChange}
                  placeholder="Введите захватывающее название..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#0e0e10',
                    border: '1px solid #333',
                    borderRadius: '4px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                />
              </div>

              {/* ОПИСАНИЕ */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  color: '#adadb8',
                  fontWeight: '500'
                }}>
                  Описание
                </label>
                <textarea
                  name="description"
                  value={streamData.description}
                  onChange={handleInputChange}
                  placeholder="Опишите что будет происходить в стриме..."
                  rows="4"
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#0e0e10',
                    border: '1px solid #333',
                    borderRadius: '4px',
                    color: 'white',
                    fontSize: '14px',
                    resize: 'vertical',
                    fontFamily: 'Arial, sans-serif'
                  }}
                />
              </div>

              {/* ТЕМАТИКИ */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  color: '#adadb8',
                  fontWeight: '500'
                }}>
                  Тематики
                </label>
                {themesLoading ? (
                  <p style={{ color: '#adadb8', fontSize: '14px' }}>Загрузка тематик...</p>
                ) : (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    {themes.map(theme => (
                      <label 
                        key={theme.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          cursor: 'pointer',
                          padding: '8px',
                          borderRadius: '4px',
                          transition: 'background 0.2s',
                          background: streamData.theme_ids.includes(theme.id) ? '#9147ff20' : 'transparent'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#9147ff10'}
                        onMouseLeave={(e) => e.target.style.background = streamData.theme_ids.includes(theme.id) ? '#9147ff20' : 'transparent'}
                      >
                        <input
                          type="checkbox"
                          checked={streamData.theme_ids.includes(theme.id)}
                          onChange={() => handleThemeToggle(theme.id)}
                          style={{
                            width: '16px',
                            height: '16px',
                            cursor: 'pointer'
                          }}
                        />
                        <span style={{ color: 'white', fontSize: '14px' }}>
                          {getThemeDisplayName(theme.name)}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* СТАТУС */}
              {createdStream && (
                <div style={{
                  padding: '15px',
                  background: '#00ff7f20',
                  border: '1px solid #00ff7f',
                  borderRadius: '4px',
                  color: '#00ff7f'
                }}>
                  <strong>✅ Стрим создан успешно!</strong>
                  <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>
                    Статус: <strong>{createdStream.status}</strong>
                  </p>
                  {streamData.theme_ids.length > 0 && (
                    <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>
                      Тематики: {streamData.theme_ids.map(id => 
                        getThemeDisplayName(themes.find(t => t.id === id)?.name)
                      ).join(', ')}
                    </p>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* КНОПКА ЗАПУСКА */}
          <button 
            onClick={handleStartStream}
            disabled={!streamData.title.trim() || loading}
            style={{
              width: '100%',
              background: (!streamData.title.trim() || loading) ? '#333' : '#9147ff',
              color: 'white',
              border: 'none',
              padding: '15px',
              borderRadius: '4px',
              cursor: (!streamData.title.trim() || loading) ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              transition: 'all 0.2s'
            }}
          >
            {loading ? '🔄 Создание стрима...' : '🎥 Создать стрим'}
          </button>

        </div>

        {/* ПРАВАЯ КОЛОНКА - НАСТРОЙКИ OBS */}
        <div>
          
          {/* НАСТРОЙКИ OBS */}
          <div style={{
            background: '#18181b',
            borderRadius: '8px',
            padding: '25px',
            marginBottom: '20px',
            border: '1px solid #333'
          }}>
            <h2 style={{ marginBottom: '20px', color: '#efeff1' }}>⚙️ Настройки OBS</h2>
            
            {createdStream ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* СЕРВЕР */}
                <div>
                  <h3 style={{ marginBottom: '10px', color: '#adadb8', fontSize: '14px' }}>
                    Сервер (Stream Service)
                  </h3>
                  <div style={{
                    display: 'flex',
                    gap: '10px'
                  }}>
                    <input
                      type="text"
                      value="Custom"
                      readOnly
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: '#0e0e10',
                        border: '1px solid #333',
                        borderRadius: '4px',
                        color: '#adadb8',
                        fontSize: '14px'
                      }}
                    />
                    <button 
                      onClick={() => copyToClipboard('Custom')}
                      style={{
                        background: '#333',
                        color: '#efeff1',
                        border: '1px solid #444',
                        padding: '10px 15px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      📋 Копировать
                    </button>
                  </div>
                </div>

                {/* RTMP URL */}
                <div>
                  <h3 style={{ marginBottom: '10px', color: '#adadb8', fontSize: '14px' }}>
                    RTMP URL (Server)
                  </h3>
                  <div style={{
                    display: 'flex',
                    gap: '10px'
                  }}>
                    <input
                      type="text"
                      value={rtmpUrl}
                      readOnly
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: '#0e0e10',
                        border: '1px solid #333',
                        borderRadius: '4px',
                        color: '#adadb8',
                        fontSize: '14px'
                      }}
                    />
                    <button 
                      onClick={() => copyToClipboard(rtmpUrl)}
                      style={{
                        background: '#333',
                        color: '#efeff1',
                        border: '1px solid #444',
                        padding: '10px 15px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      📋 Копировать
                    </button>
                  </div>
                </div>

                {/* STREAM KEY */}
                <div>
                  <h3 style={{ marginBottom: '10px', color: '#adadb8', fontSize: '14px' }}>
                    Ключ потока (Stream Key)
                  </h3>
                  <div style={{
                    display: 'flex',
                    gap: '10px'
                  }}>
                    <input
                      type="text"
                      value={streamKey}
                      readOnly
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: '#0e0e10',
                        border: '1px solid #333',
                        borderRadius: '4px',
                        color: '#adadb8',
                        fontSize: '14px'
                      }}
                    />
                    <button 
                      onClick={() => copyToClipboard(streamKey)}
                      style={{
                        background: '#333',
                        color: '#efeff1',
                        border: '1px solid #444',
                        padding: '10px 15px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      📋 Копировать
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              <div style={{
                padding: '30px',
                textAlign: 'center',
                background: '#0e0e10',
                borderRadius: '4px',
                color: '#adadb8'
              }}>
                <p>Сначала создайте стрим чтобы получить настройки для OBS</p>
              </div>
            )}
          </div>

          {/* ИНФОРМАЦИЯ ДЛЯ ЗРИТЕЛЕЙ */}
          {createdStream && (
            <div style={{
              background: '#18181b',
              borderRadius: '8px',
              padding: '25px',
              border: '1px solid #333'
            }}>
              <h2 style={{ marginBottom: '15px', color: '#efeff1' }}>👁️ Ссылка для зрителей</h2>
              
              <div>
                <h3 style={{ marginBottom: '10px', color: '#adadb8', fontSize: '14px' }}>
                  Ссылка для просмотра
                </h3>
                <div style={{
                  display: 'flex',
                  gap: '10px'
                }}>
                  <input
                    type="text"
                    value={`http://localhost:5173/stream/${createdStream.id}`}
                    readOnly
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: '#0e0e10',
                      border: '1px solid #333',
                      borderRadius: '4px',
                      color: '#adadb8',
                      fontSize: '14px'
                    }}
                  />
                  <button 
                    onClick={() => copyToClipboard(`http://localhost:5173/stream/${createdStream.id}`)}
                    style={{
                      background: '#333',
                      color: '#efeff1',
                      border: '1px solid #444',
                      padding: '10px 15px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    📋 Копировать
                  </button>
                </div>
              </div>

              <div style={{ 
                marginTop: '15px',
                padding: '15px',
                background: '#0e0e10',
                borderRadius: '4px',
                border: '1px solid #333'
              }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#efeff1', fontSize: '14px' }}>
                  💡 Инструкция для OBS:
                </h4>
                <ol style={{ 
                  margin: 0, 
                  paddingLeft: '20px', 
                  color: '#adadb8',
                  fontSize: '12px',
                  lineHeight: '1.5'
                }}>
                  <li>В OBS перейдите в Settings → Stream</li>
                  <li>Service: <strong>Custom</strong></li>
                  <li>Server: <strong>{rtmpUrl}</strong></li>
                  <li>Stream Key: <strong>{streamKey}</strong></li>
                  <li>Нажмите "Start Streaming"</li>
                  <li>Зрители смогут смотреть по ссылке выше</li>
                </ol>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  )
}

export default CreateStream