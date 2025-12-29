<template>
  <div class="history-root">
    <SiteHeader />

    <main class="history-canvas">
      <div class="history-inner">
        <section class="history-container">
          <div class="history-header">
            <h1 class="history-title">История покупок</h1>
            <div class="history-count">
              <span class="history-items-label">товаров</span>
              <span class="history-items-number">{{ totalItems }}</span>
            </div>
          </div>

          <div class="history-body">
            <!-- Состояние загрузки -->
            <div v-if="loading" class="history-loading">
              Загрузка истории покупок...
            </div>

            <!-- Состояние ошибки -->
            <div v-else-if="error" class="history-error">
              <p>Не удалось загрузить историю покупок</p>
              <button @click="loadOrders" class="retry-button">Повторить</button>
            </div>

            <!-- Состояние пустого списка -->
            <div v-else-if="orders.length === 0" class="history-empty">
              <p>У вас пока нет покупок</p>
              <router-link to="/" class="browse-button">Перейти к играм</router-link>
            </div>

            <!-- Список заказов -->
            <div v-else class="orders-list">
              <div v-for="order in orders" :key="order.id" class="order-card">
                <div class="order-header">
                  <span class="order-id">Заказ #{{ order.id }}</span>
                  <span class="order-date">{{ formatDate(order.createdAt) }}</span>
                  <span class="order-status" :class="getStatusClass(order.status)">
                    {{ getStatusText(order.status) }}
                  </span>
                  <span class="order-total">{{ formatPrice(order.totalAmount) }}</span>
                </div>
                
                <div class="order-items">
                  <div v-for="item in order.orderItems" :key="item.gameId" class="order-item">
                    <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.gameTitle" class="item-image" />
                    <div class="item-info">
                      <h4 class="item-title">{{ item.gameTitle }}</h4>
                      <p class="item-price">{{ formatPrice(item.price) }}</p>
                    </div>
                    <span class="item-quantity">×{{ item.quantity }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside class="history-sidebar">
          <img src="/src/assets/photos/history.png" alt="История покупок" class="history-image" />
        </aside>
      </div>
    </main>

    <Footer />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import SiteHeader from '../components/Header.vue'
import Footer from '../components/Footer.vue'

const API_URL = 'http://localhost:8080/api'
const router = useRouter()

const loading = ref(false)
const error = ref(null)
const orders = ref([])

// Загрузка истории заказов
const loadOrders = async () => {
  loading.value = true
  error.value = null
  
  try {
    // Проверяем авторизацию
    const userRole = localStorage.getItem('userRole')
    const authToken = localStorage.getItem('auth_token')
    
    if (!userRole) {
      router.push('/login')
      return
    }
    
    if (userRole !== 'CUSTOMER') {
      error.value = 'История покупок доступна только покупателям'
      loading.value = false
      return
    }
    
    if (!authToken) {
      alert('Требуется авторизация')
      router.push('/login')
      return
    }
    
    // GET /api/orders?page=...&pageSize=... – получить страницу заказов (Покупатель)
    const response = await fetch(`${API_URL}/orders?Page=1&PageSize=100`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
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
    
    const data = await response.json()
    
    // Обрабатываем ответ в формате Page<OrderResponse>
    if (data && Array.isArray(data.content)) {
      orders.value = data.content
    } else if (Array.isArray(data)) {
      orders.value = data
    } else if (data && data.items) {
      orders.value = data.items
    } else {
      orders.value = []
      console.warn('Неожиданный формат ответа заказов:', data)
    }
    
    console.log('Загружено заказов:', orders.value.length)
    
  } catch (err) {
    console.error('Ошибка загрузки заказов:', err)
    error.value = err.message || 'Ошибка загрузки истории покупок'
  } finally {
    loading.value = false
  }
}

// Общее количество товаров во всех заказах
const totalItems = computed(() => {
  return orders.value.reduce((total, order) => {
    return total + (order.orderItems?.reduce((sum, item) => sum + item.quantity, 0) || 0)
  }, 0)
})

// Форматирование даты
const formatDate = (dateString) => {
  if (!dateString) return 'Дата не указана'
  
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateString
  }
}

// Форматирование цены
const formatPrice = (price) => {
  if (!price && price !== 0) return '0 ₽'
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0
  }).format(price)
}

// Класс для статуса заказа
const getStatusClass = (status) => {
  const statusMap = {
    'COMPLETED': 'status-completed',
    'PROCESSING': 'status-processing',
    'CANCELLED': 'status-cancelled',
    'DELIVERED': 'status-delivered',
    'PAID': 'status-paid',
    'SHIPPED': 'status-shipped'
  }
  return statusMap[status] || 'status-default'
}

// Текст статуса заказа
const getStatusText = (status) => {
  const statusTexts = {
    'COMPLETED': 'Завершён',
    'PROCESSING': 'Обрабатывается',
    'CANCELLED': 'Отменён',
    'DELIVERED': 'Доставлен',
    'PAID': 'Оплачен',
    'SHIPPED': 'Отправлен'
  }
  return statusTexts[status] || status || 'Не указан'
}

// Загружаем историю при монтировании
onMounted(() => {
  loadOrders()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Montserrat+Alternates:wght@400;600&display=swap');

/* Основные стили */
.history-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #F5F5F5;
  transition: all 0.3s ease;
}

.history-canvas {
  flex: 1;
  display: flex;
  justify-content: center;
  min-height: calc(100vh - 164px);
  padding: 40px 20px;
  box-sizing: border-box;
  transition: all 0.3s ease;
}

.history-inner {
  width: 100%;
  max-width: 1400px;
  display: flex;
  gap: 140px;
  padding: 0;
  box-sizing: border-box;
  align-items: stretch;
  transition: all 0.3s ease;
}

.history-container {
  flex: 1;
  background: #FDFDFD;
  border-radius: 30px;
  padding: 30px 36px;
  box-sizing: border-box;
  min-height: 100%;
  transition: all 0.3s ease;
}

.history-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid #E0E0E0;
  transition: all 0.3s ease;
}

.history-title {
  font-size: 36px;
  margin: 0;
  font-weight: 500;
  font-family: 'Montserrat Alternates', sans-serif;
  color: #111;
  transition: font-size 0.3s ease;
}

.history-count {
  font-size: 20px;
  color: #676767;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  font-family: 'Montserrat Alternates', sans-serif;
}

.history-body {
  margin-top: 24px;
  transition: all 0.3s ease;
}

.history-sidebar {
  width: 340px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
  transition: all 0.3s ease;
}

.history-image {
  width: 423px;
  height: 624px;
  border-radius: 30px;
  object-fit: cover;
  transition: all 0.3s ease;
}

.history-items-label {
  color: #676767;
  font-family: 'Montserrat Alternates', sans-serif;
  font-size: 20px;
  transition: font-size 0.3s ease;
}

.history-items-number {
  min-width: 56px;
  display: inline-block;
  font-weight: 600;
  color: #333;
  transition: all 0.3s ease;
}

/* Стили для состояний */
.history-loading,
.history-error,
.history-empty {
  text-align: center;
  padding: 60px 20px;
  color: #676767;
  font-family: 'Montserrat Alternates', sans-serif;
}

.history-loading {
  font-size: 18px;
}

.history-error {
  background: #fff5f5;
  border-radius: 15px;
  border: 1px solid #ffcccc;
}

.history-empty {
  background: #f8f8f8;
  border-radius: 15px;
  border: 1px dashed #ddd;
}

.history-error p,
.history-empty p {
  margin: 0 0 15px 0;
  font-size: 16px;
}

.retry-button,
.browse-button {
  margin-top: 15px;
  padding: 10px 24px;
  background: #A53DFF;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  text-decoration: none;
  display: inline-block;
  transition: all 0.3s ease;
  font-family: 'Montserrat Alternates', sans-serif;
}

.retry-button:hover,
.browse-button:hover {
  background: #8C2BD9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(165, 61, 255, 0.2);
}

/* Стили для списка заказов */
.orders-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.order-card {
  border: 1px solid #e0e0e0;
  border-radius: 16px;
  padding: 20px;
  background: white;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.order-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 15px;
  flex-wrap: wrap;
  gap: 10px;
  font-family: 'Montserrat', sans-serif;
}

.order-id {
  font-weight: 600;
  color: #333;
  font-size: 16px;
}

.order-date {
  color: #666;
  font-size: 14px;
}

.order-status {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  font-family: 'Montserrat', sans-serif;
}

.status-completed {
  background: #e7f7ef;
  color: #0a9c4d;
}

.status-processing {
  background: #e7f0ff;
  color: #4a6cf7;
}

.status-cancelled {
  background: #ffeaea;
  color: #f74a4a;
}

.status-delivered {
  background: #f0f7ff;
  color: #2a8bf7;
}

.status-paid {
  background: #f0fff4;
  color: #52c41a;
}

.status-shipped {
  background: #f0f7ff;
  color: #1890ff;
}

.status-default {
  background: #f5f5f5;
  color: #666;
}

.order-total {
  font-weight: 700;
  font-size: 18px;
  color: #333;
  font-family: 'Montserrat Alternates', sans-serif;
}

/* Стили для элементов заказа */
.order-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.order-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px;
  border-radius: 8px;
  background: #fafafa;
  transition: all 0.3s ease;
}

.order-item:hover {
  background: #f5f5f5;
}

.item-image {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid #eee;
}

.item-info {
  flex: 1;
}

.item-title {
  margin: 0 0 5px 0;
  font-size: 16px;
  color: #333;
  font-weight: 500;
  font-family: 'Montserrat', sans-serif;
}

.item-price {
  margin: 0;
  color: #666;
  font-size: 14px;
  font-family: 'Montserrat', sans-serif;
}

.item-quantity {
  font-weight: 600;
  color: #333;
  font-size: 16px;
  font-family: 'Montserrat Alternates', sans-serif;
}

/* Медиа-запросы */
@media (max-width: 1600px) {
  .history-inner {
    max-width: 1300px;
    gap: 120px;
  }
  
  .history-sidebar {
    width: 320px;
  }
  
  .history-image {
    width: 400px;
    height: 590px;
  }
}

@media (max-width: 1500px) {
  .history-inner {
    max-width: 1200px;
    gap: 100px;
  }
  
  .history-sidebar {
    width: 300px;
  }
  
  .history-image {
    width: 380px;
    height: 560px;
  }
}

@media (max-width: 1400px) {
  .history-inner {
    max-width: 1100px;
    gap: 80px;
  }
  
  .history-sidebar {
    width: 280px;
  }
  
  .history-image {
    width: 350px;
    height: 520px;
    opacity: 0.95;
  }
  
  .history-title {
    font-size: 34px;
  }
  
  .history-container {
    padding: 28px 32px;
  }
}

@media (max-width: 1300px) {
  .history-inner {
    gap: 60px;
    max-width: 1000px;
  }
  
  .history-sidebar {
    width: 260px;
  }
  
  .history-image {
    width: 320px;
    height: 480px;
    opacity: 0.9;
  }
  
  .history-title {
    font-size: 32px;
  }
  
  .history-items-label {
    font-size: 19px;
  }
}

@media (max-width: 1200px) {
  .history-canvas {
    padding: 35px 20px;
  }
  
  .history-inner {
    gap: 40px;
    max-width: 900px;
  }
  
  .history-sidebar {
    width: 200px;
  }
  
  .history-image {
    width: 250px;
    height: 370px;
    opacity: 0.8;
  }
  
  .history-title {
    font-size: 30px;
  }
  
  .history-container {
    padding: 25px 30px;
  }
}

@media (max-width: 1100px) {
  .history-canvas {
    padding: 30px 18px;
  }
  
  .history-inner {
    flex-direction: column;
    gap: 30px;
    max-width: 800px;
  }
  
  .history-image {
    display: none;
  }
  
  .history-sidebar {
    display: none;
  }
  
  .history-container {
    width: 100%;
    padding: 24px 28px;
  }
  
  .history-title {
    font-size: 28px;
  }
  
  .history-items-label {
    font-size: 18px;
  }
  
  .history-count {
    font-size: 19px;
  }
}

@media (max-width: 900px) {
  .history-canvas {
    padding: 20px 15px;
  }
  
  .history-inner {
    gap: 20px;
  }
  
  .history-container {
    padding: 22px 24px;
    border-radius: 25px;
  }
  
  .history-title {
    font-size: 26px;
  }
  
  .history-header {
    flex-direction: column;
    gap: 10px;
  }
  
  .history-count {
    font-size: 18px;
  }
  
  .history-items-label {
    font-size: 17px;
  }
}

@media (max-width: 768px) {
  .history-canvas {
    padding: 18px 12px;
    min-height: auto;
  }
  
  .history-container {
    padding: 20px 22px;
    border-radius: 22px;
  }
  
  .history-title {
    font-size: 24px;
  }
  
  .history-count {
    font-size: 17px;
  }
  
  .order-header {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 600px) {
  .history-canvas {
    padding: 15px 10px;
  }
  
  .history-container {
    padding: 18px 20px;
    border-radius: 20px;
  }
  
  .history-title {
    font-size: 22px;
  }
  
  .history-header {
    gap: 8px;
    padding-bottom: 14px;
  }
  
  .history-count {
    font-size: 16px;
  }
  
  .history-items-label {
    font-size: 16px;
  }
  
  .history-body {
    margin-top: 20px;
  }
  
  .order-item {
    flex-direction: column;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .history-canvas {
    padding: 12px 8px;
  }
  
  .history-container {
    padding: 16px 18px;
    border-radius: 18px;
  }
  
  .history-title {
    font-size: 20px;
  }
  
  .history-header {
    gap: 6px;
    padding-bottom: 12px;
  }
  
  .history-count {
    font-size: 15px;
  }
  
  .history-items-label {
    font-size: 15px;
  }
  
  .history-body {
    margin-top: 18px;
  }
}

@media (max-width: 360px) {
  .history-canvas {
    padding: 10px 6px;
  }
  
  .history-container {
    padding: 14px 16px;
    border-radius: 16px;
  }
  
  .history-title {
    font-size: 18px;
  }
  
  .history-header {
    gap: 5px;
    padding-bottom: 10px;
  }
  
  .history-count {
    font-size: 14px;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .history-items-label {
    font-size: 14px;
  }
  
  .history-body {
    margin-top: 16px;
  }
}
</style>