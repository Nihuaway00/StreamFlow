import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { streamAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

const StreamSettings = () => {
  const { streamId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [stream, setStream] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editLoading, setEditLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [themes, setThemes] = useState([])
  
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
        
        setStream(streamResponse.data)
        setThemes(themesResponse.data)
        
        // Проверяем, является ли пользователь владельцем
        if (user?.id !== streamResponse.data.author?.id) {
          navigate('/')
          return
        }
        
        // Заполняем форму данными стрима
        setFormData({
          title: streamResponse.data.title || '',
          description: streamResponse.data.description || '',
          theme_ids: streamResponse.data.themes?.map(theme => theme.id) || []
        })
      } catch (err) {
        console.error('Error fetching data:', err)
        navigate('/')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [streamId, user, navigate])

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

  // Функция для сохранения изменений
  const handleSaveChanges = async () => {
    if (!formData.title.trim()) {
      alert('Название стрима не может быть пустым')
      return
    }

    try {
      setEditLoading(true)
      const response = await streamAPI.updateStream(streamId, formData)
      setStream(response.data)
      alert('✅ Изменения успешно сохранены!')
    } catch (err) {
      console.error('Error updating stream:', err)
      alert('❌ Ошибка при сохранении изменений')
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
      console.error('Error deleting stream:', err)
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
      'just_chatting': '💬 Общение'
    }
    return themeNames[themeName] || themeName
  }

  if (loading) return (
    <div style={{ padding: '50px', textAlign: 'center', color: 'white' }}>
      <div style={{ fontSize: '32px', marginBottom: '10px' }}>⏳</div>
      Загрузка...
    </div>
  )

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', color: 'white' }}>
      {/* ХЛЕБНЫЕ КРОШКИ */}
      <div style={{ marginBottom: '30px' }}>
        <Link to="/" style={{ color: '#9147ff', textDecoration: 'none' }}>Главная</Link>
        <span style={{ color: '#adadb8', margin: '0 10px' }}>/</span>
        <Link to={`/stream/${streamId}`} style={{ color: '#9147ff', textDecoration: 'none' }}>
          {stream?.title}
        </Link>
        <span style={{ color: '#adadb8', margin: '0 10px' }}>/</span>
        <span>Настройки</span>
      </div>

      <h1>⚙️ Настройки стрима</h1>

      {/* РЕДАКТИРОВАНИЕ СТРИМА */}
      <div style={{
        background: '#18181b',
        borderRadius: '8px',
        padding: '25px',
        marginBottom: '20px',
        border: '1px solid #333'
      }}>
        <h2 style={{ marginBottom: '20px', color: '#efeff1' }}>📝 Редактирование стрима</h2>
        
        {/* НАЗВАНИЕ */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#adadb8' }}>
            Название стрима *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Введите название стрима"
            style={{
              width: '100%',
              padding: '12px',
              background: '#0e0e10',
              border: '1px solid #444',
              borderRadius: '4px',
              color: 'white',
              fontSize: '14px'
            }}
          />
        </div>

        {/* ОПИСАНИЕ */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#adadb8' }}>
            Описание
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Опишите ваш стрим..."
            rows="4"
            style={{
              width: '100%',
              padding: '12px',
              background: '#0e0e10',
              border: '1px solid #444',
              borderRadius: '4px',
              color: 'white',
              fontSize: '14px',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* ТЕМАТИКИ */}
        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', marginBottom: '12px', color: '#adadb8' }}>
            Тематики
          </label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '10px'
          }}>
            {themes.map((theme) => (
              <label
                key={theme.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px',
                  background: formData.theme_ids.includes(theme.id) ? '#9147ff20' : '#0e0e10',
                  border: `1px solid ${formData.theme_ids.includes(theme.id) ? '#9147ff' : '#444'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <input
                  type="checkbox"
                  checked={formData.theme_ids.includes(theme.id)}
                  onChange={() => handleThemeChange(theme.id)}
                  style={{ display: 'none' }}
                />
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: `2px solid ${formData.theme_ids.includes(theme.id) ? '#9147ff' : '#666'}`,
                  borderRadius: '3px',
                  background: formData.theme_ids.includes(theme.id) ? '#9147ff' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  color: 'white'
                }}>
                  {formData.theme_ids.includes(theme.id) && '✓'}
                </div>
                <span style={{ color: 'white', fontSize: '14px' }}>
                  {getThemeDisplayName(theme.name)}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* КНОПКА СОХРАНЕНИЯ */}
        <button
          onClick={handleSaveChanges}
          disabled={editLoading}
          style={{
            background: editLoading ? '#666' : '#9147ff',
            color: 'white',
            border: 'none',
            padding: '12px 30px',
            borderRadius: '4px',
            cursor: editLoading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          {editLoading ? '💾 Сохранение...' : '💾 Сохранить изменения'}
        </button>
      </div>

      {/* ИНФОРМАЦИЯ О СТРИМЕ */}
      <div style={{
        background: '#18181b',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
        border: '1px solid #333'
      }}>
        <h3 style={{ marginBottom: '15px', color: '#efeff1' }}>📊 Информация о стриме</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div>
            <strong style={{ color: '#adadb8' }}>Статус:</strong>
            <p style={{ color: 'white', margin: '5px 0 0 0' }}>
              {stream?.status === 'live' ? '🟢 В эфире' : '🔴 Не в эфире'}
            </p>
          </div>
          <div>
            <strong style={{ color: '#adadb8' }}>Зрителей:</strong>
            <p style={{ color: 'white', margin: '5px 0 0 0' }}>{stream?.viewers_count || 0}</p>
          </div>
          <div>
            <strong style={{ color: '#adadb8' }}>Создан:</strong>
            <p style={{ color: 'white', margin: '5px 0 0 0' }}>
              {new Date(stream?.created_at).toLocaleDateString('ru-RU')}
            </p>
          </div>
          <div>
            <strong style={{ color: '#adadb8' }}>Обновлен:</strong>
            <p style={{ color: 'white', margin: '5px 0 0 0' }}>
              {new Date(stream?.updated_at).toLocaleDateString('ru-RU')}
            </p>
          </div>
        </div>
      </div>

      {/* ОПАСНАЯ ЗОНА */}
      <div style={{
        background: '#2a1a1a',
        border: '1px solid #ff4757',
        borderRadius: '8px',
        padding: '25px'
      }}>
        <h3 style={{ color: '#ff4757', marginBottom: '15px' }}>🗑️ Опасная зона</h3>
        <p style={{ color: '#adadb8', marginBottom: '20px' }}>
          Это действие нельзя отменить. Все данные стрима, включая статистику и запись, будут безвозвратно удалены.
        </p>
        
        <button
          onClick={handleDelete}
          disabled={deleteLoading}
          style={{
            background: deleteLoading ? '#666' : '#ff4757',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '4px',
            cursor: deleteLoading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          {deleteLoading ? '🔄 Удаление...' : '🗑️ Удалить стрим'}
        </button>
      </div>
    </div>
  )
}

export default StreamSettings