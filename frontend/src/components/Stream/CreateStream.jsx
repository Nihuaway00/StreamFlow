import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { streamAPI } from '../../services/api'
import { useNavigate } from 'react-router-dom'
import './CreateStream.css'

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
    // Для HTTP сайтов используем старый метод
    const el = document.createElement('textarea')
    el.value = text
    el.setAttribute('readonly', '')
    el.style.position = 'absolute'
    el.style.left = '-9999px'
    document.body.appendChild(el)
    
    // Выделяем текст
    el.select()
    el.setSelectionRange(0, 99999) // Для мобильных
    
    try {
      // Пробуем document.execCommand (работает на HTTP)
      const successful = document.execCommand('copy')
      
      // Создаем красивое уведомление вместо alert
      const notification = document.createElement('div')
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(90deg, #9147ff, #772ce8);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease;
        font-family: inherit;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
      `
      
      if (successful) {
        notification.innerHTML = '<span>✅</span> Скопировано в буфер обмена!'
      } else {
        notification.innerHTML = '<span>📋</span> Текст выделен - скопируйте вручную'
        // Фокус на поле, чтобы пользователь мог скопировать
        el.focus()
      }
      
      document.body.appendChild(notification)
      
      // Автоматически скрываем уведомление через 2 секунды
      setTimeout(() => {
        if (document.body.contains(notification)) {
          notification.style.animation = 'slideOut 0.3s ease'
          setTimeout(() => {
            if (document.body.contains(notification)) {
              document.body.removeChild(notification)
            }
          }, 300)
        }
      }, 2000)
      
    } catch (err) {
      console.error('Ошибка копирования:', err)
      
      // Если совсем не получилось - показываем prompt
      const notification = document.createElement('div')
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff6b6b;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease;
      `
      notification.innerHTML = '<span>❌</span> Скопируйте текст вручную'
      
      document.body.appendChild(notification)
      
      // Показываем текст для копирования
      prompt('Скопируйте текст:', text)
      
      setTimeout(() => {
        if (document.body.contains(notification)) {
          notification.style.animation = 'slideOut 0.3s ease'
          setTimeout(() => {
            if (document.body.contains(notification)) {
              document.body.removeChild(notification)
            }
          }, 300)
        }
      }, 3000)
    } finally {
      // Всегда убираем временный элемент
      document.body.removeChild(el)
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

  const streamKey = createdStream?.stream_key || `live_${user?.username}_${Date.now()}`
  const rtmpUrl = 'http://91.186.197.80:1935/live'

  return (
    <div className="create-stream-page">
      <div className="profile-bg" aria-hidden="true"></div>
      <div className="create-stream-wrapper">
        
        {/* ЗАГОЛОВОК */}
        <div className="glass title-container">
          <div className="title-content">
            <h1>🎥 Начать стрим</h1>
            <p className="subtitle">
              Настройте трансляцию и начните вещание для вашей аудитории
            </p>
          </div>
        </div>

        {/* УВЕДОМЛЕНИЕ О СОЗДАНИИ СТРИМА */}
        {createdStream && (
          <div className="glass success-banner">
            <div className="success-banner-content">
              <div className="success-banner-left">
                <div className="success-icon">✅</div>
                <div>
                  <h3>Стрим успешно создан!</h3>
                  <p className="small-muted">
                    ID стрима: <strong>{createdStream.id.substring(0, 8)}...</strong> | 
                    ID чата: <strong>{createdStream.chat.id.substring(0, 8)}...</strong>
                  </p>
                </div>
              </div>
              <div className="success-banner-actions">
                <button 
                  className="btn btn-primary"
                  onClick={handleGoToStream}
                >
                  <span>🚀</span> Перейти к стриму
                </button>
                <button 
                  className="btn btn-ghost"
                  onClick={() => {
                    localStorage.removeItem('last_created_stream')
                    setCreatedStream(null)
                    setStreamData({ title: '', description: '', theme_ids: [] })
                    setPreviewFile(null)
                    setPreviewPreview(null)
                  }}
                >
                  Создать новый
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ОСНОВНОЙ КОНТЕНТ */}
        <div className="create-stream-grid">
          
          {/* ЛЕВАЯ КОЛОНКА - НАСТРОЙКИ СТРИМА */}
          <div className="create-stream-column">
            
            {/* ОСНОВНЫЕ НАСТРОЙКИ */}
            <div className="glass settings-block">
              <h2 className="settings-title">
                <span className="settings-icon">📝</span>
                Основные настройки
              </h2>
              
              <div className="settings-form">
                
                {/* НАЗВАНИЕ СТРИМА */}
                <div className="form-field">
                  <label>Название стрима *</label>
                  <input
                    type="text"
                    name="title"
                    value={streamData.title}
                    onChange={handleInputChange}
                    placeholder="Введите захватывающее название..."
                    className="form-input"
                  />
                  {streamData.title && (
                    <div className="char-counter">
                      {streamData.title.length}/100 символов
                    </div>
                  )}
                </div>

                {/* ОПИСАНИЕ */}
                <div className="form-field">
                  <label>Описание</label>
                  <textarea
                    name="description"
                    value={streamData.description}
                    onChange={handleInputChange}
                    placeholder="Опишите что будет происходить в стриме..."
                    rows="5"
                    className="form-textarea"
                  />
                  {streamData.description && (
                    <div className="char-counter">
                      {streamData.description.length}/500 символов
                    </div>
                  )}
                </div>

                {/* ПРЕВЬЮ КАРТИНКА */}
                <div className="form-field">
                  <label>Превью-картинка</label>
                  
                  <div className="preview-upload">
                    {previewPreview ? (
                      <div className="preview-container">
                        <img
                          src={previewPreview}
                          alt="Превью"
                          className="preview-image"
                        />
                        <button
                          onClick={() => {
                            setPreviewFile(null)
                            setPreviewPreview(null)
                          }}
                          className="preview-remove"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div
                        className="preview-placeholder"
                        onClick={() => document.getElementById('preview-input').click()}
                      >
                        <div className="placeholder-icon">🖼️</div>
                        <div>Нажмите для загрузки превью</div>
                        <div className="placeholder-hint">
                          Рекомендуется 1280x720
                        </div>
                      </div>
                    )}
                    
                    <input
                      id="preview-input"
                      type="file"
                      accept="image/*"
                      className="file-input"
                      onChange={handlePreviewSelect}
                    />
                    
                    {previewFile && (
                      <div className="file-info">
                        <span>✅</span>
                        Выбран файл: {previewFile.name} ({(previewFile.size / 1024).toFixed(1)} KB)
                      </div>
                    )}
                    
                    {!previewFile && (
                      <div className="file-hint">
                        Необязательно. Если не загрузить, будет установлено изображение по умолчанию.
                      </div>
                    )}
                  </div>
                </div>

                {/* ТЕМАТИКИ */}
                <div className="form-field">
                  <label>Тематики</label>
                  {themesLoading ? (
                    <div className="loading-themes">
                      <div className="spinner"></div>
                      Загрузка тематик...
                    </div>
                  ) : (
                    <div className="themes-grid">
                      {themes.map(theme => (
                        <div
                          key={theme.id}
                          className={`theme-card ${streamData.theme_ids.includes(theme.id) ? 'selected' : ''}`}
                          onClick={() => handleThemeToggle(theme.id)}
                          style={{
                            borderColor: streamData.theme_ids.includes(theme.id) 
                              ? getThemeColor(theme.name) 
                              : 'rgba(255, 255, 255, 0.1)',
                            background: streamData.theme_ids.includes(theme.id) 
                              ? `${getThemeColor(theme.name)}20` 
                              : 'rgba(255, 255, 255, 0.05)'
                          }}
                        >
                          <div 
                            className="theme-icon"
                            style={{
                              background: streamData.theme_ids.includes(theme.id)
                                ? getThemeColor(theme.name)
                                : 'rgba(255, 255, 255, 0.1)'
                            }}
                          >
                            {theme.name === 'gaming' ? '🎮' :
                             theme.name === 'music' ? '🎵' :
                             theme.name === 'just_chatting' ? '💬' :
                             theme.name === 'art' ? '🎨' :
                             theme.name === 'sports' ? '⚽' :
                             theme.name === 'technology' ? '💻' : '📌'}
                          </div>
                          <span className="theme-name">
                            {getThemeDisplayName(theme.name)}
                          </span>
                          {streamData.theme_ids.includes(theme.id) && (
                            <div 
                              className="theme-check"
                              style={{ background: getThemeColor(theme.name) }}
                            >
                              ✓
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {streamData.theme_ids.length > 0 && (
                    <div className="themes-selected">
                      <span>✅</span>
                      Выбрано: {streamData.theme_ids.length} тематик
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* КНОПКА ЗАПУСКА */}
            <button 
              onClick={handleStartStream}
              disabled={!streamData.title.trim() || loading || createdStream}
              className="start-stream-btn"
            >
              {loading ? (
                <>
                  <div className="btn-spinner"></div>
                  Создание стрима...
                </>
              ) : createdStream ? (
                <>
                  <span className="btn-icon">✅</span>
                  Стрим создан
                </>
              ) : (
                <>
                  <span className="btn-icon">🎥</span>
                  Создать стрим
                </>
              )}
            </button>

          </div>

          {/* ПРАВАЯ КОЛОНКА - НАСТРОЙКИ OBS */}
          <div className="create-stream-column">
            
            {/* НАСТРОЙКИ OBS */}
            <div className="glass obs-settings">
              <h2 className="obs-title">
                <span className="obs-icon">⚙️</span>
                Настройки OBS
              </h2>
              
              {createdStream ? (
                <div className="obs-content">
                  
                  {/* ИНФОРМАЦИЯ О СТРИМЕ */}
                  <div className="stream-info-card">
                    <div className="stream-info-header">
                      <div className="stream-info-icon">📺</div>
                      <div>
                        <div className="stream-info-title">
                          {createdStream.title}
                        </div>
                        <div className="stream-info-subtitle">
                          ID: {createdStream.id.substring(0, 8)}...
                        </div>
                      </div>
                    </div>
                    <div className="stream-info-status">
                      Статус: <span className="status-live">{createdStream.status}</span> | 
                      Чат: <span className="status-chat">{createdStream.chat.id.substring(0, 8)}...</span>
                    </div>
                  </div>
                  
                  {/* СЕРВЕР */}
                  <div className="obs-field">
                    <label>
                      <span className="field-icon">🔗</span>
                      Сервер (Stream Service)
                    </label>
                    <div className="field-with-button">
                      <input
                        type="text"
                        value="Custom"
                        readOnly
                        className="obs-input"
                      />
                      <button 
                        onClick={() => copyToClipboard('Custom')}
                        className="copy-btn"
                      >
                        <span>📋</span>
                        Копировать
                      </button>
                    </div>
                  </div>

                  {/* RTMP URL */}
                  <div className="obs-field">
                    <label>
                      <span className="field-icon">📡</span>
                      RTMP URL (Server)
                    </label>
                    <div className="field-with-button">
                      <input
                        type="text"
                        value={rtmpUrl}
                        readOnly
                        className="obs-input"
                      />
                      <button 
                        onClick={() => copyToClipboard(rtmpUrl)}
                        className="copy-btn"
                      >
                        <span>📋</span>
                        Копировать
                      </button>
                    </div>
                  </div>

                  {/* STREAM KEY */}
                  <div className="obs-field">
                    <label>
                      <span className="field-icon">🔑</span>
                      Ключ потока (Stream Key)
                    </label>
                    <div className="field-with-button">
                      <input
                        type="text"
                        value={streamKey}
                        readOnly
                        className="obs-input"
                      />
                      <button 
                        onClick={() => copyToClipboard(streamKey)}
                        className="copy-btn"
                      >
                        <span>📋</span>
                        Копировать
                      </button>
                    </div>
                    <div className="field-warning">
                      ⚠️ Никому не сообщайте этот ключ!
                    </div>
                  </div>

                </div>
              ) : (
                <div className="obs-placeholder">
                  <div className="placeholder-icon-large">⚙️</div>
                  <p>Сначала создайте стрим чтобы получить настройки для OBS</p>
                  <p className="placeholder-subtext">
                    После создания стрима здесь появятся данные для настройки трансляции
                  </p>
                </div>
              )}
            </div>

            {/* ИНФОРМАЦИЯ ДЛЯ ЗРИТЕЛЕЙ */}
            {createdStream && (
              <div className="glass viewer-info">
                <h2 className="viewer-title">
                  <span className="viewer-icon">👁️</span>
                  Ссылка для зрителей
                </h2>
                
                <div className="viewer-field">
                  <label>Ссылка для просмотра</label>
                  <div className="field-with-button">
                    <input
                      type="text"
                      value={`${window.location.origin}/stream/${createdStream.id}`}
                      readOnly
                      className="viewer-input"
                    />
                    <button 
                      onClick={() => copyToClipboard(`${window.location.origin}/stream/${createdStream.id}`)}
                      className="copy-btn purple"
                    >
                      <span>📋</span>
                      Копировать
                    </button>
                  </div>
                </div>

                <div className="instructions">
                  <h4 className="instructions-title">
                    <span className="instructions-icon">💡</span>
                    Инструкция для OBS:
                  </h4>
                  <ol className="instructions-list">
                    <li>В OBS перейдите в <strong>Settings → Stream</strong></li>
                    <li>Service: <strong>Custom</strong></li>
                    <li>Server: <strong>{rtmpUrl}</strong></li>
                    <li>Stream Key: <strong>{streamKey}</strong></li>
                    <li>Нажмите <strong>"Start Streaming"</strong></li>
                    <li>Зрители смогут смотреть по ссылке выше</li>
                  </ol>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  )
}

export default CreateStream