const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

// Local mock data (used when VITE_API_URL is not provided)
import * as localGames from '../data/games'

// Auth API
const USE_REMOTE_AUTH = !!import.meta.env.VITE_API_URL

let auth

if (!USE_REMOTE_AUTH) {
  // Простая локальная мок-реализация для разработки без бэкенда
  const STORAGE_USER_KEY = 'mock_user'
  const STORAGE_TOKEN_KEY = 'mock_token'

  const saveMock = (user) => {
    const token = `mock-token-${Date.now()}`
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user))
    localStorage.setItem(STORAGE_TOKEN_KEY, token)
    return { user, token }
  }

  const clearMock = () => {
    localStorage.removeItem(STORAGE_USER_KEY)
    localStorage.removeItem(STORAGE_TOKEN_KEY)
  }

  auth = {
    register: async (email, username, password, userRole) => {
      const user = { id: Date.now(), email, username, role: userRole || 'CUSTOMER' }
      return saveMock(user)
    },

    login: async (email, username, password, userRole) => {
      // При локальном тесте допускаем любую комбинацию
      const user = { id: Date.now(), email: email || null, username: username || email || 'guest', role: userRole || 'CUSTOMER' }
      return saveMock(user)
    },

    logout: async () => {
      clearMock()
      return { ok: true }
    },

    me: async () => {
      const raw = localStorage.getItem(STORAGE_USER_KEY)
      if (!raw) return { statusCode: 401, message: 'Not authenticated' }
      try { return JSON.parse(raw) } catch (e) { return { statusCode: 500 } }
    }
  }

} else {
  auth = {
    register: (email, username, password, userRole) =>
      fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password, userRole }),
        credentials: 'include'
      }).then(r => r.json()),

    login: (email, username, password, userRole) =>
      fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password, userRole }),
        credentials: 'include'
      }).then(r => r.json()),

    logout: () =>
      fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      }).then(r => r.json()),

    me: () =>
      fetch(`${API_BASE}/auth/me`, {
        credentials: 'include'
      }).then(r => r.json())
  }
}

export { auth }

// Games API
export const games = {
  getAll: (minPrice, maxPrice, gameTitle, genres, page = 1, pageSize = 20) => {
    if (!import.meta.env.VITE_API_URL) return localGames.getAll(minPrice, maxPrice, gameTitle, genres, page, pageSize)

    const params = new URLSearchParams()
    if (minPrice) params.append('minPrice', minPrice)
    if (maxPrice) params.append('maxPrice', maxPrice)
    if (gameTitle) params.append('gameTitle', gameTitle)
    if (genres && genres.length) genres.forEach(g => params.append('genres', g))
    params.append('page', page)
    params.append('pageSize', pageSize)

    return fetch(`${API_BASE.replace(/\/api$/, '')}/api/games?${params}`, { credentials: 'include' })
      .then(r => r.json())
  },

  getById: (id) =>
    (!import.meta.env.VITE_API_URL ? localGames.getById(id) : fetch(`${API_BASE.replace(/\/api$/, '')}/api/games/${id}`, { credentials: 'include' }).then(r => r.json())),

  getMySeller: (page = 1, pageSize = 20) =>
    (!import.meta.env.VITE_API_URL ? localGames.getAll(null, null, null, null, page, pageSize) : fetch(`${API_BASE.replace(/\/api$/, '')}/api/games/my?page=${page}&pageSize=${pageSize}`, {
      credentials: 'include'
    }).then(r => r.json())),

  create: (formData) =>
    (!import.meta.env.VITE_API_URL ? localGames.create(formData) : fetch(`${API_BASE.replace(/\/api$/, '')}/api/games`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    }).then(r => r.json())),

  update: (id, formData) =>
    (!import.meta.env.VITE_API_URL ? localGames.update(id, formData) : fetch(`${API_BASE.replace(/\/api$/, '')}/api/games/${id}`, {
      method: 'PUT',
      body: formData,
      credentials: 'include'
    }).then(r => r.json())),

  delete: (id) =>
    (!import.meta.env.VITE_API_URL ? localGames.remove(id) : fetch(`${API_BASE.replace(/\/api$/, '')}/api/games/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    }).then(r => r.json())),

  addKeys: (id, formData) =>
    (!import.meta.env.VITE_API_URL ? localGames.addKeys(id, formData) : fetch(`${API_BASE.replace(/\/api$/, '')}/api/games/${id}/keys`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    }).then(r => r.json()))
}

// Cart API
export const cart = {
  getCart: () =>
    fetch(`${API_BASE}/carts`, { credentials: 'include' })
      .then(r => r.json()),

  addItem: (gameId, quantity) =>
    fetch(`${API_BASE}/carts/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ GameId: gameId, Quantity: quantity }),
      credentials: 'include'
    }).then(r => r.json()),

  removeItem: (gameId, quantity) =>
    fetch(`${API_BASE}/carts/items`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ GameId: gameId, Quantity: quantity }),
      credentials: 'include'
    }).then(r => r.json())
}

// Orders API
export const orders = {
  getOrders: (page = 1, pageSize = 20) =>
    fetch(`${API_BASE}/orders?page=${page}&pageSize=${pageSize}`, {
      credentials: 'include'
    }).then(r => r.json()),

  createOrder: (orderItems) =>
    // Backend expects OrderRequest with OrderItems: List<OrderItemRequest>
    fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ OrderItems: (orderItems || []).map(it => ({ GameId: it.gameId ?? it.GameId ?? it.gameId, Quantity: it.quantity ?? it.Quantity ?? 1 })) }),
      credentials: 'include'
    }).then(r => r.json())
}

// Genres API
export const genres = {
  getAll: () =>
    fetch(`${API_BASE}/genres`, { credentials: 'include' })
      .then(r => r.json())
}
