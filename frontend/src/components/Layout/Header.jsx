import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Header.css'
import shapka from './shapka.png'

const Header = () => {
  const { isAuthenticated, logout, user } = useAuth()

  const getAvatarUrl = () => {
    if (user?.avatar_url) {
      return `http://localhost/api/files/?file_key=${user.avatar_url}`;
    }
    return null;
  };

  const avatarUrl = getAvatarUrl()

  return (
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
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" />
                ) : (
                  <span>{user?.username?.charAt(0).toUpperCase() || '👤'}</span>
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
  )
}

export default Header