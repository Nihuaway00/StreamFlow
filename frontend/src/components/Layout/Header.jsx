import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const Header = () => {
  const { isAuthenticated, logout } = useAuth()

  return (
    <header style={{
      background: '#18181b',
      padding: '15px 20px',
      borderBottom: '1px solid #333'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <Link to="/" style={{
          color: '#9147ff',
          textDecoration: 'none',
          fontSize: '24px',
          fontWeight: 'bold'
        }}>
          StreamFlow
        </Link>
        
        <nav>
          {isAuthenticated ? (
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <Link to="/" style={{ color: '#efeff1', textDecoration: 'none' }}>
                Стримы
              </Link>
              <button 
                onClick={logout}
                style={{
                  background: 'transparent',
                  color: '#efeff1',
                  border: '1px solid #333',
                  padding: '5px 15px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Выйти
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '15px' }}>
              <Link to="/login" style={{ color: '#efeff1', textDecoration: 'none' }}>
                Войти
              </Link>
              <Link to="/register" style={{
                background: '#9147ff',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '4px',
                textDecoration: 'none'
              }}>
                Регистрация
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}

export default Header