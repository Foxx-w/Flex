<template>
  <div class="cart-root">
    <SiteHeader />

    <main class="cart-canvas">
      <div class="cart-inner">
        <section class="cart-container">
          <div class="cart-header">
            <h1 class="cart-title">Корзина</h1>
            <div v-if="cartItems.length > 0" class="cart-count">
              <span class="cart-items-number">{{ cartItems.length }}</span>
              <span class="cart-items-label">товаров</span>
            </div>
          </div>

          <!-- Уведомление для неавторизованных пользователей -->
          <div v-if="!isAuthenticated" class="auth-notice">
            <div class="auth-icon">🔒</div>
            <div class="auth-text">
              <p>Корзина доступна только авторизованным пользователям.</p>
              <p>
                <router-link to="/login" class="auth-login-link">Войдите</router-link>
                как покупатель для доступа к корзине.
              </p>
            </div>
          </div>

          <!-- Уведомление для продавцов -->
          <div v-else-if="!isCustomer" class="role-notice">
            <div class="role-icon">👨‍💼</div>
            <div class="role-text">
              <p>Вы вошли как продавец.</p>
              <p>Корзина доступна только для покупателей.</p>
              <router-link to="/" class="role-link">Вернуться к покупкам</router-link>
            </div>
          </div>

          <!-- Основное содержимое для авторизованных покупателей -->
          <div v-else class="cart-content">
            <div v-if="cartItems.length === 0" class="cart-empty">
              <div class="empty-icon">🛒</div>
              <h3 class="empty-title">Корзина пуста</h3>
              <p class="empty-text">Добавьте товары, чтобы сделать заказ</p>
              <router-link to="/" class="empty-link">
                Перейти к покупкам
              </router-link>
            </div>

            <div v-else>
              <div class="cart-controls">
                <CheckBox 
                  v-model="allChecked" 
                  class="select-all-checkbox" 
                  @update:modelValue="toggleAllItems"
                />
                <div class="cart-select-all">Выбрать всё</div>
              </div>

              <div class="cart-divider"></div>

              <div class="cart-body">
                <CartItem 
                  v-for="item in cartItems" 
                  :key="item.gameId"
                  :item="item"
                  :checked="isItemChecked(item.gameId)"
                  @delete="handleItemDelete"
                  @update:checked="handleItemChecked"
                  @quantity-change="handleQuantityChange"
                />
              </div>
            </div>
          </div>
        </section>

        <!-- Боковая панель с итогами (только для покупателей) -->
        <aside v-if="isCustomer && cartItems.length > 0" class="cart-sidebar">
          <div class="summary-box">
            <div class="summary-title">Итого:</div>
            <div class="summary-price">{{ totalPrice }} ₽</div>
            
            <button 
              class="order-btn"
              @click="handleOrder"
              :disabled="isOrdering || cartItems.length === 0"
            >
              {{ isOrdering ? 'Оформление...' : 'Оформить заказ' }}
            </button>
            
            <div class="summary-note">{{ cartItems.length }} товаров</div>
          </div>
        </aside>
      </div>
    </main>

    <Footer />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import SiteHeader from '../components/Header.vue'
import Footer from '../components/Footer.vue'
import CheckBox from '../components/CheckBox.vue'
import CartItem from '../components/CartItem.vue'

const API_URL = 'http://localhost:8080/api'

const router = useRouter()

const allChecked = ref(false)
const isOrdering = ref(false)
const checkedItems = ref(new Set())
const cartItems = ref([])
const isLoading = ref(false)

// Проверки авторизации и роли
const isAuthenticated = computed(() => {
  return localStorage.getItem('userRole') !== null
})

const isCustomer = computed(() => {
  return localStorage.getItem('userRole') === 'CUSTOMER'
})

const canAccessCart = computed(() => isAuthenticated.value && isCustomer.value)

// Загрузка корзины
const fetchCart = async () => {
  if (!canAccessCart.value) {
    cartItems.value = []
    return
  }

  try {
    isLoading.value = true
    const authToken = localStorage.getItem('auth_token')
    
    if (!authToken) {
      throw new Error('Требуется авторизация')
    }

    // GET /api/carts – получить корзину (Покупатель)
    const response = await fetch(`${API_URL}/carts`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      credentials: 'include'
    })

    if (!response.ok) {
      // Если 404 или пустая корзина
      if (response.status === 404) {
        cartItems.value = []
        return
      }
      
      try {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP ${response.status}`)
      } catch {
        throw new Error(`HTTP ${response.status}`)
      }
    }

    const data = await response.json()
    
    // Обрабатываем CartResponse: { cartItems: CartItemResponse[] }
    if (data && Array.isArray(data.cartItems)) {
      cartItems.value = data.cartItems
    } else if (Array.isArray(data)) {
      cartItems.value = data
    } else {
      cartItems.value = []
      console.warn('Неожиданный формат ответа корзины:', data)
    }

  } catch (error) {
    console.error('Ошибка загрузки корзины:', error)
    cartItems.value = []
  } finally {
    isLoading.value = false
  }
}

// Обновление состояния чекбокса "Выбрать всё"
const updateAllCheckedState = () => {
  if (cartItems.value.length === 0) {
    allChecked.value = false
    return
  }
  
  allChecked.value = cartItems.value.every(item => checkedItems.value.has(item.gameId))
}

// Проверка, выбран ли товар
const isItemChecked = (gameId) => {
  return checkedItems.value.has(gameId)
}

// Обработчик изменения состояния чекбокса товара
const handleItemChecked = ({ itemId, checked }) => {
  if (checked) {
    checkedItems.value.add(itemId)
  } else {
    checkedItems.value.delete(itemId)
  }
  updateAllCheckedState()
}

// Выбрать/снять все товары
const toggleAllItems = (checked) => {
  if (checked) {
    // Выбрать все
    cartItems.value.forEach(item => {
      checkedItems.value.add(item.gameId)
    })
  } else {
    // Снять все
    checkedItems.value.clear()
  }
}

// Удаление товара из корзины
const handleItemDelete = async (gameId) => {
  try {
    const authToken = localStorage.getItem('auth_token')
    
    if (!authToken) {
      alert('Требуется авторизация')
      return false
    }

    // DELETE /api/carts/items – удалить указанное количество товара из корзины
    // CartItemRequest: { GameId, Quantity }
    const response = await fetch(`${API_URL}/carts/items`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        GameId: gameId,
        Quantity: 1
      }),
      credentials: 'include'
    })

    if (!response.ok) {
      try {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP ${response.status}`)
      } catch {
        throw new Error(`HTTP ${response.status}`)
      }
    }

    // Удаляем товар из локального списка
    cartItems.value = cartItems.value.filter(item => item.gameId !== gameId)
    checkedItems.value.delete(gameId)
    
    alert('Товар удален из корзины')
    return true

  } catch (error) {
    console.error('Ошибка удаления товара:', error)
    alert(error.message || 'Ошибка удаления товара')
    return false
  }
}

// Изменение количества товара
const handleQuantityChange = async ({ gameId, newQuantity }) => {
  try {
    const authToken = localStorage.getItem('auth_token')
    
    if (!authToken) {
      alert('Требуется авторизация')
      return
    }

    const item = cartItems.value.find(item => item.gameId === gameId)
    if (!item) return

    // Определяем, нужно ли добавить или удалить
    const quantityDiff = newQuantity - item.quantity
    
    if (quantityDiff > 0) {
      // Добавляем товар
      await addToCart(gameId, quantityDiff)
    } else if (quantityDiff < 0) {
      // Удаляем товар
      await removeFromCart(gameId, Math.abs(quantityDiff))
    }

    // Обновляем локальное состояние
    const updatedItem = cartItems.value.find(item => item.gameId === gameId)
    if (updatedItem) {
      updatedItem.quantity = newQuantity
    }

  } catch (error) {
    console.error('Ошибка изменения количества:', error)
    alert('Ошибка изменения количества')
  }
}

// Добавление товара в корзину
const addToCart = async (gameId, quantity = 1) => {
  try {
    const authToken = localStorage.getItem('auth_token')
    
    if (!authToken) {
      throw new Error('Требуется авторизация')
    }

    // POST /api/carts/items – добавить позицию в корзину
    const response = await fetch(`${API_URL}/carts/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        GameId: gameId,
        Quantity: quantity
      }),
      credentials: 'include'
    })

    if (!response.ok) {
      try {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP ${response.status}`)
      } catch {
        throw new Error(`HTTP ${response.status}`)
      }
    }

    return await response.json()

  } catch (error) {
    console.error('Ошибка добавления в корзину:', error)
    throw error
  }
}

// Удаление товара из корзины (частичное)
const removeFromCart = async (gameId, quantity = 1) => {
  try {
    const authToken = localStorage.getItem('auth_token')
    
    if (!authToken) {
      throw new Error('Требуется авторизация')
    }

    // DELETE /api/carts/items – удалить указанное количество товара из корзины
    const response = await fetch(`${API_URL}/carts/items`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        GameId: gameId,
        Quantity: quantity
      }),
      credentials: 'include'
    })

    if (!response.ok) {
      try {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP ${response.status}`)
      } catch {
        throw new Error(`HTTP ${response.status}`)
      }
    }

    return await response.json()

  } catch (error) {
    console.error('Ошибка удаления из корзины:', error)
    throw error
  }
}

// Оформление заказа
const handleOrder = async () => {
  if (isOrdering.value || cartItems.value.length === 0) return
  
  isOrdering.value = true
  
  try {
    const authToken = localStorage.getItem('auth_token')
    
    if (!authToken) {
      alert('Требуется авторизация')
      return
    }

    // Собираем данные заказа в формате OrderRequest
    const orderRequest = {
      OrderItems: cartItems.value.map(item => ({
        GameId: item.gameId,
        Quantity: item.quantity
      }))
    }

    console.log('Отправляем заказ:', orderRequest)

    // POST /api/orders – оформить заказ (Покупатель)
    const response = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(orderRequest),
      credentials: 'include'
    })

    if (!response.ok) {
      try {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP ${response.status}`)
      } catch {
        throw new Error(`HTTP ${response.status}`)
      }
    }

    const orderData = await response.json()
    
    alert(`Заказ оформлен успешно! Сумма: ${orderData.totalAmount || totalPrice.value} ₽`)
    
    // Очищаем корзину после успешного заказа
    cartItems.value = []
    checkedItems.value.clear()
    allChecked.value = false

  } catch (error) {
    console.error('Ошибка оформления заказа:', error)
    alert(error.message || 'Ошибка оформления заказа. Попробуйте снова.')
  } finally {
    isOrdering.value = false
  }
}

// Общая сумма корзины
const totalPrice = computed(() => {
  return cartItems.value.reduce((sum, item) => {
    const price = item.price || 0
    const quantity = item.quantity || 1
    return sum + (price * quantity)
  }, 0)
})

// Общее количество товаров
const totalItems = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + (item.quantity || 1), 0)
})

// Загружаем корзину при монтировании
onMounted(async () => {
  await fetchCart()
})

// Следим за изменениями авторизации
watch([isAuthenticated, isCustomer], async ([authenticated, customer]) => {
  if (authenticated && customer) {
    await fetchCart()
  } else {
    cartItems.value = []
    checkedItems.value.clear()
    allChecked.value = false
  }
})

// Следим за изменениями в корзине
watch(cartItems, () => {
  updateAllCheckedState()
}, { deep: true })
</script>

<style scoped>
/* Стили остаются без изменений */
.cart-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #F5F5F5;
}

.cart-canvas {
  flex: 1;
  display: flex;
  justify-content: center;
  min-height: calc(100vh - 164px);
  padding: 30px 20px;
  box-sizing: border-box;
}

.cart-inner {
  width: 100%;
  max-width: 1200px;
  display: flex;
  gap: 30px;
  padding: 0;
  box-sizing: border-box;
  align-items: flex-start;
}

.cart-container {
  flex: 1;
  background: #FFFFFF;
  border-radius: 12px;
  padding: 25px 30px;
  box-sizing: border-box;
  min-height: 100%;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.cart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.cart-title {
  font-size: 28px;
  margin: 0;
  font-weight: 600;
  font-family: 'Montserrat Alternates', sans-serif;
  color: #333;
}

.cart-count {
  font-size: 18px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 4px;
}

.cart-items-number {
  font-weight: 600;
  color: #333;
}

.cart-items-label {
  color: #666;
}

.cart-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
}

.select-all-checkbox {
  transform: scale(1.1);
}

.cart-select-all {
  font-size: 16px;
  font-family: 'Montserrat Alternates', sans-serif;
  color: #333;
  font-weight: 500;
}

.cart-divider {
  height: 1px;
  background: #E0E0E0;
  margin-bottom: 10px;
}

.cart-body {
  margin-top: 10px;
}

.cart-sidebar {
  width: 300px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  position: sticky;
  top: 30px;
}

.summary-box {
  width: 300px;
  min-height: 240px;
  border: 2px solid #A53DFF;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: transparent;
  box-sizing: border-box;
  padding: 24px;
  font-family: 'Montserrat Alternates', sans-serif;
  box-shadow: 0 3px 15px rgba(165, 61, 255, 0.08);
}

.summary-title {
  font-size: 22px;
  font-weight: 600;
  color: #333;
}

.summary-price {
  font-size: 28px;
  color: #A53DFF;
  font-weight: 700;
  margin: 5px 0 10px 0;
}

.order-btn {
  background: #A53DFF;
  color: #fff;
  border: 0;
  border-radius: 8px;
  padding: 12px 40px;
  font-size: 16px;
  cursor: pointer;
  font-family: 'Montserrat Alternates', sans-serif;
  font-weight: 600;
  text-align: center;
  transition: all 0.2s;
  margin: 5px 0;
  width: 100%;
  max-width: 200px;
}

.order-btn:hover:not(:disabled) {
  background: #8C2BD9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(165, 61, 255, 0.2);
}

.order-btn:active:not(:disabled) {
  transform: translateY(0);
}

.order-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.summary-note {
  font-size: 14px;
  color: #666;
  margin-top: 5px;
}

.auth-notice,
.role-notice {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  padding: 15px 20px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  color: white;
  animation: fadeIn 0.5s ease;
  font-family: 'Montserrat', sans-serif;
}

.role-notice {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.auth-icon,
.role-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.auth-text,
.role-text {
  flex: 1;
  font-size: 14px;
  line-height: 1.4;
}

.auth-text p,
.role-text p {
  margin: 0 0 5px 0;
}

.auth-text p:last-child,
.role-text p:last-child {
  margin-bottom: 0;
}

.auth-login-link,
.role-link {
  color: #03c3e6;
  text-decoration: none;
  font-weight: 600;
  transition: opacity 0.2s;
}

.auth-login-link:hover,
.role-link:hover {
  opacity: 0.8;
  text-decoration: underline;
}

.cart-content {
  min-height: 300px;
}

.cart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  border-radius: 10px;
  background: #F8F8F8;
  margin-top: 20px;
}

.empty-icon {
  font-size: 60px;
  margin-bottom: 20px;
  opacity: 0.7;
}

.empty-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 10px 0;
  color: #333;
  font-family: 'Montserrat Alternates', sans-serif;
}

.empty-text {
  font-size: 15px;
  color: #666;
  margin: 0 0 15px 0;
  max-width: 250px;
}

.empty-link {
  background: #A53DFF;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 10px 20px;
  font-size: 14px;
  text-decoration: none;
  font-family: 'Montserrat Alternates', sans-serif;
  transition: background 0.2s;
}

.empty-link:hover {
  background: #8C2BD9;
}

@media (max-width: 1100px) {
  .cart-inner {
    gap: 25px;
  }
  
  .cart-sidebar {
    width: 280px;
  }
  
  .summary-box {
    width: 280px;
    min-height: 220px;
  }
}

@media (max-width: 975px) {
  .cart-canvas {
    padding: 20px 15px;
  }
  
  .cart-inner {
    flex-direction: column;
    gap: 20px;
    align-items: stretch;
  }
  
  .cart-sidebar {
    width: 100%;
    order: -1;
    justify-content: center;
    position: static;
  }
  
  .summary-box {
    width: 100%;
    max-width: 100%;
    min-height: 200px;
  }
  
  .cart-container {
    order: 0;
    width: 100%;
    padding: 20px;
  }
}

@media (max-width: 768px) {
  .cart-canvas {
    padding: 15px 10px;
  }
  
  .cart-inner {
    gap: 15px;
  }
  
  .cart-container {
    padding: 16px;
  }
  
  .cart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .cart-title {
    font-size: 24px;
  }
  
  .cart-count {
    font-size: 16px;
  }
  
  .auth-notice,
  .role-notice {
    flex-direction: column;
    text-align: center;
    padding: 15px;
  }
  
  .auth-icon,
  .role-icon {
    font-size: 28px;
  }
  
  .summary-box {
    min-height: 180px;
    padding: 20px;
  }
  
  .summary-title {
    font-size: 20px;
  }
  
  .summary-price {
    font-size: 24px;
  }
  
  .order-btn {
    padding: 10px 30px;
    font-size: 15px;
    max-width: 180px;
  }
}

@media (max-width: 480px) {
  .cart-canvas {
    padding: 12px 8px;
  }
  
  .cart-container {
    padding: 14px;
  }
  
  .cart-title {
    font-size: 22px;
  }
  
  .cart-select-all {
    font-size: 15px;
  }
  
  .summary-box {
    min-height: 170px;
    padding: 16px;
    border-radius: 10px;
  }
  
  .summary-title {
    font-size: 18px;
  }
  
  .summary-price {
    font-size: 22px;
  }
  
  .order-btn {
    padding: 10px 25px;
  }
}
</style>