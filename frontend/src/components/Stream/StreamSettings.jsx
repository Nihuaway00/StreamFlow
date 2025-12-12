import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { streamAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import './StreamSettings.css'

const StreamSettings = () => {
  const { streamId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [stream, setStream] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editLoading, setEditLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [themes, setThemes] = useState([])
  const [previewFile, setPreviewFile] = useState(null)
  const [previewPreview, setPreviewPreview] = useState(null)
  
  // Форма редактирования
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    theme_ids: []
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [streamResponse, themesResponse] = await Promise.all([
          streamAPI.getStream(streamId),
          streamAPI.getThemes()
        ])
        
        const streamData = streamResponse.data
        setStream(streamData)
        setThemes(themesResponse.data)
        
        // Проверяем, является ли пользователь владельцем
        if (user?.id !== streamData.author?.id) {
          navigate('/')
          return
        }
        
        // Заполняем форму данными стрима
        setFormData({
          title: streamData.title || '',
          description: streamData.description || '',
          theme_ids: streamData.themes?.map(theme => theme.id) || []
        })
        
        // Загружаем превью если есть
        if (streamData.preview_url) {
          try {
            // Получаем URL превью
            const response = await streamAPI.getFileUrl(streamData.preview_url)
            let url = response.data
            if (url && url.includes('storage:9000')) {
              url = url.replace('storage:9000', 'localhost:9000')
            }
            setPreviewPreview(url)
          } catch (error) {
            console.error('Ошибка загрузки превью:', error)
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err)
        navigate('/')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [streamId, user, navigate])

  // Функция для извлечения file_key из URL
  const extractFileKey = (avatarUrl) => {
    if (!avatarUrl) {
      console.log('❌ avatarUrl пустой')
      return null
    }
    
    console.log('🔍 Извлечение file_key из:', avatarUrl)
    
    if (typeof avatarUrl === 'string' && 
      !avatarUrl.includes('://') && 
      !avatarUrl.startsWith('/')) {
      console.log('✅ Это уже file_key:', avatarUrl)
      return avatarUrl
    }
    
    try {
      if (avatarUrl.startsWith('/')) {
        const path = avatarUrl.substring(1)
        console.log('📁 Извлечен из относительного пути:', path)
        return path
      }
      
      const url = new URL(avatarUrl)
      let path = url.pathname.substring(1)
      console.log('📁 Извлечен из URL:', path)
      return path
    } catch (error) {
      console.error('❌ Ошибка парсинга URL:', error)
      return avatarUrl
    }
  }

  // Обработчик изменения полей формы
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Обработчик изменения тематик
  const handleThemeChange = (themeId) => {
    setFormData(prev => ({
      ...prev,
      theme_ids: prev.theme_ids.includes(themeId)
        ? prev.theme_ids.filter(id => id !== themeId)
        : [...prev.theme_ids, themeId]
    }))
  }

  // Обработчик выбора превью
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
      
      console.log('✅ Новое превью выбрано:', file.name)
    }
  }

  // Функция для сохранения изменений
  const handleSaveChanges = async () => {
    if (!formData.title.trim()) {
      alert('Название стрима не может быть пустым')
      return
    }

    try {
      setEditLoading(true)
      
      // Используем FormData для отправки файлов
      const updateData = new FormData()
      updateData.append('title', formData.title)
      
      // Добавляем description только если он есть (может быть пустой строкой)
      updateData.append('description', formData.description || '')
      
      // Добавляем theme_ids только если они есть
      if (formData.theme_ids.length > 0) {
        // Создаем строку из ID тем, разделенных запятыми
        updateData.append('theme_ids', formData.theme_ids.join(','))
      }
      
      // Добавляем новое превью если выбрано
      if (previewFile) {
        updateData.append('preview', previewFile)
      }
      
      console.log('🔄 Отправка обновления стрима...')
      console.log('Данные для отправки:')
      console.log('- title:', formData.title)
      console.log('- description:', formData.description)
      console.log('- theme_ids:', formData.theme_ids.join(','))
      console.log('- preview файл:', previewFile ? 'есть' : 'нет')

      const response = await streamAPI.updateStream(streamId, updateData)
      setStream(response.data)
      
      // Обновляем превью если оно изменилось
      if (response.data.preview_url) {
        try {
          const fileKey = extractFileKey(response.data.preview_url)
          if (fileKey) {
            const fileResponse = await streamAPI.getFileUrl(fileKey)
            let url = fileResponse.data
            if (url && url.includes('storage:9000')) {
              url = url.replace('storage:9000', 'localhost:9000')
            }
            setPreviewPreview(url)
          }
        } catch (error) {
          console.error('Ошибка загрузки нового превью:', error)
        }
      }
      
      setPreviewFile(null)
      alert('✅ Изменения успешно сохранены!')
    } catch (err) {
      console.error('❌ Ошибка при обновлении стрима:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        headers: err.response?.headers
      })
      alert('❌ Ошибка при сохранении изменений. Проверьте данные и попробуйте снова.')
    } finally {
      setEditLoading(false)
    }
  }

  // Функция для удаления превью
  const handleDeletePreview = async () => {
    if (!window.confirm('Удалить превью-картинку?')) {
      return
    }

    try {
      setEditLoading(true)
      const updateData = new FormData()
      updateData.append('title', formData.title)
      updateData.append('description', formData.description || '')
      
      // Добавляем theme_ids только если они есть
      if (formData.theme_ids.length > 0) {
        updateData.append('theme_ids', formData.theme_ids.join(','))
      }
      
      // Для удаления превью отправляем специальный флаг
      updateData.append('remove_preview', 'true')
      
      console.log('🔄 Отправка запроса на удаление превью...')
      const response = await streamAPI.updateStream(streamId, updateData)
      setStream(response.data)
      setPreviewPreview(null)
      alert('✅ Превью удалено!')
    } catch (err) {
      console.error('❌ Ошибка при удалении превью:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      })
      alert('❌ Ошибка при удалении превью')
    } finally {
      setEditLoading(false)
    }
  }

  // Функция для удаления стрима
  const handleDelete = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить стрим "' + stream?.title + '"? Это действие нельзя отменить.')) {
      return
    }

    try {
      setDeleteLoading(true)
      await streamAPI.deleteStream(streamId)
      alert('✅ Стрим успешно удален!')
      navigate('/profile')
    } catch (err) {
      console.error('❌ Ошибка при удалении стрима:', err)
      alert('❌ Ошибка при удалении стрима')
    } finally {
      setDeleteLoading(false)
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
      'technology': '💻 Технологии'
    }
    return themeNames[themeName] || themeName
  }

  if (loading) return (
    <div className="settings-page">
      <div className="profile-bg" aria-hidden="true"></div>
      <div className="settings-wrapper">
        <div className="glass loading-container">
          <div className="loading-spinner">⏳</div>
          <p>Загрузка настроек стрима...</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="settings-page">
      <div className="profile-bg" aria-hidden="true"></div>
      <div className="settings-wrapper">
        
        {/* ХЛЕБНЫЕ КРОШКИ */}
        <div className="breadcrumbs">
          <Link to="/" className="breadcrumb-link">Главная</Link>
          <span className="breadcrumb-separator">/</span>
          <Link to={`/stream/${streamId}`} className="breadcrumb-link">
            {stream?.title}
          </Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">Настройки</span>
        </div>

        {/* ЗАГОЛОВОК */}
        <div className="glass title-container">
          <div className="title-content">
            <h1>⚙️ Настройки стрима</h1>
            <p className="subtitle">
              Управление настройками и информацией о трансляции
            </p>
          </div>
        </div>

        {/* РЕДАКТИРОВАНИЕ СТРИМА */}
        <div className="glass edit-section">
          <h2 className="section-title">
            <span className="section-icon">📝</span>
            Редактирование стрима
          </h2>
          
          <div className="form-grid">
            {/* ЛЕВАЯ КОЛОНКА */}
            <div>
              {/* НАЗВАНИЕ */}
              <div className="form-field">
                <label>Название стрима *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Введите название стрима"
                  className="form-input"
                />
              </div>

              {/* ОПИСАНИЕ */}
              <div className="form-field">
                <label>Описание</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Опишите ваш стрим..."
                  rows="4"
                  className="form-textarea"
                />
              </div>
            </div>

            {/* ПРАВАЯ КОЛОНКА */}
            <div>
              {/* ПРЕВЬЮ КАРТИНКА */}
              <div className="form-field">
                <label>Превью-картинка</label>
                
                <div className="preview-section">
                  {previewPreview ? (
                    <div className="preview-container">
                      <img
                        src={previewPreview}
                        alt="Превью стрима"
                        className="preview-image"
                        onError={(e) => {
                          console.error('❌ Ошибка загрузки превью')
                          e.target.style.display = 'none'
                        }}
                      />
                    </div>
                  ) : (
                    <div className="preview-placeholder">
                      <div className="placeholder-icon">🖼️</div>
                      <div>Превью отсутствует</div>
                    </div>
                  )}
                  
                  <div className="preview-actions">
                    <button
                      onClick={() => document.getElementById('preview-input').click()}
                      className="btn btn-primary preview-btn"
                      disabled={editLoading}
                    >
                      📁 Загрузить новое
                    </button>
                    
                    {previewPreview && (
                      <button
                        onClick={handleDeletePreview}
                        className="btn btn-ghost preview-btn"
                        disabled={editLoading}
                      >
                        🗑️ Удалить превью
                      </button>
                    )}
                  </div>
                  
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
                      Новое превью: {previewFile.name} ({(previewFile.size / 1024).toFixed(1)} KB)
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ТЕМАТИКИ */}
          <div className="form-field">
            <label>Тематики</label>
            <div className="themes-grid">
              {themes.map((theme) => (
                <div
                  key={theme.id}
                  className={`theme-selector ${formData.theme_ids.includes(theme.id) ? 'selected' : ''}`}
                  onClick={() => handleThemeChange(theme.id)}
                >
                  <div className="theme-selector-icon">
                    {theme.name === 'gaming' ? '🎮' :
                     theme.name === 'music' ? '🎵' :
                     theme.name === 'just_chatting' ? '💬' :
                     theme.name === 'art' ? '🎨' :
                     theme.name === 'sports' ? '⚽' :
                     theme.name === 'technology' ? '💻' : '📌'}
                  </div>
                  <span className="theme-selector-name">
                    {getThemeDisplayName(theme.name)}
                  </span>
                  {formData.theme_ids.includes(theme.id) && (
                    <div className="theme-selector-check">✓</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* КНОПКА СОХРАНЕНИЯ */}
          <div className="form-actions">
            <button
              onClick={handleSaveChanges}
              disabled={editLoading}
              className="btn btn-primary save-btn"
            >
              {editLoading ? '💾 Сохранение...' : '💾 Сохранить изменения'}
            </button>
          </div>
        </div>

        {/* ИНФОРМАЦИЯ О СТРИМЕ */}
        <div className="glass info-section">
          <h3 className="section-title">
            <span className="section-icon">📊</span>
            Информация о стриме
          </h3>
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">Статус</div>
              <div className={`info-value ${stream?.status === 'live' ? 'status-live' : 'status-offline'}`}>
                {stream?.status === 'live' ? '🟢 В эфире' : '🔴 Не в эфире'}
              </div>
            </div>
            <div className="info-item">
              <div className="info-label">Зрителей</div>
              <div className="info-value">
                <span className="viewer-count">{stream?.viewers_count || 0}</span> 👁️
              </div>
            </div>
            <div className="info-item">
              <div className="info-label">Создан</div>
              <div className="info-value">
                {new Date(stream?.created_at).toLocaleDateString('ru-RU')}
              </div>
            </div>
            <div className="info-item">
              <div className="info-label">Обновлен</div>
              <div className="info-value">
                {new Date(stream?.updated_at).toLocaleDateString('ru-RU')}
              </div>
            </div>
          </div>
        </div>

        {/* ОПАСНАЯ ЗОНА */}
        <div className="glass danger-zone">
          <div className="danger-header">
            <h3 className="danger-title">
              <span className="danger-icon">⚠️</span>
              Опасная зона
            </h3>
            <div className="danger-subtitle">
              Это действие нельзя отменить. Все данные стрима будут удалены.
            </div>
          </div>
          
          <button
            onClick={handleDelete}
            disabled={deleteLoading}
            className="btn danger-btn"
          >
            {deleteLoading ? (
              <>
                <span className="btn-spinner"></span>
                Удаление...
              </>
            ) : (
              <>
                <span className="btn-icon">🗑️</span>
                Удалить стрим
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}

export default StreamSettings