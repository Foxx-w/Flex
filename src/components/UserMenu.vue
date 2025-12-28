<template>
  <div 
    v-if="visible" 
    class="user-menu-overlay" 
    :style="overlayStyle" 
    @click.self="close"
    @keydown.esc="close"
  >
    <div 
      class="user-menu" 
      :style="menuStyle" 
      role="dialog" 
      aria-label="Меню пользователя"
      aria-modal="true"
      ref="menuElement"
      @keydown.tab="handleTab"
    >
      <!-- Информация о пользователе -->
      <div class="user-info" v-if="authStore.user">
        <div class="user-avatar">
          {{ getUserInitials }}
        </div>
        <div class="user-details">
          <div class="user-name">{{ authStore.user.username || authStore.user.Username || 'Пользователь' }}</div>
          <div class="user-email">{{ authStore.user.email || authStore.user.Email || '' }}</div>
          <div class="user-role">{{ getUserRoleText }}</div>
        </div>
      </div>
      
      <!-- Меню -->
      <nav class="user-nav">
        <router-link to="/" class="menu-button" @click="close" aria-label="Перейти на главную">
          <img src="/src/assets/icons/buy.svg" alt="" class="menu-icon" aria-hidden="true" />
          <span>Главная</span>
        </router-link>
        
        <router-link 
          v-if="authStore.userRole === 'CUSTOMER'" 
          to="/cart" 
          class="menu-button" 
          @click="close"
          aria-label="Перейти в корзину"
        >
          <img src="/src/assets/icons/cart.svg" alt="" class="menu-icon" aria-hidden="true" />
          <span>
            Корзина
            <span v-if="cartStore.totalItems > 0" class="cart-count-badge">
              {{ cartStore.totalItems > 99 ? '99+' : cartStore.totalItems }}
            </span>
          </span>
        </router-link>
        
        <router-link 
          v-if="authStore.userRole === 'CUSTOMER'" 
          to="/orders" 
          class="menu-button" 
          @click="close"
          aria-label="Просмотреть историю покупок"
        >
          <img src="/src/assets/icons/history.svg" alt="" class="menu-icon" aria-hidden="true" />
          <span>История покупок</span>
        </router-link>
        
        <router-link 
          v-if="authStore.userRole === 'SELLER'" 
          to="/sellerpage" 
          class="menu-button" 
          @click="close"
          aria-label="Панель продавца"
        >
          <img src="/src/assets/icons/store.svg" alt="" class="menu-icon" aria-hidden="true" />
          <span>Панель продавца</span>
        </router-link>
        
        <router-link 
          v-if="authStore.userRole === 'SELLER'" 
          to="/seller/games/new" 
          class="menu-button" 
          @click="close"
          aria-label="Добавить новую игру"
        >
          <img src="/src/assets/icons/add.svg" alt="" class="menu-icon" aria-hidden="true" />
          <span>Добавить игру</span>
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
import { useCartStore } from '../stores/cart'

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
const cartStore = useCartStore()

// Инициалы пользователя для аватара
const getUserInitials = computed(() => {
  const username = authStore.user?.username || authStore.user?.Username || ''
  if (!username) return 'П'
  
  const parts = username.split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return username[0].toUpperCase()
})

// Текст роли пользователя
const getUserRoleText = computed(() => {
  switch (authStore.userRole) {
    case 'CUSTOMER': return 'Покупатель'
    case 'SELLER': return 'Продавец'
    default: return 'Пользователь'
  }
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

// Выход из аккаунта
async function doLogout() {
  try {
    await authStore.logout()
    // Очищаем корзину
    cartStore.items = []
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
  const menuHeight = authStore.userRole === 'SELLER' ? 380 : 320
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

.user-menu-overlay {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  pointer-events: auto;
  z-index: 1099;
}

.user-menu {
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

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 20px;
  margin-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.user-avatar {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #A53DFF 0%, #8C2BD9 100%);
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

.user-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
}

.user-name {
  font-size: 18px;
  font-weight: 600;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  font-family: 'Montserrat', sans-serif;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 12px;
  color: #A53DFF;
  font-weight: 500;
  font-family: 'Montserrat', sans-serif;
  background: rgba(165, 61, 255, 0.1);
  padding: 2px 8px;
  border-radius: 12px;
  display: inline-block;
  align-self: flex-start;
}

.user-nav {
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
  background-color: rgba(165, 61, 255, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(165, 61, 255, 0.2);
  border-color: #A53DFF;
}

.menu-button:active {
  transform: translateY(0) scale(0.985);
  box-shadow: inset 0 3px 8px rgba(0, 0, 0, 0.35);
}

.menu-button:focus-visible {
  outline: 2px solid #A53DFF;
  outline-offset: 2px;
}

.menu-button.router-link-active {
  background-color: rgba(165, 61, 255, 0.3);
  border-color: #A53DFF;
}

.menu-icon {
  width: 24px;
  height: 24px;
  filter: brightness(0) invert(1);
  transition: filter 0.2s ease;
  flex-shrink: 0;
}

.menu-button:hover .menu-icon {
  filter: brightness(0) invert(1) sepia(1) saturate(5) hue-rotate(250deg);
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
  outline: 2px solid #A53DFF;
  outline-offset: 2px;
}

.cart-count-badge {
  background: #FF4757;
  color: white;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 600;
  margin-left: 8px;
  font-family: 'Montserrat', sans-serif;
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
.user-menu-overlay {
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
  .user-menu {
    width: 320px !important;
    padding: 20px 16px 16px;
  }
  
  .user-info {
    padding-bottom: 16px;
    margin-bottom: 12px;
  }
  
  .user-avatar {
    width: 40px;
    height: 40px;
    font-size: 16px;
  }
  
  .user-name {
    font-size: 16px;
  }
  
  .user-email {
    font-size: 12px;
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
  
  .close-button {
    top: 12px;
    right: 12px;
    width: 28px;
    height: 28px;
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .user-menu {
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
  .user-menu,
  .user-menu-overlay,
  .menu-button {
    animation: none !important;
    transition: none !important;
  }
}
</style>