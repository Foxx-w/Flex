<template>
  <div 
    v-if="visible" 
    class="seller-menu-overlay" 
    :style="overlayStyle" 
    @click.self="close"
    @keydown.esc="close"
  >
    <div 
      class="seller-menu" 
      :style="menuStyle" 
      role="dialog" 
      aria-label="Меню продавца"
      aria-modal="true"
      ref="menuElement"
      @keydown.tab="handleTab"
    >
      <!-- Информация о продавце -->
      <div class="seller-info" v-if="authStore.user">
        <div class="seller-avatar">
          {{ getSellerInitials }}
        </div>
        <div class="seller-details">
          <div class="seller-name">{{ authStore.user.username || authStore.user.Username || 'Продавец' }}</div>
          <div class="seller-email">{{ authStore.user.email || authStore.user.Email || '' }}</div>
          <div class="seller-role">Продавец</div>
          <div class="seller-stats" v-if="sellerStats">
            <div class="stat">
              <span class="stat-value">{{ sellerStats.totalGames || 0 }}</span>
              <span class="stat-label">Игр</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ sellerStats.totalKeys || 0 }}</span>
              <span class="stat-label">Ключей</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Меню продавца -->
      <nav class="seller-nav">
        <router-link to="/seller/dashboard" class="menu-button" @click="close" aria-label="Панель управления">
          <img src="/src/assets/icons/dashboard.svg" alt="" class="menu-icon" aria-hidden="true" />
          <span>Панель управления</span>
        </router-link>
        
        <router-link 
          to="/seller/games" 
          class="menu-button" 
          @click="close"
          aria-label="Управление играми"
        >
          <img src="/src/assets/icons/product.svg" alt="" class="menu-icon" aria-hidden="true" />
          <span>Мои игры</span>
          <span v-if="sellerStats?.totalGames" class="menu-badge">
            {{ sellerStats.totalGames > 99 ? '99+' : sellerStats.totalGames }}
          </span>
        </router-link>
        
        <router-link 
          to="/seller/games/new" 
          class="menu-button" 
          @click="close"
          aria-label="Добавить новую игру"
        >
          <img src="/src/assets/icons/add.svg" alt="" class="menu-icon" aria-hidden="true" />
          <span>Добавить игру</span>
        </router-link>
        
        <router-link 
          to="/seller/orders" 
          class="menu-button" 
          @click="close"
          aria-label="Просмотреть заказы"
        >
          <img src="/src/assets/icons/orders.svg" alt="" class="menu-icon" aria-hidden="true" />
          <span>Заказы</span>
          <span v-if="pendingOrdersCount" class="menu-badge badge-warning">
            {{ pendingOrdersCount > 99 ? '99+' : pendingOrdersCount }}
          </span>
        </router-link>
        
        <router-link 
          to="/seller/analytics" 
          class="menu-button" 
          @click="close"
          aria-label="Аналитика продаж"
        >
          <img src="/src/assets/icons/chart.svg" alt="" class="menu-icon" aria-hidden="true" />
          <span>Аналитика</span>
        </router-link>
        
        <router-link 
          to="/" 
          class="menu-button" 
          @click="close"
          aria-label="Перейти в магазин"
        >
          <img src="/src/assets/icons/store.svg" alt="" class="menu-icon" aria-hidden="true" />
          <span>Магазин</span>
        </router-link>
        
        <button 
          type="button" 
          class="menu-button logout-btn" 
          @click="doLogout"
          aria-label="Выйти из аккаунта"
        >
          <img src="/src/assets/icons/logout.svg" alt="" class="menu-icon" aria-hidden="true" />
          <span>Выйти</span>
        </button>
      </nav>
      
      <!-- Кнопка закрытия -->
      <button 
        class="close-button" 
        @click="close"
        aria-label="Закрыть меню"
      >
        ×
      </button>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, watch, ref, nextTick, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const props = defineProps({
  visible: { 
    type: Boolean, 
    default: false 
  }
})

const emit = defineEmits(['update:visible', 'close'])

const menuStyle = ref({})
const overlayStyle = ref({})
const ignoreClicksUntil = ref(0)
const menuElement = ref(null)

const router = useRouter()
const authStore = useAuthStore()

// Статистика продавца (можно получать из API)
const sellerStats = ref({
  totalGames: 0,
  totalKeys: 0,
  totalRevenue: 0
})

// Количество ожидающих заказов
const pendingOrdersCount = ref(0)

// Инициалы продавца для аватара
const getSellerInitials = computed(() => {
  const username = authStore.user?.username || authStore.user?.Username || ''
  if (!username) return 'П'
  
  const parts = username.split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return username[0].toUpperCase()
})

// Закрытие меню
function close() {
  const now = Date.now()
  if (now < ignoreClicksUntil.value) return
  emit('update:visible', false)
  emit('close')
}

// Обработка нажатия Escape
function handleEscape(event) {
  if (event.key === 'Escape' && props.visible) {
    close()
  }
}

// Обработка табуляции
function handleTab(event) {
  const focusableElements = menuElement.value.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  if (event.shiftKey && event.target === firstElement) {
    event.preventDefault()
    lastElement.focus()
  } else if (!event.shiftKey && event.target === lastElement) {
    event.preventDefault()
    firstElement.focus()
  }
}

// Загрузка статистики продавца (можно интегрировать с API)
async function loadSellerStats() {
  try {
    // Пример запроса для статистики продавца
    // const response = await fetch('/api/seller/stats', {
    //   credentials: 'include'
    // })
    // const data = await response.json()
    // sellerStats.value = data
    
    // Для демонстрации
    sellerStats.value = {
      totalGames: 15,
      totalKeys: 245,
      totalRevenue: 12500
    }
  } catch (err) {
    console.error('Failed to load seller stats:', err)
  }
}

// Загрузка количества ожидающих заказов
async function loadPendingOrders() {
  try {
    // Пример запроса для заказов
    // const response = await fetch('/api/seller/orders/pending/count', {
    //   credentials: 'include'
    // })
    // const data = await response.json()
    // pendingOrdersCount.value = data.count
    
    // Для демонстрации
    pendingOrdersCount.value = 3
  } catch (err) {
    console.error('Failed to load pending orders:', err)
  }
}

// Выход из аккаунта
async function doLogout() {
  try {
    await authStore.logout()
  } catch (err) {
    console.error('Logout error', err)
  } finally {
    emit('update:visible', false)
    emit('close')
    router.push('/')
  }
}

// Позиционирование меню
function positionMenu() {
  const menuHeight = 460 // Высота для полного меню продавца
  const viewportPad = 40
  let menuWidth = 420
  
  if (window.innerWidth - viewportPad < menuWidth) {
    menuWidth = Math.max(300, window.innerWidth - viewportPad)
  }
  
  const cartBtn = document.querySelector('.site-header .header-inner .cart-btn')
  const userBtn = document.querySelector('.site-header .header-inner .user-btn')
  const headerEl = document.querySelector('.site-header')
  
  if (cartBtn && userBtn && headerEl) {
    const r1 = cartBtn.getBoundingClientRect()
    const r2 = userBtn.getBoundingClientRect()
    const leftEdge = Math.min(r1.left, r2.left)
    const rightEdge = Math.max(r1.right, r2.right)
    const center = (leftEdge + rightEdge) / 2
    
    let left = Math.round(center - menuWidth / 2)
    if (left + menuWidth > window.innerWidth) left = Math.round(window.innerWidth - menuWidth)
    if (left < 0) left = 0
    
    const headerRect = headerEl.getBoundingClientRect()
    const overlayTop = Math.max(Math.round(headerRect.bottom + window.scrollY), 0)
    
    overlayStyle.value = { 
      position: 'absolute', 
      left: 0, 
      right: 0, 
      top: overlayTop + 'px', 
      pointerEvents: 'auto', 
      zIndex: 1100 
    }
    
    menuStyle.value = { 
      position: 'absolute', 
      width: menuWidth + 'px', 
      height: menuHeight + 'px', 
      top: '0px', 
      left: Math.round(left) + 'px', 
      zIndex: 1101, 
      willChange: 'transform',
      animation: 'menuEnter 0.3s ease-out'
    }
    
    return
  }
  
  // Запасной вариант позиционирования
  const anchor = document.querySelector('.site-header .header-inner .header-right') || 
                 document.querySelector('.site-header .header-inner')
  
  if (!anchor) {
    const left = Math.max((window.innerWidth - menuWidth) / 2, 0)
    const top = 164
    
    overlayStyle.value = { 
      position: 'fixed', 
      left: 0, 
      right: 0, 
      top: top + 'px', 
      pointerEvents: 'auto', 
      zIndex: 999 
    }
    
    menuStyle.value = { 
      position: 'absolute', 
      width: menuWidth + 'px', 
      height: menuHeight + 'px', 
      top: '0px', 
      left: left + 'px',
      animation: 'menuEnter 0.3s ease-out'
    }
    
    return
  }
  
  const rect = anchor.getBoundingClientRect()
  const headerEl2 = document.querySelector('.site-header')
  const headerRect2 = headerEl2 ? headerEl2.getBoundingClientRect() : rect
  const overlayTop = Math.round(headerRect2.bottom + window.scrollY)
  
  let left = rect.left + (rect.width - menuWidth) / 2
  if (left + menuWidth > window.innerWidth) left = window.innerWidth - menuWidth
  if (left < 0) left = 0
  
  overlayStyle.value = { 
    position: 'absolute', 
    left: 0, 
    right: 0, 
    top: overlayTop + 'px', 
    pointerEvents: 'auto', 
    zIndex: 1100 
  }
  
  menuStyle.value = { 
    position: 'absolute', 
    width: menuWidth + 'px', 
    height: menuHeight + 'px', 
    top: '0px', 
    left: left + 'px', 
    zIndex: 1101,
    animation: 'menuEnter 0.3s ease-out'
  }
}

// Следим за видимостью меню
watch(() => props.visible, async (isVisible) => {
  if (isVisible) {
    await nextTick()
    positionMenu()
    
    // Игнорируем клики сразу после открытия
    ignoreClicksUntil.value = Date.now() + 200
    
    // Загружаем данные продавца
    await Promise.all([
      loadSellerStats(),
      loadPendingOrders()
    ])
    
    // Добавляем обработчики
    window.addEventListener('resize', positionMenu)
    window.addEventListener('keydown', handleEscape)
    
    // Фокус на меню для доступности
    nextTick(() => {
      if (menuElement.value) {
        menuElement.value.focus()
      }
    })
  } else {
    // Убираем обработчики
    window.removeEventListener('resize', positionMenu)
    window.removeEventListener('keydown', handleEscape)
    
    overlayStyle.value = {}
    menuStyle.value = {}
  }
})

// Автоматическое позиционирование при скролле
function handleScroll() {
  if (props.visible) {
    positionMenu()
  }
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', positionMenu)
  window.removeEventListener('keydown', handleEscape)
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Montserrat+Alternates:wght@400;500;600&family=Montserrat:wght@400;500&display=swap');

.seller-menu-overlay {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  pointer-events: auto;
  z-index: 1099;
}

.seller-menu {
  position: absolute;
  background: rgba(34, 34, 34, 0.98);
  backdrop-filter: blur(10px);
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  border-bottom-left-radius: 30px;
  border-bottom-right-radius: 30px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding: 24px 20px 20px;
  font-family: 'Montserrat Alternates', sans-serif;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transform-origin: top center;
  animation: menuEnter 0.3s ease-out;
  outline: none;
}

.seller-info {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 20px;
  margin-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.seller-avatar {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 600;
  color: white;
  font-family: 'Montserrat', sans-serif;
  flex-shrink: 0;
}

.seller-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  flex: 1;
}

.seller-name {
  font-size: 18px;
  font-weight: 600;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.seller-email {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  font-family: 'Montserrat', sans-serif;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.seller-role {
  font-size: 12px;
  color: #4CAF50;
  font-weight: 500;
  font-family: 'Montserrat', sans-serif;
  background: rgba(76, 175, 80, 0.1);
  padding: 2px 8px;
  border-radius: 12px;
  display: inline-block;
  align-self: flex-start;
}

.seller-stats {
  display: flex;
  gap: 16px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #4CAF50;
  font-family: 'Montserrat', sans-serif;
}

.stat-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  font-family: 'Montserrat', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.seller-nav {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}

.menu-button {
  width: 100%;
  height: 50px;
  background-color: rgba(39, 39, 39, 0.95);
  border-radius: 30px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  padding: 0 20px;
  box-sizing: border-box;
  color: #FFFFFF;
  font-family: 'Montserrat Alternates', sans-serif;
  font-size: 16px;
  text-decoration: none;
  position: relative;
  transition: all 0.2s ease;
  cursor: pointer;
  text-align: left;
}

.menu-button:hover {
  background-color: rgba(76, 175, 80, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(76, 175, 80, 0.2);
  border-color: #4CAF50;
}

.menu-button:active {
  transform: translateY(0) scale(0.985);
  box-shadow: inset 0 3px 8px rgba(0, 0, 0, 0.35);
}

.menu-button:focus-visible {
  outline: 2px solid #4CAF50;
  outline-offset: 2px;
}

.menu-button.router-link-active {
  background-color: rgba(76, 175, 80, 0.3);
  border-color: #4CAF50;
}

.menu-icon {
  width: 24px;
  height: 24px;
  filter: brightness(0) invert(1);
  transition: filter 0.2s ease;
  flex-shrink: 0;
}

.menu-button:hover .menu-icon {
  filter: brightness(0) invert(1) sepia(1) saturate(5) hue-rotate(90deg);
}

.menu-badge {
  background: #4CAF50;
  color: white;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 600;
  margin-left: auto;
  font-family: 'Montserrat', sans-serif;
}

.badge-warning {
  background: #FF9800;
}

.logout-btn {
  margin-top: auto;
  background-color: rgba(255, 71, 87, 0.1);
  border-color: rgba(255, 71, 87, 0.3);
}

.logout-btn:hover {
  background-color: rgba(255, 71, 87, 0.2);
  border-color: #FF4757;
}

.close-button {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  color: white;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-family: sans-serif;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.close-button:active {
  transform: scale(0.95);
}

.close-button:focus-visible {
  outline: 2px solid #4CAF50;
  outline-offset: 2px;
}

@keyframes menuEnter {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Анимация для оверлея */
.seller-menu-overlay {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    background: rgba(0, 0, 0, 0);
  }
  to {
    background: rgba(0, 0, 0, 0.5);
  }
}

/* Адаптивность */
@media (max-width: 768px) {
  .seller-menu {
    width: 320px !important;
    padding: 20px 16px 16px;
  }
  
  .seller-info {
    padding-bottom: 16px;
    margin-bottom: 12px;
  }
  
  .seller-avatar {
    width: 40px;
    height: 40px;
    font-size: 16px;
  }
  
  .seller-name {
    font-size: 16px;
  }
  
  .seller-email {
    font-size: 12px;
  }
  
  .seller-stats {
    gap: 12px;
  }
  
  .stat-value {
    font-size: 14px;
  }
  
  .stat-label {
    font-size: 10px;
  }
  
  .menu-button {
    height: 44px;
    font-size: 15px;
    padding: 0 16px;
  }
  
  .menu-icon {
    width: 20px;
    height: 20px;
  }
  
  .menu-badge {
    font-size: 11px;
    padding: 2px 6px;
  }
  
  .close-button {
    top: 12px;
    right: 12px;
    width: 28px;
    height: 28px;
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .seller-menu {
    width: 280px !important;
    border-bottom-left-radius: 20px;
    border-bottom-right-radius: 20px;
  }
  
  .menu-button {
    height: 40px;
    font-size: 14px;
  }
}

/* Поддержка prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .seller-menu,
  .seller-menu-overlay,
  .menu-button {
    animation: none !important;
    transition: none !important;
  }
}
</style>