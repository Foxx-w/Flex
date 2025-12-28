import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { cart } from '../services/api'
import { useAuthStore } from './auth'

export const useCartStore = defineStore('cart', () => {
  // Состояние
  const items = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  
  const authStore = useAuthStore()
  
  // Computed свойства
  const totalItems = computed(() => 
    items.value.reduce((sum, item) => sum + item.quantity, 0)
  )
  
  const totalPrice = computed(() => 
    items.value.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  )
  
  const isEmpty = computed(() => items.value.length === 0)
  
  // Форматирование ответа API в удобный вид
  const formatCartItems = (cartResponse) => {
    if (!cartResponse || !cartResponse.cartItems) {
      return []
    }
    
    return cartResponse.cartItems.map(item => ({
      gameId: item.gameId,
      gameTitle: item.gameTitle,
      quantity: item.quantity,
      price: item.price || 0, // Убедитесь, что API возвращает price
      // Дополнительные поля, которые могут быть полезны
      imageUrl: item.imageUrl,
      description: item.description
    }))
  }
  
  // Получение корзины с сервера
  const fetchCart = async () => {
    // Проверяем авторизацию перед запросом
    if (!authStore.isAuthenticated || authStore.userRole !== 'CUSTOMER') {
      items.value = []
      error.value = 'Требуется авторизация покупателя'
      return []
    }
    
    isLoading.value = true
    error.value = null
    
    try {
      // Получаем корзину с сервера
      const cartResponse = await cart.get()
      
      // Форматируем данные
      items.value = formatCartItems(cartResponse)
      
      console.log('Корзина загружена:', items.value)
      return items.value
    } catch (err) {
      error.value = err.message || 'Ошибка загрузки корзины'
      console.error('Ошибка загрузки корзины:', err)
      
      // При ошибке авторизации очищаем корзину
      if (err.status === 401 || err.status === 403) {
        items.value = []
      }
      
      return []
    } finally {
      isLoading.value = false
    }
  }
  
  // Добавление товара в корзину
  const addToCart = async (gameId, quantity = 1) => {
    // Проверяем авторизацию
    if (!authStore.isAuthenticated || authStore.userRole !== 'CUSTOMER') {
      error.value = 'Требуется авторизация покупателя'
      return false
    }
    
    isLoading.value = true
    error.value = null
    
    try {
      // Отправляем запрос на сервер
      const response = await cart.addItem(gameId, quantity)
      
      // Обновляем локальное состояние
      if (response && response.cartItems) {
        items.value = formatCartItems(response)
      } else {
        // Если ответ не содержит cartItems, перезагружаем корзину
        await fetchCart()
      }
      
      console.log('Товар добавлен в корзину:', gameId, quantity)
      return true
    } catch (err) {
      error.value = err.message || 'Ошибка добавления товара'
      console.error('Ошибка добавления в корзину:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }
  
  // Удаление товара из корзины
  const removeFromCart = async (gameId, quantity = 1) => {
    // Проверяем авторизацию
    if (!authStore.isAuthenticated || authStore.userRole !== 'CUSTOMER') {
      error.value = 'Требуется авторизация покупателя'
      return false
    }
    
    isLoading.value = true
    error.value = null
    
    try {
      // Отправляем запрос на сервер
      const response = await cart.removeItem(gameId, quantity)
      
      // Обновляем локальное состояние
      if (response && response.cartItems) {
        items.value = formatCartItems(response)
      } else {
        // Если ответ не содержит cartItems, перезагружаем корзину
        await fetchCart()
      }
      
      console.log('Товар удален из корзины:', gameId, quantity)
      return true
    } catch (err) {
      error.value = err.message || 'Ошибка удаления товара'
      console.error('Ошибка удаления из корзины:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }
  
  // Удаление всей позиции (полностью)
  const removeItemCompletely = async (gameId) => {
    // Получаем текущее количество
    const item = items.value.find(i => i.gameId === gameId)
    if (!item) return false
    
    // Удаляем все количество
    return await removeFromCart(gameId, item.quantity)
  }
  
  // Очистка корзины
  const clearCart = async () => {
    // Проверяем авторизацию
    if (!authStore.isAuthenticated || authStore.userRole !== 'CUSTOMER') {
      error.value = 'Требуется авторизация покупателя'
      return false
    }
    
    isLoading.value = true
    error.value = null
    
    try {
      // Удаляем каждый товар по одному
      // Внимание: это может быть неэффективно при большом количестве товаров
      // Рассмотрите возможность добавления метода clear в API
      for (const item of [...items.value]) {
        await removeItemCompletely(item.gameId)
      }
      
      console.log('Корзина очищена')
      return true
    } catch (err) {
      error.value = err.message || 'Ошибка очистки корзины'
      console.error('Ошибка очистки корзины:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }
  
  // Обновление количества
  const updateQuantity = async (gameId, newQuantity) => {
    const item = items.value.find(i => i.gameId === gameId)
    if (!item) return false
    
    const difference = newQuantity - item.quantity
    
    if (difference > 0) {
      // Увеличиваем количество
      return await addToCart(gameId, difference)
    } else if (difference < 0) {
      // Уменьшаем количество
      return await removeFromCart(gameId, Math.abs(difference))
    }
    
    return true // Количество не изменилось
  }
  
  // Проверка наличия товара в корзине
  const isInCart = (gameId) => {
    return items.value.some(item => item.gameId === gameId)
  }
  
  // Получение количества конкретного товара
  const getItemQuantity = (gameId) => {
    const item = items.value.find(i => i.gameId === gameId)
    return item ? item.quantity : 0
  }
  
  // Получение цены товара
  const getItemPrice = (gameId) => {
    const item = items.value.find(i => i.gameId === gameId)
    return item ? item.price : 0
  }
  
  // Получение общей цены для товара
  const getItemTotalPrice = (gameId) => {
    const item = items.value.find(i => i.gameId === gameId)
    return item ? item.price * item.quantity : 0
  }
  
  // Синхронизация корзины с текущим состоянием авторизации
  const syncWithAuth = async () => {
    if (authStore.isAuthenticated && authStore.userRole === 'CUSTOMER') {
      await fetchCart()
    } else {
      // Если пользователь разлогинился или не покупатель - очищаем корзину
      items.value = []
      error.value = null
    }
  }
  
  // Инициализация корзины
  const init = async () => {
    if (authStore.isAuthenticated && authStore.userRole === 'CUSTOMER') {
      await fetchCart()
    }
  }
  
  // Вызываем инициализацию при создании store
  init()
  
  // Подписываемся на изменения авторизации
  authStore.$subscribe(() => {
    syncWithAuth()
  })
  
  return {
    // Состояние
    items: computed(() => items.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    
    // Computed
    totalItems,
    totalPrice,
    isEmpty,
    
    // Методы
    fetchCart,
    addToCart,
    removeFromCart,
    removeItemCompletely,
    clearCart,
    updateQuantity,
    isInCart,
    getItemQuantity,
    getItemPrice,
    getItemTotalPrice,
    syncWithAuth,
    init
  }
})