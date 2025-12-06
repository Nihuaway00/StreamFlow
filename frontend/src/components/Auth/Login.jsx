import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { Link } from 'react-router-dom'
import './Login.css'

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
    <div className="login-page">
      <div className="login-wrapper">

        <div className="title-block">
          <h1>ВХОД В STREAMFLOW</h1>
          <div className="ellipse ellipse1"></div>
          <div className="ellipse ellipse2"></div>
          <div className="star">✦</div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="логин"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">ВОЙТИ</button>
        </form>

        <p className="register-line">
          НЕТ АККАУНТА? <Link to="/register">ЗАРЕГИСТРИРОВАТЬСЯ</Link>
        </p>
      </div>
    </div>
  )
}

export default Login