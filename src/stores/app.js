import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  auth, 
  cart, 
  games as gamesApi, // ПЕРЕИМЕНОВАЛИ импорт
  genres as genresApi, 
  orders 
} from '../services/api'

export const useAppStore = defineStore('app', () => {
  // User state
  const user = ref(null)
  const userRole = ref(null)
  const isAuthenticated = computed(() => !!user.value)

  // Cart state
  const cartItems = ref([])
  const cartCount = computed(() => 
    cartItems.value.reduce((sum, item) => sum + item.quantity, 0)
  )
  const cartTotal = computed(() =>
    cartItems.value.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  )

  // Games state
  const gamesList = ref([]) // ПЕРЕИМЕНОВАЛИ переменную
  const currentGame = ref(null)
  const sellerGames = ref([])
  const genres = ref([])

  // Pagination
  const pagination = ref({
    page: 1,
    pageSize: 20,
    totalPages: 0,
    totalElements: 0
  })

  // Auth methods
  const register = async (email, username, password, role) => {
    try {
      const payload = {
        Email: email,
        Username: username,
        Password: password,
        UserRole: role
      }
      const response = await auth.register(payload)
      if (response && !response.statusCode) {
        user.value = response
        userRole.value = role
        return { success: true, data: response }
      }
      return { success: false, error: response?.message || 'Ошибка регистрации' }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const login = async (email, username, password, role) => {
    try {
      const payload = {
        Email: email || undefined,
        Username: username || undefined,
        Password: password,
        UserRole: role || undefined
      }
      const response = await auth.login(payload)
      if (response && !response.statusCode) {
        user.value = response
        userRole.value = role
        return { success: true, data: response }
      }
      return { success: false, error: response?.message || 'Ошибка входа' }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const logout = async () => {
    try {
      await auth.logout()
      user.value = null
      userRole.value = null
      cartItems.value = []
      gamesList.value = [] // Используем переименованную переменную
      sellerGames.value = []
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Cart methods
  const loadCart = async () => {
    try {
      const response = await cart.getCart()
      if (response && !response.statusCode) {
        cartItems.value = response.cartItems || []
        return { success: true }
      }
      return { success: false, error: response?.message }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const addToCart = async (gameId, quantity = 1) => {
    try {
      const response = await cart.addItem(gameId, quantity)
      if (response && !response.statusCode) {
        cartItems.value = response.cartItems || []
        return { success: true }
      }
      return { success: false, error: response?.message }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const removeFromCart = async (gameId, quantity = 1) => {
    try {
      const response = await cart.removeItem(gameId, quantity)
      if (response && !response.statusCode) {
        cartItems.value = response.cartItems || []
        return { success: true }
      }
      return { success: false, error: response?.message }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Games methods (ИСПРАВЛЕНО: используем gamesApi вместо games)
  const loadGames = async (filters = {}, page = 1) => {
    try {
      // Формируем параметры запроса
      const params = new URLSearchParams()
      
      if (filters.minPrice !== undefined && filters.minPrice !== null) {
        params.append('MinPrice', filters.minPrice.toString())
      }
      
      if (filters.maxPrice !== undefined && filters.maxPrice !== null) {
        params.append('MaxPrice', filters.maxPrice.toString())
      }
      
      if (filters.gameTitle) {
        params.append('GameTitle', filters.gameTitle)
      }
      
      if (filters.genres && filters.genres.length > 0) {
        filters.genres.forEach(genre => {
          params.append('Genres', genre)
        })
      }
      
      params.append('Page', page.toString())
      params.append('PageSize', pagination.value.pageSize.toString())
      
      const queryString = params.toString() ? `?${params.toString()}` : ''
      
      const response = await gamesApi.getAll(queryString)
      
      if (response && !response.statusCode) {
        gamesList.value = response.content || []
        pagination.value = {
          page: response.pageNumber || page,
          pageSize: response.pageSize || pagination.value.pageSize,
          totalPages: response.totalPages || 0,
          totalElements: response.totalElements || 0
        }
        return { success: true }
      }
      return { success: false, error: response?.message }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const loadSellerGames = async (page = 1) => {
    try {
      const response = await gamesApi.getMyGames(page, pagination.value.pageSize)
      if (response && !response.statusCode) {
        sellerGames.value = response.content || []
        return { success: true }
      }
      return { success: false, error: response?.message }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const createGame = async (formData) => {
    try {
      const response = await gamesApi.create(formData)
      if (response && !response.statusCode) {
        // Добавляем созданную игру в список продавца
        sellerGames.value = [response, ...sellerGames.value]
        return { success: true, data: response }
      }
      return { success: false, error: response?.message }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const updateGame = async (id, formData) => {
    try {
      const response = await gamesApi.update(id, formData)
      if (response && !response.statusCode) {
        // Обновляем игру в списке продавца
        const index = sellerGames.value.findIndex(g => g.id === id)
        if (index !== -1) {
          sellerGames.value[index] = response
        }
        return { success: true, data: response }
      }
      return { success: false, error: response?.message }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const deleteGame = async (id) => {
    try {
      const response = await gamesApi.delete(id)
      if (!response.statusCode || response.statusCode === 200) {
        sellerGames.value = sellerGames.value.filter(g => g.id !== id)
        return { success: true }
      }
      return { success: false, error: response?.message }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Orders methods
  const loadOrders = async (page = 1) => {
    try {
      const response = await orders.getAll(page, pagination.value.pageSize)
      if (response && !response.statusCode) {
        return { success: true, data: response }
      }
      return { success: false, error: response?.message }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const createOrder = async (orderItems) => {
    try {
      const response = await orders.create(orderItems)
      if (response && !response.statusCode) {
        cartItems.value = []
        return { success: true, data: response }
      }
      return { success: false, error: response?.message }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Genres methods
  const loadGenres = async () => {
    try {
      const response = await genresApi.getAll()
      if (Array.isArray(response)) {
        genres.value = response
        return { success: true }
      }
      return { success: false, error: 'Ошибка загрузки жанров' }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Получить игру по ID
  const getGameById = async (id) => {
    try {
      const response = await gamesApi.getById(id)
      if (response && !response.statusCode) {
        currentGame.value = response
        return { success: true, data: response }
      }
      return { success: false, error: response?.message }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  return {
    // User
    user,
    userRole,
    isAuthenticated,
    register,
    login,
    logout,

    // Cart
    cartItems,
    cartCount,
    cartTotal,
    loadCart,
    addToCart,
    removeFromCart,

    // Games (ИСПРАВЛЕНО: возвращаем переименованные переменные)
    games: gamesList, // Экспортируем как games, но внутри это gamesList
    currentGame,
    sellerGames,
    genres,
    loadGames,
    loadSellerGames,
    createGame,
    updateGame,
    deleteGame,
    getGameById, // Добавили новый метод

    // Orders
    loadOrders,
    createOrder,

    // Genres
    loadGenres,

    // Pagination
    pagination
  }
})