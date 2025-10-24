import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { Link } from 'react-router-dom'

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
    <div className="auth-container">
      <h2>Регистрация в StreamFlow</h2>
      <form onSubmit={handleSubmit}>
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
        <button type="submit">Зарегистрироваться</button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '15px' }}>
        Уже есть аккаунт? <Link to="/login" style={{ color: '#9147ff' }}>Войти</Link>
      </p>
    </div>
  )
}

export default Register