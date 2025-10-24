import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import Login from './components/Auth/Login'
import Register from './components/Auth/Register'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app" style={{ background: '#0e0e10', minHeight: '100vh', color: 'white' }}>
          <div style={{ 
            background: '#18181b', 
            padding: '15px 20px', 
            borderBottom: '1px solid #333',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ color: '#9147ff', fontSize: '24px', fontWeight: 'bold' }}>
              StreamFlow
            </span>
            <div>
              <a href="/login" style={{ color: '#efeff1', marginRight: '15px' }}>Войти</a>
              <a href="/register" style={{ 
                background: '#9147ff', 
                color: 'white', 
                padding: '8px 16px', 
                borderRadius: '4px',
                textDecoration: 'none'
              }}>Регистрация</a>
            </div>
          </div>

          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={
              <div style={{ padding: '20px' }}>
                <h1>Добро пожаловать в StreamFlow!</h1>
                <p>Платформа для стримов в реальном времени</p>
                <div style={{ marginTop: '20px' }}>
                  <a href="/register" style={{ 
                    background: '#9147ff', 
                    color: 'white', 
                    padding: '10px 20px', 
                    borderRadius: '4px',
                    textDecoration: 'none',
                    marginRight: '10px'
                  }}>Начать стримить</a>
                  <a href="/login" style={{ 
                    color: '#9147ff', 
                    padding: '10px 20px', 
                    border: '1px solid #9147ff',
                    borderRadius: '4px',
                    textDecoration: 'none'
                  }}>Войти</a>
                </div>
              </div>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App