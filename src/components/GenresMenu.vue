<template>
  <div 
    v-if="visible" 
    class="genres-overlay" 
    :style="overlayStyle" 
    @click.self="dismiss"
    @keydown.esc="dismiss"
  >
    <div 
      class="genres-menu" 
      :style="menuStyle" 
      role="dialog" 
      aria-label="Выбор жанров игр"
      aria-modal="true"
      ref="menuElement"
      @keydown.tab="handleTab"
    >
      <div class="genres-header">
        <h2 class="genres-title">Выберите жанры</h2>
        <div class="genres-actions">
          <button 
            type="button" 
            class="clear-btn" 
            @click="clearSelection"
            :disabled="selectedCount === 0"
            aria-label="Сбросить все жанры"
          >
            Сбросить
          </button>
          <button 
            type="button" 
            class="apply-btn" 
            @click="applySelection"
            aria-label="Применить выбранные жанры"
          >
            Применить ({{ selectedCount }})
          </button>
          <button 
            type="button" 
            class="close-btn" 
            @click="dismiss" 
            aria-label="Закрыть меню жанров"
          >
            ×
          </button>
        </div>
      </div>
      
      <div class="genres-inner" ref="inner">
        <div class="genres-lists">
          <div class="genres-column">
            <h3 class="column-title" v-if="genresLeft.length > 0">Популярные жанры</h3>
            <div class="genres-list">
              <div 
                v-for="(g, idx) in genresLeft" 
                :key="g.id" 
                class="genre-item"
                :class="{ 'genre-selected': checked[idx] }"
              >
                <CheckBox 
                  v-model="checked[idx]" 
                  :label="g.label"
                  @change="handleGenreChange(g.id, checked[idx])"
                />
                <span class="genre-label">{{ g.label }}</span>
              </div>
            </div>
          </div>
          
          <div class="genres-column">
            <h3 class="column-title" v-if="genresRight.length > 0">Другие жанры</h3>
            <div class="genres-list">
              <div 
                v-for="(g, idx) in genresRight" 
                :key="g.id" 
                class="genre-item"
                :class="{ 'genre-selected': checked[genresLeft.length + idx] }"
              >
                <CheckBox 
                  v-model="checked[genresLeft.length + idx]" 
                  :label="g.label"
                  @change="handleGenreChange(g.id, checked[genresLeft.length + idx])"
                />
                <span class="genre-label">{{ g.label }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Подсказка для пользователя -->
      <div class="genres-hint">
        <span class="hint-icon">💡</span>
        <span class="hint-text">Выбранные жанры будут применены к фильтрации игр на главной странице</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, watch, ref, nextTick, onMounted, onBeforeUnmount, computed } from 'vue'
import CheckBox from './CheckBox.vue'
import genresList from '../stores/genres.js'

const props = defineProps({ 
  visible: { 
    type: Boolean, 
    default: false 
  }, 
  initialSelected: { 
    type: Array, 
    default: () => [] 
  } 
})

const emit = defineEmits(['update:visible', 'close', 'apply'])

// Импортируем список жанров
const genres = genresList

// Разделяем на две колонки
const half = Math.ceil(genres.length / 2)
const genresLeft = genres.slice(0, half)
const genresRight = genres.slice(half)

const menuStyle = ref({})
const overlayStyle = ref({})
const checked = ref(new Array(genres.length).fill(false))
const inner = ref(null)
const menuElement = ref(null)

// Подсчет выбранных жанров
const selectedCount = computed(() => {
  return checked.value.filter(Boolean).length
})

// Подсчет выбранных жанров для отображения
const selectedGenres = computed(() => {
  return genres.filter((g, idx) => checked.value[idx])
})

// Применение выбранных жанров
function applySelection() {
  const selected = genres.filter((g, idx) => checked.value[idx]).map(g => g.id)
  emit('apply', selected)
  emit('update:visible', false)
  emit('close')
}

// Сброс выбора
function clearSelection() {
  checked.value = new Array(genres.length).fill(false)
}

// Закрытие меню
function dismiss() {
  applySelection() // Автоматически применяем при закрытии
}

// Обработка изменения жанра
function handleGenreChange(genreId, isChecked) {
  // Можно добавить дополнительную логику здесь
  console.log(`Жанр ${genreId} ${isChecked ? 'выбран' : 'снят'}`)
}

// Обработка нажатия Escape
function handleEscape(event) {
  if (event.key === 'Escape' && props.visible) {
    dismiss()
  }
}

// Обработка табуляции для сохранения фокуса внутри меню
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

// Позиционирование меню
function positionMenu() {
  const desiredMenuHeight = 560
  const viewportPad = 40
  
  // Определяем ширину меню в зависимости от размера экрана
  let menuWidth = 900
  if (window.innerWidth <= 761) {
    menuWidth = Math.max(430, window.innerWidth - 40)
  } else if (window.innerWidth - viewportPad < menuWidth) {
    menuWidth = Math.max(320, window.innerWidth - viewportPad)
  }
  
  const headerEl = document.querySelector('.site-header')
  const anchor = document.querySelector('.site-header .header-inner')
  const rect = anchor ? anchor.getBoundingClientRect() : { left: 0, width: window.innerWidth }
  const headerRect = headerEl ? headerEl.getBoundingClientRect() : rect
  
  // Размещаем меню под хедером
  const overlayTop = headerRect && headerRect.bottom ? Math.round(headerRect.bottom) + 8 : 8
  const availableBelow = Math.max(window.innerHeight - overlayTop - viewportPad, 120)
  const finalMenuHeight = Math.min(desiredMenuHeight, availableBelow)
  
  overlayStyle.value = { 
    position: 'fixed', 
    left: 0, 
    right: 0, 
    top: overlayTop + 'px', 
    pointerEvents: 'auto', 
    zIndex: 1300, 
    display: 'flex', 
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(2px)'
  }
  
  menuStyle.value = { 
    position: 'relative', 
    width: menuWidth + 'px', 
    height: finalMenuHeight + 'px', 
    top: '0px', 
    zIndex: 1301,
    animation: 'menuSlideIn 0.3s ease-out'
  }
  
  // Сбрасываем позицию прокрутки
  if (inner.value) {
    inner.value.scrollTop = 0
  }
}

// Следим за видимостью меню
watch(() => props.visible, async (isVisible) => {
  if (isVisible) {
    await nextTick()
    positionMenu()
    
    // Добавляем обработчики
    window.addEventListener('resize', positionMenu)
    window.addEventListener('keydown', handleEscape)
    
    // Фокус на меню для доступности
    nextTick(() => {
      if (menuElement.value) {
        menuElement.value.focus()
        // Фокус на первую кнопку
        const firstButton = menuElement.value.querySelector('button')
        if (firstButton) firstButton.focus()
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

// Синхронизация начального выбора
watch(() => props.initialSelected, (arr) => {
  if (!Array.isArray(arr)) return
  checked.value = genres.map(g => arr.includes(g.id))
}, { immediate: true })

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
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Montserrat+Alternates:wght@400;600&display=swap');

.genres-overlay {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  display: block;
  pointer-events: auto;
  z-index: 1099;
}

.genres-menu {
  position: relative;
  background: #FFFFFF;
  border-radius: 24px;
  box-sizing: border-box;
  padding: 24px 32px 16px;
  color: #111;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 0, 0, 0.1);
  transform-origin: top center;
  animation: menuSlideIn 0.3s ease-out;
  outline: none;
}

.genres-header {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 20px;
  border-bottom: 1px solid #E0E0E0;
  margin-bottom: 20px;
}

.genres-title {
  font-family: 'Montserrat Alternates', sans-serif;
  font-size: 28px;
  font-weight: 600;
  color: #222;
  margin: 0;
  text-align: center;
}

.genres-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.clear-btn {
  background: transparent;
  border: 1px solid #FF4757;
  color: #FF4757;
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
  font-family: 'Montserrat', sans-serif;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s ease;
}

.clear-btn:hover:not(:disabled) {
  background: #FFEBEE;
  transform: translateY(-1px);
}

.clear-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.apply-btn {
  background: #A53DFF;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  cursor: pointer;
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s ease;
  flex-grow: 1;
  text-align: center;
}

.apply-btn:hover {
  background: #8C2BD9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(165, 61, 255, 0.3);
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
  padding: 4px 12px;
  color: #666;
  border-radius: 8px;
  font-weight: 300;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.04);
  color: #222;
}

.close-btn:focus,
.clear-btn:focus,
.apply-btn:focus {
  outline: 2px solid rgba(165, 61, 255, 0.4);
  outline-offset: 2px;
}

.genres-inner {
  overflow-y: auto;
  max-height: calc(100% - 180px);
  scroll-behavior: smooth;
  padding-right: 8px;
  padding-top: 0;
}

.genres-lists {
  display: flex;
  flex-direction: row;
  gap: 40px;
  align-items: flex-start;
  justify-content: center;
}

.genres-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 50%;
  min-width: 0;
}

.column-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: #A53DFF;
  margin: 0;
  padding: 0 0 8px 0;
  border-bottom: 2px solid #F0F0F0;
}

.genres-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.genre-item {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
  min-height: 48px;
  padding: 8px 12px;
  border-radius: 12px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.genre-item:hover {
  background: #F8F8F8;
}

.genre-item.genre-selected {
  background: rgba(165, 61, 255, 0.08);
  border: 1px solid rgba(165, 61, 255, 0.2);
}

.genre-label {
  font-family: 'Montserrat', sans-serif;
  font-size: 18px;
  font-weight: 500;
  line-height: 1.3;
  color: #333;
  flex: 1;
  min-width: 0;
  white-space: normal;
  word-break: break-word;
  overflow-wrap: break-word;
  cursor: pointer;
}

.genres-hint {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  margin-top: 20px;
  background: rgba(165, 61, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(165, 61, 255, 0.1);
}

.hint-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.hint-text {
  font-family: 'Montserrat', sans-serif;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

/* Кастомный скроллбар */
.genres-inner::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.genres-inner::-webkit-scrollbar-thumb {
  background: rgba(165, 61, 255, 0.3);
  border-radius: 8px;
}

.genres-inner::-webkit-scrollbar-thumb:hover {
  background: rgba(165, 61, 255, 0.5);
}

.genres-inner::-webkit-scrollbar-track {
  background: transparent;
}

.genres-inner {
  scrollbar-width: thin;
  scrollbar-color: rgba(165, 61, 255, 0.3) transparent;
}

/* Анимация появления */
@keyframes menuSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Адаптивность */
@media (max-width: 900px) {
  .genres-menu {
    width: 700px !important;
    padding: 20px 24px 12px;
  }
  
  .genres-lists {
    gap: 30px;
  }
  
  .genres-title {
    font-size: 24px;
  }
}

@media (max-width: 761px) {
  .genres-menu {
    width: 430px !important;
    padding: 16px 20px 10px;
  }
  
  .genres-lists {
    flex-direction: column;
    gap: 24px;
  }
  
  .genres-column {
    width: 100%;
  }
  
  .genres-title {
    font-size: 22px;
  }
  
  .genre-label {
    font-size: 16px;
  }
}

@media (max-width: 480px) {
  .genres-menu {
    width: 320px !important;
    padding: 12px 16px 8px;
    border-radius: 20px;
  }
  
  .genres-actions {
    flex-direction: column;
    gap: 8px;
  }
  
  .clear-btn,
  .apply-btn,
  .close-btn {
    width: 100%;
    text-align: center;
  }
  
  .genres-title {
    font-size: 20px;
  }
  
  .genre-label {
    font-size: 15px;
  }
  
  .genres-hint {
    padding: 12px;
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }
  
  .hint-text {
    font-size: 13px;
  }
}

/* Поддержка prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .genres-menu {
    animation: none !important;
  }
  
  .genre-item,
  .clear-btn,
  .apply-btn,
  .close-btn {
    transition: none !important;
  }
}

/* Фокус для доступности */
.genre-item:focus-within {
  outline: 2px solid rgba(165, 61, 255, 0.4);
  outline-offset: 2px;
}
</style>