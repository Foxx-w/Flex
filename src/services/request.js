// services/request.js

const API_BASE_URL = 'http://localhost:8080/api' // Замените на ваш URL API

/**
 * Универсальный HTTP-клиент
 * @param {string} endpoint - Конечная точка API
 * @param {Object} options - Опции запроса
 * @returns {Promise<any>}
 */
export async function request(endpoint, options = {}) {
  // Получаем токен из localStorage
  const token = localStorage.getItem('auth_token')
  
  // Подготавливаем заголовки
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  
  // Добавляем токен авторизации, если есть
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  // Собираем полный URL
  const url = `${API_BASE_URL}${endpoint}`
  
  // Подготавливаем опции запроса
  const fetchOptions = {
    ...options,
    headers,
    credentials: 'include', // Для работы с куками, если нужно
  }
  
  try {
    const response = await fetch(url, fetchOptions)
    
    // Проверяем статус ответа
    if (!response.ok) {
      await handleError(response)
    }
    
    // Пытаемся распарсить JSON, даже если ответ пустой
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return await response.json()
    } else {
      return await response.text()
    }
    
  } catch (error) {
    console.error('Request failed:', error)
    throw error
  }
}

/**
 * Обработка ошибок HTTP
 * @param {Response} response 
 */
async function handleError(response) {
  let errorMessage = `HTTP ${response.status}: ${response.statusText}`
  
  try {
    const errorData = await response.json()
    
    // Обработка стандартных ошибок API
    if (errorData.message) {
      errorMessage = errorData.message
    } else if (errorData.error) {
      errorMessage = errorData.error
    } else if (errorData.errors && Array.isArray(errorData.errors)) {
      errorMessage = errorData.errors.join(', ')
    }
    
    // Специальная обработка для ошибок авторизации
    if (response.status === 401) {
      // Очищаем токен и редиректим на логин
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      
      // Можно добавить глобальное уведомление или редирект
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)
      }
    }
    
  } catch (e) {
    console.warn('Could not parse error response as JSON:', e)
  }
  
  // Создаем объект ошибки с дополнительной информацией
  const error = new Error(errorMessage)
  error.status = response.status
  error.statusText = response.statusText
  throw error
}

/**
 * GET запрос
 * @param {string} endpoint 
 * @param {Object} params 
 * @returns {Promise<any>}
 */
export function get(endpoint, params = {}) {
  const queryString = Object.keys(params).length > 0 
    ? '?' + new URLSearchParams(params).toString()
    : ''
  return request(endpoint + queryString)
}

/**
 * POST запрос
 * @param {string} endpoint 
 * @param {Object} data 
 * @returns {Promise<any>}
 */
export function post(endpoint, data = {}) {
  return request(endpoint, {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

/**
 * PUT запрос
 * @param {string} endpoint 
 * @param {Object} data 
 * @returns {Promise<any>}
 */
export function put(endpoint, data = {}) {
  return request(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

/**
 * PATCH запрос
 * @param {string} endpoint 
 * @param {Object} data 
 * @returns {Promise<any>}
 */
export function patch(endpoint, data = {}) {
  return request(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

/**
 * DELETE запрос
 * @param {string} endpoint 
 * @returns {Promise<any>}
 */
export function del(endpoint) {
  return request(endpoint, {
    method: 'DELETE'
  })
}

export default {
  request,
  get,
  post,
  put,
  patch,
  delete: del
}