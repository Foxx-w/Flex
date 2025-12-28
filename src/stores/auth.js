import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { auth } from '../services/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const userRole = ref(localStorage.getItem('userRole') || null)
  const isLoading = ref(false)
  const error = ref(null)
  
  const isAuthenticated = computed(() => !!userRole.value)
  const token = computed(() => null)
  const role = computed(() => userRole.value)

  const login = async (credentials) => {
    isLoading.value = true
    error.value = null
    
    try {
      console.log('Отправляем запрос логина:', credentials)
      
      // Нормализуем credentials для API
      const payload = {
        Email: credentials.Email || credentials.email || '',
        Username: credentials.Username || credentials.username || '',
        Password: credentials.Password || credentials.password || '',
        UserRole: credentials.UserRole || credentials.userRole || credentials.role || ''
      }
      
      // Используем API из services/api.js
      const response = await auth.login(payload)
      
      // Проверяем статус ответа
      if (response && !response.statusCode) {
        // Сохраняем роль пользователя
        userRole.value = payload.UserRole
        localStorage.setItem('userRole', payload.UserRole)
        
        // Сохраняем данные пользователя, если они есть в ответе
        if (response.user || response.id) {
          user.value = response.user || response
        }
        
        console.log('Логин успешен, роль:', userRole.value)
        return true
      } else {
        error.value = response?.Message || 'Ошибка при входе'
        console.error('Ошибка логина:', response)
        return false
      }
    } catch (err) {
      error.value = err.message || 'Ошибка сети'
      console.error('Login error:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }
  
  const logout = async () => {
    try {
      await auth.logout()
    } catch (e) {
      console.warn('Logout request failed', e)
    } finally {
      // Очищаем состояние
      user.value = null
      userRole.value = null
      localStorage.removeItem('userRole')
      console.log('Пользователь разлогинен')
    }
  }
  
  const register = async (credentials) => {
    isLoading.value = true
    error.value = null
    
    try {
      const payload = {
        Email: credentials.Email || credentials.email || '',
        Username: credentials.Username || credentials.username || '',
        Password: credentials.Password || credentials.password || '',
        UserRole: credentials.UserRole || credentials.userRole || credentials.role || ''
      }
      
      const response = await auth.register(payload)
      
      if (response && !response.statusCode) {
        // После регистрации автоматически логинимся
        return await login(payload)
      } else {
        error.value = response?.Message || 'Ошибка при регистрации'
        console.error('Ошибка регистрации:', response)
        return false
      }
    } catch (err) {
      error.value = err.message || 'Ошибка сети'
      console.error('Register error:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Проверка авторизации (упрощенная версия)
  const checkAuth = async () => {
    try {
      const userRole = localStorage.getItem('userRole')
      if (!userRole) return false
      
      // Для разных ролей разные проверки
      if (userRole === 'CUSTOMER') {
        // Можно проверить через любой защищенный эндпоинт
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/carts`, {
          credentials: 'include'
        })
        return response.ok
      } else if (userRole === 'SELLER') {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/games/my?Page=1&PageSize=1`, {
          credentials: 'include'
        })
        return response.ok
      }
      
      return false
    } catch (error) {
      console.error('Auth check failed:', error)
      return false
    }
  }
  
  // Проверяем авторизацию при загрузке приложения
  const checkAuthOnLoad = async () => {
    const savedRole = localStorage.getItem('userRole')
    if (savedRole) {
      userRole.value = savedRole
      
      // Проверяем валидность сессии
      const isValid = await checkAuth()
      if (!isValid) {
        // Сессия невалидна, разлогиниваем
        logout()
      }
    }
  }
  
  // Инициализация
  const init = () => {
    const savedRole = localStorage.getItem('userRole')
    if (savedRole) {
      userRole.value = savedRole
    }
    // Проверяем авторизацию при загрузке
    checkAuthOnLoad()
  }
  
  init()
  
  return { 
    user, 
    token, 
    userRole, 
    role,
    isLoading,
    error,
    isAuthenticated, 
    login, 
    logout, 
    register,
    checkAuth 
  }
})