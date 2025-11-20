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
      const response = await authAPI.getCurrentUser() // Теперь этот метод есть!
      setUser(response.data)
      // Также сохраняем в localStorage для быстрого доступа
      localStorage.setItem('user', JSON.stringify(response.data))
      return response.data
    } catch (error) {
      console.error('Error fetching user:', error)
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

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token')
      if (token) {
        // Сначала пробуем получить из localStorage для быстрой загрузки
        const savedUser = localStorage.getItem('user')
        if (savedUser) {
          setUser(JSON.parse(savedUser))
        }
        
        // Затем запрашиваем свежие данные с сервера
        await fetchUser()
        setIsAuthenticated(true)
      }
      setLoading(false)
    }
    
    initAuth()
  }, [])

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password })
      localStorage.setItem('access_token', response.data.access_token)
      
      await fetchUser()
      setIsAuthenticated(true)
      
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Ошибка входа' 
      }
    }
  }

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData)
      return { success: true, data: response.data }
    } catch (error) {
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
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      setUser(null)
      setIsAuthenticated(false)
      window.location.reload()
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