import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { Link } from 'react-router-dom'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await login(email, password)
    if (result.success) {
      window.location.href = '/'
    } else {
      alert(result.error)
    }
  }

  return (
    <div className="auth-container">
      <h2>Вход в StreamFlow</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Войти</button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '15px' }}>
        Нет аккаунта? <Link to="/register" style={{ color: '#9147ff' }}>Зарегистрироваться</Link>
      </p>
    </div>
  )
}

export default Login