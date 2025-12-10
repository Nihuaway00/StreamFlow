import React, { createContext, useState, useContext, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Функция для получения данных пользователя
  const fetchUser = async () => {
    try {
      const response = await authAPI.getCurrentUser()
      const userData = response.data
      console.log('✅ Получены данные пользователя:', userData)
      
      setUser(userData)
      localStorage.setItem('user', JSON.stringify(userData))
      return userData
    } catch (error) {
      console.error('❌ Ошибка получения пользователя:', error)
      if (error.response?.status === 401) {
        logout()
      }
      return null
    }
  }

  // Функция для обновления пользователя
  const updateUser = (userData) => {
    const updatedUser = { ...user, ...userData }
    setUser(updatedUser)
    localStorage.setItem('user', JSON.stringify(updatedUser))
  }

  // Инициализация при загрузке
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token')
      console.log('🔄 Инициализация Auth:', { token: token ? 'Есть' : 'Нет' })
      
      if (token) {
        // Пробуем получить из localStorage
        const savedUser = localStorage.getItem('user')
        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser)
            console.log('📂 Загружен пользователь из localStorage:', parsedUser)
            setUser(parsedUser)
          } catch (e) {
            console.error('Ошибка парсинга сохраненного пользователя:', e)
          }
        }
        
        // Пробуем получить свежие данные
        try {
          await fetchUser()
          setIsAuthenticated(true)
        } catch (error) {
          console.error('Не удалось загрузить пользователя:', error)
        }
      }
      setLoading(false)
    }
    
    initAuth()
  }, [])

  const login = async (email, password) => {
    try {
      console.log('🔐 Начало процесса логина для:', email)
      const response = await authAPI.login({ email, password })
      console.log('✅ Ответ от сервера:', response.data)
      
      // Сохраняем токены
      localStorage.setItem('access_token', response.data.access_token)
      localStorage.setItem('refresh_token', response.data.refresh_token)
      
      // Проверяем есть ли пользователь в ответе
      if (response.data.user) {
        console.log('👤 Пользователь в ответе:', response.data.user)
        setUser(response.data.user)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        setIsAuthenticated(true)
        return { success: true }
      } else if (response.data.user_id) {
        // Если есть только user_id, создаем минимальный объект
        const tempUser = {
          id: response.data.user_id,
          email: email,
          username: email.split('@')[0] // временно
        }
        console.log('🔄 Создан временный пользователь:', tempUser)
        setUser(tempUser)
        localStorage.setItem('user', JSON.stringify(tempUser))
        
        // Пробуем получить полные данные
        try {
          await fetchUser()
        } catch (error) {
          console.warn('Не удалось получить полные данные, использую временные')
        }
        
        setIsAuthenticated(true)
        return { success: true }
      } else {
        // Нет user в ответе, пробуем получить отдельно
        console.log('🔄 Нет пользователя в ответе, запрашиваю отдельно...')
        try {
          await fetchUser()
          setIsAuthenticated(true)
          return { success: true }
        } catch (error) {
          console.error('Не удалось получить пользователя после логина:', error)
          return { 
            success: false, 
            error: 'Вход выполнен, но не удалось загрузить данные пользователя' 
          }
        }
      }
    } catch (error) {
      console.error('❌ Ошибка логина:', error.response?.data || error.message)
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Ошибка входа' 
      }
    }
  }

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData)
      console.log('✅ Регистрация успешна:', response.data)
      
      // После регистрации автоматически логинимся
      const loginResult = await login(userData.email, userData.password)
      if (!loginResult.success) {
        return loginResult
      }
      
      return { success: true, data: response.data }
    } catch (error) {
      console.error('❌ Ошибка регистрации:', error.response?.data)
      return {
        success: false,
        error: error.response?.data?.detail || 'Ошибка регистрации'
      }
    }
  }

  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('Ошибка выхода:', error)
    } finally {
      console.log('👋 Выход из системы')
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      setUser(null)
      setIsAuthenticated(false)
      window.location.href = '/login'
    }
  }

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated,
    fetchUser,
    updateUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}