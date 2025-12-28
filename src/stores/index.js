// stores/index.js
import { useAuthStore } from './auth'
import { useCartStore } from './cart'

// Функция для инициализации всех хранилищ
export const initializeStores = async () => {
  const authStore = useAuthStore()
  const cartStore = useCartStore()
  
  // Инициализируем auth store
  await authStore.checkAuth()
  
  // Если пользователь авторизован как покупатель, загружаем корзину
  if (authStore.isAuthenticated && authStore.userRole === 'CUSTOMER') {
    await cartStore.fetchCart()
  }
  
  console.log('Все хранилища инициализированы')
}

// Экспортируем функции для использования
export { useAuthStore, useCartStore }