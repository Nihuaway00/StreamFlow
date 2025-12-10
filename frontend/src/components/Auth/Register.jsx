import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { Link } from 'react-router-dom'
import './Register.css'

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: ''
  })
  const { register } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await register(formData)
    if (result.success) {
      alert('Регистрация успешна! Теперь войдите.')
      window.location.href = '/login'
    } else {
      alert(result.error)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="register-page">
      <div className="register-wrapper">

        <div className="title-block">
          <h1>Регистрация</h1>
          <div className="ellipse ellipse1"></div>
          <div className="ellipse ellipse2"></div>
          <div className="star">✦</div>
        </div>

        <form className="register-form" onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="username"
            placeholder="Имя пользователя"
            value={formData.username}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Пароль"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <button type="submit">ЗАРЕГИСТРИРОВАТЬСЯ</button>
        </form>

        <p className="register-line">
          УЖЕ ЕСТЬ АККАУНТ? <Link to="/login">ВОЙТИ</Link>
        </p>

      </div>
    </div>
  )
}

export default Register