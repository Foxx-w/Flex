const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api').replace(/\/$/, '')

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`
  const opts = { credentials: 'include', ...options }
  const res = await fetch(url, opts)
  const contentType = res.headers.get('content-type') || ''
  if (!res.ok) {
    let body = null
    try { if (contentType.includes('application/json')) body = await res.json(); else body = await res.text() } catch (e) { body = null }
    const err = new Error(body && body.Message ? body.Message : `Request failed: ${res.status}`)
    err.status = res.status
    err.body = body
    throw err
  }
  if (contentType.includes('application/json')) return res.json()
  return res.text()
}

export const auth = {
  register: (...args) => {
    let user = args.length === 1 && typeof args[0] === 'object'
      ? args[0]
      : { Email: args[0], Username: args[1], Password: args[2], UserRole: args[3] }
    // normalize keys to PascalCase expected by backend
    user = {
      Email: user.Email || user.email || '',
      Username: user.Username || user.username || '',
      Password: user.Password || user.password || '',
      UserRole: user.UserRole || user.userRole || user.role || ''
    }
    return request('/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(user) })
  },
  login: (...args) => {
    let user = args.length === 1 && typeof args[0] === 'object'
      ? args[0]
      : { Email: args[0], Username: args[1], Password: args[2], UserRole: args[3] }
    user = {
      Email: user.Email || user.email || '',
      Username: user.Username || user.username || '',
      Password: user.Password || user.password || '',
      UserRole: user.UserRole || user.userRole || user.role || ''
    }
    return request('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(user) })
  },
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me')
}

export const games = {
  list: (filters = {}) => {
    const params = new URLSearchParams()
    if (filters.MinPrice != null) params.append('MinPrice', filters.MinPrice)
    if (filters.MaxPrice != null) params.append('MaxPrice', filters.MaxPrice)
    if (filters.GameTitle) params.append('GameTitle', filters.GameTitle)
    if (filters.Genres && filters.Genres.length) filters.Genres.forEach(g => params.append('Genres', g))
    params.append('Page', filters.Page || 1)
    params.append('PageSize', filters.PageSize || 20)
    return request(`/games?${params.toString()}`)
  },
  get: (id) => request(`/games/${id}`),
  getMy: (page = 1, pageSize = 20) => request(`/games/my?Page=${page}&PageSize=${pageSize}`),
  create: (formData) => request('/games', { method: 'POST', body: formData }),
  update: (id, formData) => request(`/games/${id}`, { method: 'PUT', body: formData }),
  remove: (id) => request(`/games/${id}`, { method: 'DELETE' }),
  addKeys: (id, formData) => request(`/games/${id}/keys`, { method: 'POST', body: formData })
}

// Backwards-compatible aliases for older code
games.getAll = (minPrice, maxPrice, gameTitle, genres, page = 1, pageSize = 20) =>
  games.list({ MinPrice: minPrice, MaxPrice: maxPrice, GameTitle: gameTitle, Genres: genres, Page: page, PageSize: pageSize })
games.getById = (id) => games.get(id)
games.getMySeller = (page, pageSize) => games.getMy(page, pageSize)
games.delete = (id) => games.remove(id)

export const cart = {
  get: () => request('/carts'),
  add: (item) => request('/carts/items', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) }),
  remove: (item) => request('/carts/items', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) })
}

// compatibility
cart.getCart = () => cart.get()
cart.addItem = (gameId, quantity) => cart.add({ GameId: gameId, Quantity: quantity })
cart.removeItem = (gameId, quantity) => cart.remove({ GameId: gameId, Quantity: quantity })

export const orders = {
  list: (page = 1, pageSize = 20) => request(`/orders?page=${page}&pageSize=${pageSize}`),
  create: (order) => request('/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(order) })
}

// compat
orders.getOrders = (page, pageSize) => orders.list(page, pageSize)
orders.createOrder = (orderItems) => orders.create(orderItems)

export const genres = {
  list: () => request('/genres')
}

// compat
genres.getAll = () => genres.list()
