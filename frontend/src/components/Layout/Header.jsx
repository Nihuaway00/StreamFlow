import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import shapka from './shapka.png' // Импортируем картинку

const Header = () => {
  const { isAuthenticated, logout, user } = useAuth()

  return (
    <header style={{
      background: `url(${shapka}) center/cover no-repeat`, // Картинка как фон
      padding: '0 20px',
      borderBottom: '1px solid #333',
      height: '70px', 
      display: 'flex',
      alignItems: 'center',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        maxWidth: '1400px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 2
      }}>
        
        {/* ЛЕВАЯ ЧАСТЬ - ЛОГОТИП (убираем, т.к. он уже в картинке) */}
        <div style={{ 
          width: '150px', 
          height: '40px',
          // Можно оставить пустым или добавить прозрачную кнопку поверх лого в картинке
        }}></div>

        {/* ЦЕНТРАЛЬНАЯ ЧАСТЬ - ПОИСК */}
        <div style={{ 
          flex: 1, 
          maxWidth: '400px', 
          margin: '0 40px' 
        }}>
          <input
            type="text"
            placeholder="Поиск стримов..."
            style={{
              width: '100%',
              padding: '10px 16px',
              background: 'rgba(14, 14, 16, 0.67)',
              border: '1px solid rgba(255, 255, 255, 0.98)',
              borderRadius: '25px',
              color: 'white',
              fontSize: '14px',
              backdropFilter: 'blur(10px)'
            }}
          />
        </div>

        {/* ПРАВАЯ ЧАСТЬ - ПРОФИЛЬ */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '18px',
          background: 'rgba(29, 29, 87, 0.07)',
          border: '1px solid rgba(16, 3, 3, 0.5)',
          padding: '8px 10px',
          borderRadius: '20px',
          backdropFilter: 'blur(10px)'
        }}>
          {isAuthenticated ? (
            <>
              <Link to="/stream" style={{
                background: '#5b28a895',
                color: 'white',
                padding: '8px 16px',
                border: '1px solid rgba(16, 3, 3, 0.31)',
                borderRadius: '20px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => e.target.style.background = '#772ce8cd'}
              onMouseLeave={(e) => e.target.style.background = '#9147ffad'}>
                🎥 Начать стрим
              </Link>
              
              {/* КНОПКА ПРОФИЛЯ */}
              <Link to="/profile" style={{
                background: '#9147ff',
                color: 'white',
                width: '35px',
                height: '35px',
                borderRadius: '50%',
                border: '1px solid rgba(64, 27, 27, 0.47)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                textDecoration: 'none',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#772ce8'}
              onMouseLeave={(e) => e.target.style.background = '#9147ff'}>
                👤
              </Link>
              
              <button 
                onClick={logout}
                style={{
                  background: 'transparent',
                  background: '#5b28a895',
                  color: 'white',
                  border: '1px solid rgba(35, 2, 2, 0.65)',
                  padding: '8px 24px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                  marginBottom: '10px'
                }}
                onMouseEnter={(e) => e.target.style.background = '#772ce8cd'}
                onMouseLeave={(e) => e.target.style.background = '#9147ffad'}
              >
                Выйти
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Link to="/login" style={{ 
                color: 'white', 
                textDecoration: 'none',
                fontSize: '14px',
                padding: '8px 16px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '20px',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                Войти
              </Link>
              <Link to="/register" style={{
                background: '#9147ff',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '20px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => e.target.style.background = '#772ce8'}
              onMouseLeave={(e) => e.target.style.background = '#9147ff'}>
                Регистрация
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header