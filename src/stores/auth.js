import { defineStore } from 'pinia'
import { ref } from 'vue'

const API_URL = 'http://localhost:8080/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const userRole = ref(localStorage.getItem('userRole') || null)
  const isLoading = ref(false)
  const error = ref(null)

  // Простой fetch запрос
  const fetchRequest = async (endpoint, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    // Добавляем токен если есть
    const token = localStorage.getItem('auth_token')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP ${response.status}`)
    }

    return await response.json()
  }

  const login = async (credentials) => {
    isLoading.value = true
    error.value = null

    try {
      console.log('Логин:', credentials)

      // Прямой fetch запрос  
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Email: credentials.Email,
          Username: credentials.Username,
          Password: credentials.Password,
          UserRole: credentials.UserRole,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        error.value = errorData.message || 'Ошибка входа'
        return false
      }

      const data = await response.json()

      // Сохраняем только самое необходимое
      localStorage.setItem('userRole', credentials.UserRole)
      
      if (data.token) {
        localStorage.setItem('auth_token', data.token)
      }
      
      if (data.user) {
        user.value = data.user
        localStorage.setItem('user', JSON.stringify(data.user))
      }

      userRole.value = credentials.UserRole
      console.log('Успешный вход, роль:', userRole.value)
      return true

    } catch (err) {
      error.value = err.message || 'Ошибка сети'
      console.error('Ошибка логина:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    try {
      // Простой запрос на выход
      await fetch(`${API_URL}/auth/logout`, { method: 'POST' })
    } catch (e) {
      console.warn('Ошибка при выходе:', e)
    } finally {
      // Очищаем данные
      user.value = null
      userRole.value = null
      localStorage.removeItem('userRole')
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      console.log('Выход выполнен')
    }
  }

  const register = async (credentials) => {
    isLoading.value = true
    error.value = null

    try {
      console.log('Регистрация:', credentials)

      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Email: credentials.Email,
          Username: credentials.Username,
          Password: credentials.Password,
          UserRole: credentials.UserRole,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        error.value = errorData.message || 'Ошибка регистрации'
        return false
      }

      // После успешной регистрации автоматически входим
      return await login(credentials)

    } catch (err) {
      error.value = err.message || 'Ошибка сети'
      console.error('Ошибка регистрации:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Простая проверка авторизации
  const checkAuth = () => {
    const role = localStorage.getItem('userRole')
    const token = localStorage.getItem('auth_token')
    
    userRole.value = role
    return !!role && !!token
  }

  // Инициализация при загрузке
  const init = () => {
    const savedRole = localStorage.getItem('userRole')
    const savedUser = localStorage.getItem('user')
    
    if (savedRole) {
      userRole.value = savedRole
    }
    
    if (savedUser) {
      try {
        user.value = JSON.parse(savedUser)
      } catch (e) {
        console.error('Ошибка парсинга пользователя:', e)
      }
    }
  }

  init()

  return {
    user,
    userRole,
    isLoading,
    error,
    login,
    logout,
    register,
    checkAuth,
    fetchRequest, // Экспортируем для использования в других местах
  }
})