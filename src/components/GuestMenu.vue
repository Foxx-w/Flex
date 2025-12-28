<template>
  <div 
    v-if="visible" 
    class="guest-menu-overlay" 
    :style="overlayStyle" 
    @click.self="close"
    @keydown.esc="close"
  >
    <div 
      class="guest-menu" 
      :style="menuStyle" 
      role="dialog" 
      aria-label="Меню неавторизованного пользователя"
      aria-modal="true"
    >
      <router-link 
        to="/" 
        class="menu-button" 
        @click="close"
        aria-label="Перейти на главную страницу"
      >
        <img src="/src/assets/icons/buy.svg" alt="" class="menu-icon" aria-hidden="true" />
        <span>Главная</span>
      </router-link>
      
      <router-link 
        to="/login" 
        class="menu-button" 
        @click="close"
        aria-label="Войти в аккаунт"
      >
        <img src="/src/assets/icons/user.svg" alt="" class="menu-icon" aria-hidden="true" />
        <span>Вход в аккаунт</span>
      </router-link>
      
      <router-link 
        to="/register" 
        class="menu-button" 
        @click="close"
        aria-label="Зарегистрироваться"
      >
        <img src="/src/assets/icons/registration.svg" alt="" class="menu-icon" aria-hidden="true" />
        <span>Регистрация</span>
      </router-link>
      
      <!-- Кнопка закрытия для доступности -->
      <button 
        class="close-button" 
        @click="close"
        aria-label="Закрыть меню"
      >
        ✕
      </button>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, watch, ref, nextTick, onMounted, onUnmounted } from 'vue'

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

// Закрытие меню
function close() {
  const now = Date.now()
  if (now < ignoreClicksUntil.value) {
    return
  }
  emit('update:visible', false)
  emit('close')
}

// Обработка нажатия Escape
function handleEscape(event) {
  if (event.key === 'Escape' && props.visible) {
    close()
  }
}

// Позиционирование меню
function positionMenu() {
  const menuHeight = 210 // Немного увеличена высота для кнопки закрытия
  const viewportPad = 40
  let menuWidth = 400
  
  // Адаптивная ширина
  if (window.innerWidth - viewportPad < menuWidth) {
    menuWidth = Math.max(280, window.innerWidth - viewportPad)
  }
  
  // Ищем кнопки в хедере для позиционирования
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
    
    // Позиционируем под хедером
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
      const menu = document.querySelector('.guest-menu')
      if (menu) menu.focus()
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

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', positionMenu)
  window.removeEventListener('keydown', handleEscape)
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Montserrat+Alternates:wght@400;600&display=swap');

.guest-menu-overlay {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  pointer-events: auto;
  z-index: 1099;
}

.guest-menu {
  position: absolute;
  background: rgba(34, 34, 34, 0.98);
  backdrop-filter: blur(10px);
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  border-bottom-left-radius: 30px;
  border-bottom-right-radius: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  box-sizing: border-box;
  padding: 20px;
  font-family: 'Montserrat Alternates', sans-serif;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transform-origin: top center;
  animation: menuEnter 0.3s ease-out;
  outline: none;
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
  font-size: 18px;
  text-decoration: none;
  position: relative;
  transition: all 0.2s ease;
  cursor: pointer;
}

.menu-button:hover {
  background-color: rgba(165, 61, 255, 0.2);
  transform: translateY(-3px);
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

.menu-icon {
  width: 28px;
  height: 30px;
  filter: brightness(0) invert(1);
  transition: filter 0.2s ease;
}

.menu-button:hover .menu-icon {
  filter: brightness(0) invert(1) sepia(1) saturate(5) hue-rotate(250deg);
}

.close-button {
  position: absolute;
  top: 10px;
  right: 15px;
  width: 30px;
  height: 30px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  color: white;
  font-size: 18px;
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
.guest-menu-overlay {
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
  .guest-menu {
    width: 300px !important;
    padding: 15px;
  }
  
  .menu-button {
    height: 45px;
    font-size: 16px;
    padding: 0 15px;
  }
  
  .menu-icon {
    width: 24px;
    height: 26px;
  }
}

@media (max-width: 480px) {
  .guest-menu {
    width: 280px !important;
    border-bottom-left-radius: 20px;
    border-bottom-right-radius: 20px;
  }
  
  .menu-button {
    height: 40px;
    font-size: 15px;
  }
  
  .close-button {
    top: 8px;
    right: 10px;
    width: 25px;
    height: 25px;
    font-size: 16px;
  }
}

/* Поддержка prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .guest-menu,
  .guest-menu-overlay,
  .menu-button {
    animation: none !important;
    transition: none !important;
  }
}
</style>