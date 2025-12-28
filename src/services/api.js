// services/api.js
import { request } from './request'

// Auth API
export const auth = {
  login: (credentials) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  }),
  
  register: (userData) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  }),
  
  logout: () => request('/auth/logout', { method: 'POST' }),
  
  profile: () => request('/auth/profile'),
  
  updateProfile: (userData) => request('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(userData)
  })
}

// Games API
export const games = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/games${query ? `?${query}` : ''}`)
  },
  
  getById: (id) => request(`/games/${id}`),
  
  create: (gameData) => request('/games', {
    method: 'POST',
    body: JSON.stringify(gameData)
  }),
  
  update: (id, gameData) => request(`/games/${id}`, {
    method: 'PUT',
    body: JSON.stringify(gameData)
  }),
  
  delete: (id) => request(`/games/${id}`, { method: 'DELETE' }),
  
  search: (query) => request(`/games/search?q=${encodeURIComponent(query)}`)
}

// Genres API
export const genres = {
  getAll: () => request('/genres'),
  
  getById: (id) => request(`/genres/${id}`),
  
  getGamesByGenre: (id) => request(`/genres/${id}/games`)
}

// Orders API
export const orders = {
  getAll: (userId) => request(`/users/${userId}/orders`),
  
  getById: (id) => request(`/orders/${id}`),
  
  create: (orderData) => request('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData)
  }),
  
  updateStatus: (id, status) => request(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  })
}

// Cart API (уже есть у вас)
export const cart = {
  get: () => request('/carts'),
  
  add: (item) => {
    // CartItemRequest: { GameId, Quantity }
    return request('/carts/items', { 
      method: 'POST', 
      body: JSON.stringify(item) 
    })
  },
  
  remove: (item) => {
    // CartItemRequest: { GameId, Quantity }
    return request('/carts/items', { 
      method: 'DELETE', 
      body: JSON.stringify(item) 
    })
  }
}

// compatibility
cart.getCart = () => cart.get()

cart.addItem = (gameId, quantity) => cart.add({ 
  GameId: gameId, 
  Quantity: quantity 
})

cart.removeItem = (gameId, quantity) => cart.remove({ 
  GameId: gameId, 
  Quantity: quantity 
})

// Дополнительно: можно экспортировать всё вместе как default
export default {
  auth,
  games,
  genres,
  orders,
  cart
}