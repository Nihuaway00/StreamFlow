import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const Header = () => {
  const { isAuthenticated, logout, user } = useAuth()

  return (
    <header style={{
      background: '#18181b',
      padding: '0 20px',
      borderBottom: '1px solid #333',
      height: '50px',
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
        margin: '0 auto'
      }}>
        
        {/* ЛЕВАЯ ЧАСТЬ - ЛОГОТИП */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link to="/" style={{
            color: '#9147ff',
            textDecoration: 'none',
            fontSize: '20px',
            fontWeight: 'bold'
          }}>
            StreamFlow
          </Link>
        </div>

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
              padding: '8px 12px',
              background: '#0e0e10',
              border: '1px solid #333',
              borderRadius: '4px',
              color: 'white',
              fontSize: '14px'
            }}
          />
        </div>

        {/* ПРАВАЯ ЧАСТЬ - ПРОФИЛЬ */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {isAuthenticated ? (
            <>
              <Link to="/stream" style={{
                background: '#9147ff',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '4px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#772ce8'}
              onMouseLeave={(e) => e.target.style.background = '#9147ff'}>
                🎥 Начать стрим
              </Link>
              
              {/* КНОПКА ПРОФИЛЯ С ЧЕЛОВЕЧКОМ */}
              <div style={{
                background: '#9147ff',
                color: 'white',
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#772ce8'}
              onMouseLeave={(e) => e.target.style.background = '#9147ff'}>
                👤
              </div>
              
              <button 
                onClick={logout}
                style={{
                  background: 'transparent',
                  color: '#efeff1',
                  border: '1px solid #333',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#333'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                Выйти
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Link to="/login" style={{ 
                color: '#efeff1', 
                textDecoration: 'none',
                fontSize: '14px',
                padding: '8px 16px',
                border: '1px solid #333',
                borderRadius: '4px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#333'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                Войти
              </Link>
              <Link to="/register" style={{
                background: '#9147ff',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '4px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s'
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