import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import './Header.css'
import shapka from './shapka.png'

const Header = () => {
  const { isAuthenticated, logout, user } = useAuth()
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [avatarLoading, setAvatarLoading] = useState(false)

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

  // Функция для получения signed URL аватара
  const getAvatarUrl = async (fileKey) => {
    if (!fileKey) return null
    
    try {
      // ВАЖНО: POST запрос, а не GET!
      const response = await api.post('/files/', null, {
        params: { file_key: fileKey }
      })
      
      let signedUrl = response.data
      
      if (typeof signedUrl === 'string') {
        // ЗАМЕНЯЕМ storage:9000 на localhost:9000
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

  // Загружаем аватар при изменении пользователя
  useEffect(() => {
    const loadAvatar = async () => {
      if (!user?.avatar_url) {
        setAvatarUrl(null)
        return
      }

      setAvatarLoading(true)
      try {
        const fileKey = extractFileKey(user.avatar_url)
        if (fileKey) {
          const url = await getAvatarUrl(fileKey)
          setAvatarUrl(url)
        } else {
          setAvatarUrl(null)
        }
      } catch (error) {
        console.error('Ошибка загрузки аватара:', error)
        setAvatarUrl(null)
      } finally {
        setAvatarLoading(false)
      }
    }

    loadAvatar()
  }, [user?.avatar_url])

  // Обработчик ошибок загрузки изображения
  const handleImageError = (e) => {
    console.error('Ошибка загрузки изображения аватара в Header')
    e.target.style.display = 'none'
    // Показываем инициалы вместо битой картинки
    const parent = e.target.parentElement
    if (parent) {
      const initialsSpan = document.createElement('span')
      initialsSpan.textContent = user?.username?.charAt(0).toUpperCase() || '👤'
      parent.appendChild(initialsSpan)
    }
  }

  return (
    <>
    <header className="header" style={{ backgroundImage: `url(${shapka})` }}>
      <div className="header__content">

        {/* Лого-кнопка */}
        <div className="header__logo-area"></div>
        <Link to="/" className="header__logo-clickzone"></Link>

        {/* Поиск */}
        <div className="header__search">
          <input type="text" placeholder="Поиск стримов..." />
          <button className="search-btn" aria-label="search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="white" strokeWidth="2"/>
              <line x1="16.5" y1="16.5" x2="22" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Правая часть */}
        <div className="header__right">

          {isAuthenticated ? (
            <>
              <Link to="/stream" className="header-btn black-btn">
                начать стрим!
              </Link>

              <Link to="/profile" className="avatar-wrapper">
                {avatarLoading ? (
                  <div className="avatar-loading">
                    <div className="spinner"></div>
                  </div>
                ) : avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Avatar" 
                    onError={handleImageError}
                  />
                ) : (
                  <span className="avatar-initials">
                    {user?.username?.charAt(0).toUpperCase() || '👤'}
                  </span>
                )}
              </Link>

              <button onClick={logout} className="header-btn exit-btn">
                выйти
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="header-btn">Войти</Link>
              <Link to="/register" className="header-btn purple-btn">Регистрация</Link>
            </>
          )}

        </div>
      </div>
    </header>
    <div style={{ height: '15px' }}></div>
  </>
  )
}

export default Header