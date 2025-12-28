import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { auth } from '../services/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token'))
  
  const isAuthenticated = computed(() => !!token.value)
  const userRole = computed(() => user.value?.role)
  
  const login = async (credentials) => {
    const cred = credentials || {}
    const Email = cred.Email || cred.email || ''
    const Username = cred.Username || cred.username || ''
    const Password = cred.Password || cred.password || ''
    const UserRole = cred.UserRole || cred.userRole || cred.role || ''

    const payload = { Email, Username, Password, UserRole }
    const data = await auth.login(payload)

    if (data && !data.statusCode) {
      user.value = data.user || data
      token.value = data.token || token.value
      if (data.token) localStorage.setItem('token', data.token)
      return true
    }
    return false
  }
  
  const logout = async () => {
    try {
      await auth.logout()
    } catch (e) {
      console.warn('Logout request failed', e)
    }
    user.value = null
    token.value = null
    localStorage.removeItem('token')
  }
  
  const checkAuth = async () => {
    try {
      const data = await auth.me()
      if (data && !data.statusCode) {
        user.value = data
        return true
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    }

    logout()
    return false
  }
  
  return { user, token, isAuthenticated, userRole, login, logout, checkAuth }
})