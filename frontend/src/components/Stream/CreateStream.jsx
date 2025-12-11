import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { streamAPI } from '../../services/api'
import { useNavigate } from 'react-router-dom'

const CreateStream = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [streamData, setStreamData] = useState({
    title: '',
    description: '',
    theme_ids: []
  })
  const [previewFile, setPreviewFile] = useState(null)
  const [previewPreview, setPreviewPreview] = useState(null)
  const [themes, setThemes] = useState([])
  const [loading, setLoading] = useState(false)
  const [themesLoading, setThemesLoading] = useState(true)
  const [createdStream, setCreatedStream] = useState(null)

  // Загружаем тематики при монтировании
  useEffect(() => {
    const fetchThemes = async () => {
      try {
        const response = await streamAPI.getThemes()
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
        ? prev.theme_ids.filter(id => id !== themeId)
        : [...prev.theme_ids, themeId]
    }))
  }

  // Обработчик выбора превью-картинки
  const handlePreviewSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Файл слишком большой. Максимальный размер: 5MB')
        return
      }

      if (!file.type.startsWith('image/')) {
        alert('Пожалуйста, выберите изображение')
        return
      }

      setPreviewFile(file)
      const previewUrl = URL.createObjectURL(file)
      setPreviewPreview(previewUrl)
      
      console.log('✅ Превью выбрано:', file.name)
    }
  }

  const handleStartStream = async () => {
    if (!streamData.title.trim()) {
      alert('Введите название стрима')
      return
    }

    setLoading(true)
    try {
      // Создаем FormData для отправки файла
      const formData = new FormData()
      formData.append('title', streamData.title)
      
      // Добавляем описание, если есть
      if (streamData.description) {
        formData.append('description', streamData.description)
      }
      
      // Добавляем тематики - пробуем разные форматы
      if (streamData.theme_ids.length > 0) {
        // Формат 1: строка через запятую (как в документации)
        formData.append('theme_ids', streamData.theme_ids.join(','))
        
        // Дополнительно: попробуем отправить как массив
        // formData.append('theme_ids', JSON.stringify(streamData.theme_ids))
      }
      
      // Добавляем файл превью, если выбран
      if (previewFile) {
        formData.append('preview', previewFile)
        console.log('📤 Добавляю файл превью:', previewFile.name, 'type:', previewFile.type)
      }
      
      console.log('🔄 Отправка данных стрима...')
      console.log('FormData содержимое:')
      for (let pair of formData.entries()) {
        console.log(pair[0], ':', pair[1])
      }

      // Отправляем запрос
      const response = await streamAPI.createStream(formData)
      
      const createdStreamData = response.data
      setCreatedStream(createdStreamData)
      
      // Сохраняем данные
      localStorage.setItem('last_created_stream', JSON.stringify({
        stream_id: createdStreamData.id,
        chat_id: createdStreamData.chat.id,
        title: createdStreamData.title,
        stream_key: createdStreamData.stream_key,
        rtmp_url: createdStreamData.rtmp_url,
        hls_url: createdStreamData.hls_url,
        preview_url: createdStreamData.preview_url,
        created_at: new Date().toISOString()
      }))
      
      console.log('✅ Стрим создан! Данные:', createdStreamData)
      
      // Показываем уведомление
      const shouldRedirect = window.confirm(
        `✅ Стрим "${createdStreamData.title}" успешно создан!\n\n` +
        `Перейти на страницу стрима?`
      )
      
      if (shouldRedirect) {
        navigate(`/stream/${createdStreamData.id}`)
      }
      
    } catch (error) {
      console.error('❌ Ошибка создания стрима:', error)
      
      // Детально выводим ошибку
      console.error('Детали ошибки:', {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers
      })
      
      let errorMessage = 'Ошибка создания стрима.'
      
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail.map(d => d.msg).join(', ')
        } else {
          errorMessage = error.response.data.detail
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      }
      
      alert(`❌ ${errorMessage}`)
      
      // Добавляем отладочную информацию
      if (process.env.NODE_ENV === 'development') {
        console.log('Отладочная информация о запросе:')
        console.log('Stream data:', streamData)
        console.log('Preview file:', previewFile)
      }
    } finally {
      setLoading(false)
    }
  }

  // Кнопка перехода к созданному стриму
  const handleGoToStream = () => {
    if (createdStream) {
      navigate(`/stream/${createdStream.id}`)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    alert('✅ Скопировано в буфер обмена!')
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

  const streamKey = createdStream?.stream_key || `live_${user?.username}_${Date.now()}`
  const rtmpUrl = createdStream?.rtmp_url || 'rtmp://localhost:1935/live'
  const hlsUrl = createdStream?.hls_url || `http://localhost:8080/live/${streamKey}/index.m3u8`

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '1200px', 
      margin: '0 auto',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0e0e10 0%, #18181b 100%)'
    }}>
      
      {/* ЗАГОЛОВОК */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '40px',
        paddingTop: '20px'
      }}>
        <h1 style={{ 
          fontSize: '36px', 
          marginBottom: '10px',
          background: 'linear-gradient(90deg, #9147ff, #00ff7f)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 'bold'
        }}>
          🎥 Начать стрим
        </h1>
        <p style={{ 
          color: '#adadb8', 
          fontSize: '18px',
          maxWidth: '600px',
          margin: '0 auto',
          lineHeight: '1.5'
        }}>
          Настройте трансляцию и начните вещание для вашей аудитории
        </p>
      </div>

      {createdStream && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(145, 71, 255, 0.1), rgba(0, 255, 127, 0.1))',
          border: '1px solid rgba(145, 71, 255, 0.3)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '30px',
          animation: 'fadeIn 0.5s ease-out'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '15px'
          }}>
            <div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px',
                marginBottom: '8px'
              }}>
                <span style={{ 
                  fontSize: '24px', 
                  animation: 'pulse 2s infinite' 
                }}>✅</span>
                <h3 style={{ 
                  margin: 0, 
                  color: '#00ff7f',
                  fontSize: '20px'
                }}>
                  Стрим успешно создан!
                </h3>
              </div>
              <p style={{ 
                margin: 0, 
                color: '#adadb8',
                fontSize: '14px'
              }}>
                ID стрима: <strong style={{ color: '#fff' }}>{createdStream.id}</strong> | 
                ID чата: <strong style={{ color: '#fff' }}>{createdStream.chat.id}</strong>
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleGoToStream}
                style={{
                  background: 'linear-gradient(90deg, #9147ff, #772ce8)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                <span>🚀</span>
                Перейти к стриму
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('last_created_stream')
                  setCreatedStream(null)
                  setStreamData({ title: '', description: '', theme_ids: [] })
                  setPreviewFile(null)
                  setPreviewPreview(null)
                }}
                style={{
                  background: 'transparent',
                  color: '#ff6b6b',
                  border: '1px solid #ff6b6b',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.2s'
                }}
              >
                Создать новый
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '30px',
        '@media (max-width: 900px)': {
          gridTemplateColumns: '1fr'
        }
      }}>
        
        {/* ЛЕВАЯ КОЛОНКА - НАСТРОЙКИ СТРИМА */}
        <div>
          
          {/* ОСНОВНЫЕ НАСТРОЙКИ */}
          <div style={{
            background: 'rgba(24, 24, 27, 0.8)',
            borderRadius: '12px',
            padding: '25px',
            marginBottom: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)'
          }}>
            <h2 style={{ 
              marginBottom: '20px', 
              color: '#efeff1',
              fontSize: '22px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '24px' }}>📝</span>
              Основные настройки
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* НАЗВАНИЕ СТРИМА */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '10px', 
                  color: '#adadb8',
                  fontWeight: '600',
                  fontSize: '14px'
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
                    padding: '14px',
                    background: 'rgba(14, 14, 16, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '16px',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => e.target.style.border = '1px solid #9147ff'}
                />
                {streamData.title && (
                  <div style={{
                    fontSize: '12px',
                    color: '#666',
                    marginTop: '6px'
                  }}>
                    {streamData.title.length}/100 символов
                  </div>
                )}
              </div>

              {/* ОПИСАНИЕ */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '10px', 
                  color: '#adadb8',
                  fontWeight: '600',
                  fontSize: '14px'
                }}>
                  Описание
                </label>
                <textarea
                  name="description"
                  value={streamData.description}
                  onChange={handleInputChange}
                  placeholder="Опишите что будет происходить в стриме..."
                  rows="5"
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: 'rgba(14, 14, 16, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '16px',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    minHeight: '120px'
                  }}
                />
                {streamData.description && (
                  <div style={{
                    fontSize: '12px',
                    color: '#666',
                    marginTop: '6px'
                  }}>
                    {streamData.description.length}/500 символов
                  </div>
                )}
              </div>

              {/* ПРЕВЬЮ КАРТИНКА */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '10px', 
                  color: '#adadb8',
                  fontWeight: '600',
                  fontSize: '14px'
                }}>
                  Превью-картинка
                </label>
                
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '15px'
                }}>
                  {previewPreview ? (
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      maxWidth: '320px',
                      aspectRatio: '16/9',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '2px solid rgba(145, 71, 255, 0.5)'
                    }}>
                      <img
                        src={previewPreview}
                        alt="Превью"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                      <button
                        onClick={() => {
                          setPreviewFile(null)
                          setPreviewPreview(null)
                        }}
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: 'rgba(255, 107, 107, 0.9)',
                          color: 'white',
                          border: 'none',
                          width: '30px',
                          height: '30px',
                          borderRadius: '50%',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => document.getElementById('preview-input').click()}
                      style={{
                        width: '100%',
                        maxWidth: '320px',
                        aspectRatio: '16/9',
                        background: 'rgba(14, 14, 16, 0.5)',
                        border: '2px dashed rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        color: '#adadb8'
                      }}
                      onMouseEnter={(e) => e.target.style.background = 'rgba(14, 14, 16, 0.7)'}
                      onMouseLeave={(e) => e.target.style.background = 'rgba(14, 14, 16, 0.5)'}
                    >
                      <div style={{ fontSize: '40px', marginBottom: '10px' }}>🖼️</div>
                      <div>Нажмите для загрузки превью</div>
                      <div style={{ fontSize: '12px', marginTop: '5px', color: '#666' }}>
                        Рекомендуется 1280x720
                      </div>
                    </div>
                  )}
                  
                  <input
                    id="preview-input"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handlePreviewSelect}
                  />
                  
                  {previewFile && (
                    <div style={{
                      fontSize: '13px',
                      color: '#00ff7f',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      <span>✅</span>
                      <span>Выбран файл: {previewFile.name} ({(previewFile.size / 1024).toFixed(1)} KB)</span>
                    </div>
                  )}
                  
                  {!previewFile && (
                    <div style={{
                      fontSize: '12px',
                      color: '#666',
                      fontStyle: 'italic'
                    }}>
                      Необязательно. Если не загрузить, будет установлено изображение по умолчанию.
                    </div>
                  )}
                </div>
              </div>

              {/* ТЕМАТИКИ */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '10px', 
                  color: '#adadb8',
                  fontWeight: '600',
                  fontSize: '14px'
                }}>
                  Тематики
                </label>
                {themesLoading ? (
                  <div style={{
                    padding: '20px',
                    textAlign: 'center',
                    color: '#adadb8',
                    background: 'rgba(14, 14, 16, 0.5)',
                    borderRadius: '8px'
                  }}>
                    <div style={{
                      display: 'inline-block',
                      width: '20px',
                      height: '20px',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderTopColor: '#9147ff',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      marginRight: '10px'
                    }} />
                    Загрузка тематик...
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                    gap: '10px'
                  }}>
                    {themes.map(theme => (
                      <div
                        key={theme.id}
                        onClick={() => handleThemeToggle(theme.id)}
                        style={{
                          background: streamData.theme_ids.includes(theme.id) 
                            ? `${getThemeColor(theme.name)}20` 
                            : 'rgba(255, 255, 255, 0.05)',
                          border: `1px solid ${streamData.theme_ids.includes(theme.id) 
                            ? getThemeColor(theme.name) 
                            : 'rgba(255, 255, 255, 0.1)'}`,
                          borderRadius: '8px',
                          padding: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center',
                          gap: '8px'
                        }}
                        onMouseEnter={(e) => {
                          if (!streamData.theme_ids.includes(theme.id)) {
                            e.target.style.background = 'rgba(255, 255, 255, 0.1)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!streamData.theme_ids.includes(theme.id)) {
                            e.target.style.background = 'rgba(255, 255, 255, 0.05)'
                          }
                        }}
                      >
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          background: streamData.theme_ids.includes(theme.id)
                            ? getThemeColor(theme.name)
                            : 'rgba(255, 255, 255, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px'
                        }}>
                          {theme.name === 'gaming' ? '🎮' :
                           theme.name === 'music' ? '🎵' :
                           theme.name === 'just_chatting' ? '💬' :
                           theme.name === 'art' ? '🎨' :
                           theme.name === 'sports' ? '⚽' :
                           theme.name === 'technology' ? '💻' : '📌'}
                        </div>
                        <span style={{ 
                          color: streamData.theme_ids.includes(theme.id) 
                            ? getThemeColor(theme.name) 
                            : 'white',
                          fontSize: '13px',
                          fontWeight: '500'
                        }}>
                          {getThemeDisplayName(theme.name)}
                        </span>
                        {streamData.theme_ids.includes(theme.id) && (
                          <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: getThemeColor(theme.name),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            color: 'white',
                            marginTop: '5px'
                          }}>
                            ✓
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {streamData.theme_ids.length > 0 && (
                  <div style={{
                    fontSize: '12px',
                    color: '#00ff7f',
                    marginTop: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    <span>✅</span>
                    <span>Выбрано: {streamData.theme_ids.length} тематик</span>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* КНОПКА ЗАПУСКА */}
          <button 
            onClick={handleStartStream}
            disabled={!streamData.title.trim() || loading || createdStream}
            style={{
              width: '100%',
              background: (!streamData.title.trim() || loading || createdStream) 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'linear-gradient(90deg, #9147ff, #772ce8)',
              color: (!streamData.title.trim() || loading || createdStream) 
                ? '#666' 
                : 'white',
              border: 'none',
              padding: '18px',
              borderRadius: '10px',
              cursor: (!streamData.title.trim() || loading || createdStream) 
                ? 'not-allowed' 
                : 'pointer',
              fontSize: '18px',
              fontWeight: 'bold',
              transition: 'all 0.3s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
            onMouseEnter={(e) => {
              if (streamData.title.trim() && !loading && !createdStream) {
                e.target.style.transform = 'translateY(-3px)'
                e.target.style.boxShadow = '0 10px 25px rgba(145, 71, 255, 0.3)'
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = 'none'
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTopColor: 'white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Создание стрима...
              </>
            ) : createdStream ? (
              <>
                <span style={{ fontSize: '20px' }}>✅</span>
                Стрим создан
              </>
            ) : (
              <>
                <span style={{ fontSize: '20px' }}>🎥</span>
                Создать стрим
              </>
            )}
          </button>

        </div>

        {/* ПРАВАЯ КОЛОНКА - НАСТРОЙКИ OBS */}
        <div>
          
          {/* НАСТРОЙКИ OBS */}
          <div style={{
            background: 'rgba(24, 24, 27, 0.8)',
            borderRadius: '12px',
            padding: '25px',
            marginBottom: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            height: '100%'
          }}>
            <h2 style={{ 
              marginBottom: '20px', 
              color: '#efeff1',
              fontSize: '22px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '24px' }}>⚙️</span>
              Настройки OBS
            </h2>
            
            {createdStream ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* ИНФОРМАЦИЯ О СТРИМЕ */}
                <div style={{
                  background: 'rgba(14, 14, 16, 0.5)',
                  borderRadius: '8px',
                  padding: '15px',
                  border: '1px solid rgba(145, 71, 255, 0.2)'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px',
                    marginBottom: '10px'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      background: 'linear-gradient(45deg, #9147ff, #772ce8)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      color: 'white'
                    }}>
                      📺
                    </div>
                    <div>
                      <div style={{ 
                        color: 'white', 
                        fontSize: '16px',
                        fontWeight: 'bold'
                      }}>
                        {createdStream.title}
                      </div>
                      <div style={{ 
                        color: '#adadb8', 
                        fontSize: '12px',
                        marginTop: '2px'
                      }}>
                        ID: {createdStream.id.substring(0, 8)}...
                      </div>
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: '11px', 
                    color: '#666',
                    marginTop: '10px'
                  }}>
                    Статус: <span style={{ 
                      color: '#00ff7f',
                      fontWeight: 'bold'
                    }}>{createdStream.status}</span> | 
                    Чат: <span style={{ 
                      color: '#9147ff',
                      fontWeight: 'bold'
                    }}>{createdStream.chat.id.substring(0, 8)}...</span>
                  </div>
                </div>
                
                {/* СЕРВЕР */}
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '10px', 
                    color: '#adadb8',
                    fontWeight: '600',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>🔗</span>
                    Сервер (Stream Service)
                  </label>
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
                        padding: '14px',
                        background: 'rgba(14, 14, 16, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: '#adadb8',
                        fontSize: '14px'
                      }}
                    />
                    <button 
                      onClick={() => copyToClipboard('Custom')}
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: '#efeff1',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        padding: '14px 20px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.15)'}
                      onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
                    >
                      <span>📋</span>
                      Копировать
                    </button>
                  </div>
                </div>

                {/* RTMP URL */}
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '10px', 
                    color: '#adadb8',
                    fontWeight: '600',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>📡</span>
                    RTMP URL (Server)
                  </label>
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
                        padding: '14px',
                        background: 'rgba(14, 14, 16, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: '#adadb8',
                        fontSize: '14px',
                        fontFamily: 'monospace'
                      }}
                    />
                    <button 
                      onClick={() => copyToClipboard(rtmpUrl)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: '#efeff1',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        padding: '14px 20px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.15)'}
                      onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
                    >
                      <span>📋</span>
                      Копировать
                    </button>
                  </div>
                </div>

                {/* STREAM KEY */}
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '10px', 
                    color: '#adadb8',
                    fontWeight: '600',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>🔑</span>
                    Ключ потока (Stream Key)
                  </label>
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
                        padding: '14px',
                        background: 'rgba(14, 14, 16, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: '#adadb8',
                        fontSize: '14px',
                        fontFamily: 'monospace'
                      }}
                    />
                    <button 
                      onClick={() => copyToClipboard(streamKey)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: '#efeff1',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        padding: '14px 20px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.15)'}
                      onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
                    >
                      <span>📋</span>
                      Копировать
                    </button>
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#666',
                    marginTop: '8px',
                    paddingLeft: '5px'
                  }}>
                    ⚠️ Никому не сообщайте этот ключ!
                  </div>
                </div>

              </div>
            ) : (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                background: 'rgba(14, 14, 16, 0.5)',
                borderRadius: '8px',
                color: '#adadb8',
                border: '2px dashed rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ 
                  fontSize: '48px', 
                  marginBottom: '15px',
                  opacity: 0.5
                }}>
                  ⚙️
                </div>
                <p style={{ 
                  margin: '0 0 15px 0',
                  fontSize: '16px'
                }}>
                  Сначала создайте стрим чтобы получить настройки для OBS
                </p>
                <p style={{ 
                  fontSize: '14px',
                  color: '#666'
                }}>
                  После создания стрима здесь появятся данные для настройки трансляции
                </p>
              </div>
            )}
          </div>

          {/* ИНФОРМАЦИЯ ДЛЯ ЗРИТЕЛЕЙ */}
          {createdStream && (
            <div style={{
              background: 'rgba(24, 24, 27, 0.8)',
              borderRadius: '12px',
              padding: '25px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              marginTop: '20px'
            }}>
              <h2 style={{ 
                marginBottom: '15px', 
                color: '#efeff1',
                fontSize: '22px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{ fontSize: '24px' }}>👁️</span>
                Ссылка для зрителей
              </h2>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '10px', 
                  color: '#adadb8',
                  fontWeight: '600',
                  fontSize: '14px'
                }}>
                  Ссылка для просмотра
                </label>
                <div style={{
                  display: 'flex',
                  gap: '10px'
                }}>
                  <input
                    type="text"
                    value={`${window.location.origin}/stream/${createdStream.id}`}
                    readOnly
                    style={{
                      flex: 1,
                      padding: '14px',
                      background: 'rgba(14, 14, 16, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#adadb8',
                      fontSize: '14px'
                    }}
                  />
                  <button 
                    onClick={() => copyToClipboard(`${window.location.origin}/stream/${createdStream.id}`)}
                    style={{
                      background: 'rgba(145, 71, 255, 0.2)',
                      color: '#9147ff',
                      border: '1px solid rgba(145, 71, 255, 0.3)',
                      padding: '14px 20px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(145, 71, 255, 0.3)'
                      e.target.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(145, 71, 255, 0.2)'
                      e.target.style.transform = 'translateY(0)'
                    }}
                  >
                    <span>📋</span>
                    Копировать
                  </button>
                </div>
              </div>

              <div style={{ 
                marginTop: '20px',
                padding: '20px',
                background: 'rgba(14, 14, 16, 0.5)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <h4 style={{ 
                  margin: '0 0 15px 0', 
                  color: '#efeff1', 
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span style={{ fontSize: '20px' }}>💡</span>
                  Инструкция для OBS:
                </h4>
                <ol style={{ 
                  margin: 0, 
                  paddingLeft: '25px', 
                  color: '#adadb8',
                  fontSize: '14px',
                  lineHeight: '1.6'
                }}>
                  <li style={{ marginBottom: '8px' }}>В OBS перейдите в <strong>Settings → Stream</strong></li>
                  <li style={{ marginBottom: '8px' }}>Service: <strong>Custom</strong></li>
                  <li style={{ marginBottom: '8px' }}>Server: <strong>{rtmpUrl}</strong></li>
                  <li style={{ marginBottom: '8px' }}>Stream Key: <strong>{streamKey}</strong></li>
                  <li style={{ marginBottom: '8px' }}>Нажмите <strong>"Start Streaming"</strong></li>
                  <li>Зрители смогут смотреть по ссылке выше</li>
                </ol>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* ОТЛАДОЧНАЯ ИНФОРМАЦИЯ */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          marginTop: '30px',
          padding: '15px',
          background: 'rgba(14, 14, 16, 0.5)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          fontSize: '12px',
          color: '#666',
          fontFamily: 'monospace'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px'
          }}>
            <span>DEBUG INFO</span>
            <button 
              onClick={() => {
                console.log('Stream Data:', {
                  form: streamData,
                  created: createdStream,
                  previewFile: previewFile,
                  localStorage: localStorage.getItem('last_created_stream')
                })
              }}
              style={{
                background: 'transparent',
                color: '#666',
                border: '1px solid #666',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              Console Log
            </button>
          </div>
          <div style={{ wordBreak: 'break-all' }}>
            {createdStream ? `Chat ID: ${createdStream.chat.id} | Preview URL: ${createdStream.preview_url || 'нет'}` : 'No stream created'}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        * {
          box-sizing: border-box;
        }
        
        body {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #0e0e10;
        }
        
        input, textarea, button {
          font-family: inherit;
        }
        
        input:focus, textarea:focus {
          outline: none;
          border-color: #9147ff !important;
          box-shadow: 0 0 0 2px rgba(145, 71, 255, 0.2);
        }
      `}</style>
    </div>
  )
}

export default CreateStream