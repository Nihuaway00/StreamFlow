import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import  api  from '../../services/api'

const Profile = () => {
  const { user, logout, updateUser } = useAuth()
  const [showSettings, setShowSettings] = useState(false)
  const [username, setUsername] = useState(user?.username || '')
  const [usernameChanged, setUsernameChanged] = useState(false)
  const [selectedThemes, setSelectedThemes] = useState([])
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [isUploading, setIsUploading] = useState(false)

  const themes = [
    '🎮 Игры',
    '🎵 Музыка',
    '💻 Программирование',
    '🎨 Творчество',
    '🏆 Спорт',
    '📚 Образование',
    '🍿 Развлечения',
    '🌍 Путешествия',
    '🗣️ Общение и чаттинг'
  ]

  const achievements = [
    {
      id: 1,
      title: "Начинающий стример",
      description: "Провести один стрим",
      progress: 0,
      total: 1,
      icon: "🎥",
      color: "#9147ff"
    },
    {
      id: 2,
      title: "Я - душа компании", 
      description: "Отправить в чат 100 сообщений",
      progress: 25,
      total: 100,
      icon: "💬",
      color: "#00ff7f"
    },
    {
      id: 3,
      title: "Звезда",
      description: "Собрать 10000 подписчиков",
      progress: 0,
      total: 10000,
      icon: "⭐",
      color: "#ffd700"
    }
  ]

  const calculateProgress = (progress, total) => {
    return total > 0 ? Math.min((progress / total) * 100, 100) : 0
  }

  const handleThemeToggle = (theme) => {
    if (selectedThemes.includes(theme)) {
      setSelectedThemes(selectedThemes.filter(t => t !== theme))
    } else {
      setSelectedThemes([...selectedThemes, theme])
    }
  }

  const handleAvatarUpload = async () => {
    if (!avatarFile) return
    
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', avatarFile)

      console.log('загрузка аватара..')
      console.log('Токен:', localStorage.getItem('access_token'))
      
      const response = await api.post('/users/me', formData, {
        headers: {
          'Content-Type': `multipart/form-data`
        }
      })

      console.log("Ответ от сервера после загрузки:")
      
      updateUser(response.data)
      setAvatarPreview(null)
      setAvatarFile(null)
      alert("Аватар успешно обновлён!")

    } catch (error) {
      console.error('Error uploading avatar:', error)
      alert('Ошибка при загрузке аватара')
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      // Проверяем размер файла (максимум 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Файл слишком большой. Максимальный размер: 5MB')
        return
      }
      
      // Проверяем тип файла
      if (!file.type.startsWith('image/')) {
        alert('Пожалуйста, выберите изображение')
        return
      }
      
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleSaveSettings = () => {
    // Здесь ДОЛЖНА БЫТЬ И БУДЕТ НИКИТОСИК И ВАНЬКА логика сохранения настроек
    alert('Настройки сохранены!')
    setShowSettings(false)
  }

  const handleUsernameChange = (e) => {
    if (!usernameChanged) {
      setUsername(e.target.value)
    }
  }

  // Функция для получения URL аватара
  const getAvatarUrl = () => {
    if (avatarPreview) {
      return avatarPreview
    }
    if (user?.avatar_url) {
      return `http://localhost:8000/api/files/?file_key=${user.avatar_url}`
    }
    return null
  }

  const avatarUrl = getAvatarUrl()

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* ШАПКА ПРОФИЛЯ */}
      <div style={{
        background: '#18181b',
        borderRadius: '8px',
        padding: '30px',
        marginBottom: '20px',
        border: '1px solid #333',
        display: 'flex',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          background: avatarUrl ? 'transparent' : 'linear-gradient(45deg, #9147ff, #772ce8)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px',
          fontWeight: 'bold',
          color: 'white',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden'
        }}
        onClick={() => document.getElementById('avatar-input-main').click()}
        title="Нажмите чтобы сменить аватар">
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt="Avatar" 
              style={{width: '100%', height: '100%', objectFit: 'cover'}}
            />
          ) : (
            user?.username?.charAt(0).toUpperCase() || 'U'
          )}
          <input
            id="avatar-input-main"
            type="file"
            accept="image/*"
            style={{display: 'none'}}
            onChange={handleFileSelect}
          />
          <div style={{
            position: 'absolute',
            bottom: '2px',
            right: '2px',
            background: '#9147ff',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px'
          }}>
            ✏️
          </div>
        </div>
        
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: '0 0 5px 0', fontSize: '24px' }}>
            {user?.username || 'Пользователь'}
          </h1>
          <p style={{ margin: 0, color: '#adadb8' }}>
            {user?.email || 'email@example.com'}
          </p>
          <p style={{ margin: '10px 0 0 0', color: '#9147ff' }}>
            📍 Участник StreamFlow
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={logout}
            style={{
              background: 'transparent',
              color: '#efeff1',
              border: '1px solid #333',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Выйти
          </button>
        </div>
      </div>

      {/* МОДАЛЬНОЕ ОКНО НАСТРОЕК */}
      {showSettings && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#18181b',
            borderRadius: '12px',
            padding: '30px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflowY: 'auto',
            border: '1px solid #333'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '25px'
            }}>
              <h2 style={{ margin: 0, fontSize: '24px' }}>⚙️ Настройки профиля</h2>
              <button 
                onClick={() => setShowSettings(false)}
                style={{
                  background: 'transparent',
                  color: '#adadb8',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '5px'
                }}
              >
                ✕
              </button>
            </div>

            {/* СМЕНА АВАТАРКИ */}
            <div style={{ marginBottom: '25px' }}>
              <h3 style={{ marginBottom: '15px', color: '#efeff1' }}>🖼️ Аватарка</h3>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px'
              }}>
                <div 
                  style={{
                    width: '60px',
                    height: '60px',
                    background: avatarPreview ? 'transparent' : 'linear-gradient(45deg, #9147ff, #772ce8)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: 'white',
                    overflow: 'hidden',
                    cursor: 'pointer'
                  }}
                  onClick={() => document.getElementById('avatar-input-modal').click()}
                >
                  {avatarPreview ? (
                    <img 
                      src={avatarPreview} 
                      alt="Preview" 
                      style={{width: '100%', height: '100%', objectFit: 'cover'}}
                    />
                  ) : user?.avatar_url ? (
                    <img 
                      src={`http://localhost:8000/api/files/?file_key=${user.avatar_url}`}
                      alt="Avatar" 
                      style={{width: '100%', height: '100%', objectFit: 'cover'}}
                    />
                  ) : (
                    username.charAt(0).toUpperCase()
                  )}
                  <input
                    id="avatar-input-modal"
                    type="file"
                    accept="image/*"
                    style={{display: 'none'}}
                    onChange={handleFileSelect}
                  />
                </div>
                <div>
                  <p style={{ margin: '0 0 8px 0', color: '#adadb8', fontSize: '14px' }}>
                    Нажмите на аватар для загрузки нового
                  </p>
                  <button 
                    onClick={() => document.getElementById('avatar-input-modal').click()}
                    style={{
                      background: '#333',
                      color: '#efeff1',
                      border: '1px solid #444',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      marginRight: '10px'
                    }}
                  >
                    📁 Выбрать файл
                  </button>
                  {avatarFile && (
                    <button 
                      onClick={handleAvatarUpload}
                      disabled={isUploading}
                      style={{
                        background: isUploading ? '#666' : '#9147ff',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        cursor: isUploading ? 'not-allowed' : 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      {isUploading ? '📤 Загрузка...' : '💾 Сохранить'}
                    </button>
                  )}
                </div>
              </div>
              {avatarFile && (
                <p style={{ margin: '10px 0 0 0', color: '#adadb8', fontSize: '12px' }}>
                  Выбран файл: {avatarFile.name} ({(avatarFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            {/* ИМЯ ПОЛЬЗОВАТЕЛЯ */}
            <div style={{ marginBottom: '25px' }}>
              <h3 style={{ marginBottom: '10px', color: '#efeff1' }}>👤 Имя пользователя</h3>
              <input
                type="text"
                value={username}
                onChange={handleUsernameChange}
                disabled={usernameChanged}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#0e0e10',
                  border: `1px solid ${usernameChanged ? '#333' : '#444'}`,
                  borderRadius: '4px',
                  color: usernameChanged ? '#adadb8' : 'white',
                  fontSize: '14px'
                }}
                placeholder="Введите новое имя"
              />
              {usernameChanged ? (
                <p style={{ margin: '8px 0 0 0', color: '#adadb8', fontSize: '12px' }}>
                  ❌ Имя пользователя можно изменить только один раз
                </p>
              ) : (
                <p style={{ margin: '8px 0 0 0', color: '#adadb8', fontSize: '12px' }}>
                  ⚠️ Имя пользователя можно изменить только один раз
                </p>
              )}
            </div>

            {/* ТЕМАТИКИ */}
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ marginBottom: '15px', color: '#efeff1' }}>🎯 Интересные тематики</h3>
              <p style={{ margin: '0 0 15px 0', color: '#adadb8', fontSize: '14px' }}>
                Выберите темы, которые вам интересны (для рекомендаций)
              </p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '10px'
              }}>
                {themes.map((theme) => (
                  <button
                    key={theme}
                    onClick={() => handleThemeToggle(theme)}
                    style={{
                      background: selectedThemes.includes(theme) ? '#9147ff' : '#333',
                      color: 'white',
                      border: 'none',
                      padding: '10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      textAlign: 'left',
                      transition: 'all 0.2s'
                    }}
                  >
                    {theme}
                  </button>
                ))}
              </div>
            </div>

            {/* КНОПКИ */}
            <div style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'flex-end'
            }}>
              <button 
                onClick={() => setShowSettings(false)}
                style={{
                  background: 'transparent',
                  color: '#efeff1',
                  border: '1px solid #333',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Отмена
              </button>
              <button 
                onClick={handleSaveSettings}
                style={{
                  background: '#9147ff',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                💾 Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ОСТАЛЬНАЯ ЧАСТЬ ПРОФИЛЯ (достижения и т.д.) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '20px'
      }}>
        
        {/* ЛЕВАЯ КОЛОНКА - ОСНОВНАЯ ИНФА */}
        <div>
          
          {/* ДОСТИЖЕНИЯ */}
          <div style={{
            background: '#18181b',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px',
            border: '1px solid #333'
          }}>
            <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              🏆 Достижения
              <span style={{
                background: '#9147ff',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'normal'
              }}>
                {achievements.filter(a => a.progress >= a.total).length}/{achievements.length}
              </span>
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {achievements.map((achievement) => {
                const progressPercent = calculateProgress(achievement.progress, achievement.total)
                const isCompleted = achievement.progress >= achievement.total
                
                return (
                  <div key={achievement.id} style={{
                    background: isCompleted ? `${achievement.color}20` : '#0e0e10',
                    border: `1px solid ${isCompleted ? achievement.color : '#333'}`,
                    borderRadius: '8px',
                    padding: '15px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      height: '100%',
                      width: `${progressPercent}%`,
                      background: `${achievement.color}30`,
                      transition: 'width 0.3s ease'
                    }} />
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', position: 'relative', zIndex: 1 }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        background: isCompleted ? achievement.color : '#333',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        flexShrink: 0
                      }}>
                        {achievement.icon}
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px',
                          marginBottom: '5px'
                        }}>
                          <h3 style={{ 
                            margin: 0, 
                            color: isCompleted ? achievement.color : '#efeff1',
                            fontSize: '16px'
                          }}>
                            {achievement.title}
                          </h3>
                          {isCompleted && (
                            <span style={{
                              background: achievement.color,
                              color: 'white',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 'bold'
                            }}>
                              ✅ Выполнено
                            </span>
                          )}
                        </div>
                        
                        <p style={{ 
                          margin: '0 0 8px 0', 
                          color: '#adadb8',
                          fontSize: '14px'
                        }}>
                          {achievement.description}
                        </p>
                        
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          fontSize: '12px'
                        }}>
                          <div style={{
                            flex: 1,
                            height: '6px',
                            background: '#333',
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              height: '100%',
                              width: `${progressPercent}%`,
                              background: achievement.color,
                              borderRadius: '3px',
                              transition: 'width 0.3s ease'
                            }} />
                          </div>
                          
                          <span style={{ 
                            color: isCompleted ? achievement.color : '#adadb8',
                            minWidth: '60px',
                            fontWeight: isCompleted ? 'bold' : 'normal'
                          }}>
                            {achievement.progress}/{achievement.total}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* МОИ СТРИМЫ */}
          <div style={{
            background: '#18181b',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px',
            border: '1px solid #333'
          }}>
            <h2 style={{ marginBottom: '15px' }}>🎥 Мои стримы</h2>
            <div style={{
              background: '#0e0e10',
              padding: '15px',
              borderRadius: '4px',
              textAlign: 'center',
              color: '#adadb8'
            }}>
              <p>У вас пока нет активных стримов</p>
              <button style={{
                background: '#9147ff',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '10px'
              }}>
                🎥 Начать первый стрим
              </button>
            </div>
          </div>

        </div>

        {/* ПРАВАЯ КОЛОНКА - БЫСТРЫЕ ДЕЙСТВИЯ */}
        <div>
          
          {/* БЫСТРЫЕ ДЕЙСТВИЯ */}
          <div style={{
            background: '#18181b',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px',
            border: '1px solid #333'
          }}>
            <h3 style={{ marginBottom: '15px' }}>⚡ Быстрые действия</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button style={{
                background: '#9147ff',
                color: 'white',
                border: 'none',
                padding: '12px',
                borderRadius: '4px',
                cursor: 'pointer',
                textAlign: 'left'
              }}>
                🎥 Начать стрим
              </button>
              <button 
                onClick={() => setShowSettings(true)}
                style={{
                  background: '#333',
                  color: 'white',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                ⚙️ Настройки
              </button>
              <button style={{
                background: '#333',
                color: 'white',
                border: 'none',
                padding: '12px',
                borderRadius: '4px',
                cursor: 'pointer',
                textAlign: 'left'
              }}>
                👥 Мои подписки
              </button>
            </div>
          </div>

          {/* ИНФОРМАЦИЯ */}
          <div style={{
            background: '#18181b',
            borderRadius: '8px',
            padding: '20px',
            border: '1px solid #333'
          }}>
            <h3 style={{ marginBottom: '15px' }}>ℹ️ Информация</h3>
            <div style={{ color: '#adadb8', fontSize: '14px', lineHeight: '1.5' }}>
              <p>🎯 <strong>Статус:</strong> Новичок</p>
              <p>📅 <strong>Регистрация:</strong> Сегодня</p>
              <p>🌟 <strong>Достижения:</strong> 0/3 выполнено</p>
              {selectedThemes.length > 0 && (
                <p>🎯 <strong>Интересы:</strong> {selectedThemes.length} тем</p>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}

export default Profile