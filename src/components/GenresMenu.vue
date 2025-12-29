<template>
  <div 
    v-if="visible" 
    class="genres-overlay" 
    @click.self="dismiss"
  >
    <div 
      class="genres-menu" 
      role="dialog" 
      aria-label="Выбор жанров игр"
      ref="menuElement"
    >
      <div class="genres-header">
        <h2 class="genres-title">Выберите жанры</h2>
        <div class="genres-actions">
          <button 
            type="button" 
            class="clear-btn" 
            @click="clearSelection"
            :disabled="selectedCount === 0"
          >
            Сбросить
          </button>
          <button 
            type="button" 
            class="apply-btn" 
            @click="applySelection"
          >
            Применить ({{ selectedCount }})
          </button>
          <button 
            type="button" 
            class="close-btn" 
            @click="dismiss"
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
                v-for="genre in genresLeft" 
                :key="genre.id" 
                class="genre-item"
                :class="{ 'genre-selected': selectedGenres.includes(genre.id) }"
                @click="toggleGenre(genre.id)"
              >
                <input 
                  type="checkbox" 
                  class="genre-checkbox"
                  :checked="selectedGenres.includes(genre.id)"
                  @click.stop="toggleGenre(genre.id)"
                >
                <span class="genre-label">{{ genre.label }}</span>
              </div>
            </div>
          </div>
          
          <div class="genres-column">
            <h3 class="column-title" v-if="genresRight.length > 0">Другие жанры</h3>
            <div class="genres-list">
              <div 
                v-for="genre in genresRight" 
                :key="genre.id" 
                class="genre-item"
                :class="{ 'genre-selected': selectedGenres.includes(genre.id) }"
                @click="toggleGenre(genre.id)"
              >
                <input 
                  type="checkbox" 
                  class="genre-checkbox"
                  :checked="selectedGenres.includes(genre.id)"
                  @click.stop="toggleGenre(genre.id)"
                >
                <span class="genre-label">{{ genre.label }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, computed, watch, onMounted, onUnmounted } from 'vue'
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

const selectedGenres = ref([])
const menuElement = ref(null)

// Подсчет выбранных жанров
const selectedCount = computed(() => {
  return selectedGenres.value.length
})

// Переключение жанра
const toggleGenre = (genreId) => {
  const index = selectedGenres.value.indexOf(genreId)
  if (index === -1) {
    selectedGenres.value.push(genreId)
  } else {
    selectedGenres.value.splice(index, 1)
  }
}

// Применение выбранных жанров
const applySelection = () => {
  emit('apply', [...selectedGenres.value])
  emit('update:visible', false)
  emit('close')
}

// Сброс выбора
const clearSelection = () => {
  selectedGenres.value = []
}

// Закрытие меню
const dismiss = () => {
  emit('update:visible', false)
  emit('close')
}

// Обработчик Escape
const handleEscape = (event) => {
  if (event.key === 'Escape' && props.visible) {
    dismiss()
  }
}

// Обработчик клика вне меню
const handleClickOutside = (event) => {
  if (menuElement.value && !menuElement.value.contains(event.target)) {
    dismiss()
  }
}

// Синхронизация начального выбора
watch(() => props.initialSelected, (arr) => {
  if (Array.isArray(arr)) {
    selectedGenres.value = [...arr]
  }
}, { immediate: true })

// Управление событиями при открытии/закрытии меню
watch(() => props.visible, (isVisible) => {
  if (isVisible) {
    // Блокируем прокрутку body
    document.body.style.overflow = 'hidden'
    
    // Добавляем обработчики
    document.addEventListener('keydown', handleEscape)
    document.addEventListener('mousedown', handleClickOutside)
    
    // Фокус на меню
    setTimeout(() => {
      if (menuElement.value) {
        menuElement.value.focus()
      }
    }, 100)
  } else {
    // Восстанавливаем прокрутку
    document.body.style.overflow = ''
    
    // Убираем обработчики
    document.removeEventListener('keydown', handleEscape)
    document.removeEventListener('mousedown', handleClickOutside)
  }
})

onUnmounted(() => {
  // Убираем обработчики при размонтировании
  document.removeEventListener('keydown', handleEscape)
  document.removeEventListener('mousedown', handleClickOutside)
  document.body.style.overflow = ''
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Montserrat+Alternates:wght@400;600&display=swap');

/* Затемнение вместо блюра */
.genres-overlay {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7); /* Затемнение */
  display: flex;
  justify-content: center;
  align-items: flex-start;
  z-index: 1100;
  padding-top: 80px;
  animation: fadeIn 0.2s ease;
}

.genres-menu {
  background: #FFFFFF;
  border-radius: 24px;
  box-sizing: border-box;
  padding: 24px 32px;
  color: #111;
  max-width: 900px;
  width: 90%;
  max-height: 70vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(0, 0, 0, 0.1);
  animation: slideIn 0.3s ease-out;
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

.genres-inner {
  overflow-y: auto;
  flex: 1;
  padding-right: 8px;
}

.genres-lists {
  display: flex;
  gap: 40px;
  align-items: flex-start;
}

.genres-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
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
  gap: 12px;
}

.genre-item {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 48px;
  padding: 8px 12px;
  border-radius: 12px;
  transition: all 0.2s ease;
  cursor: pointer;
  border: 1px solid transparent;
}

.genre-item:hover {
  background: #F8F8F8;
}

.genre-item.genre-selected {
  background: rgba(165, 61, 255, 0.08);
  border: 1px solid rgba(165, 61, 255, 0.2);
}

.genre-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #A53DFF;
}

.genre-label {
  font-family: 'Montserrat', sans-serif;
  font-size: 18px;
  font-weight: 500;
  color: #333;
  flex: 1;
  cursor: pointer;
  user-select: none;
}

/* Кастомный скроллбар */
.genres-inner::-webkit-scrollbar {
  width: 6px;
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

/* Анимации */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
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
    width: 95%;
    padding: 20px 24px;
  }
  
  .genres-lists {
    gap: 30px;
  }
  
  .genres-title {
    font-size: 24px;
  }
  
  .genre-label {
    font-size: 16px;
  }
}

@media (max-width: 768px) {
  .genres-overlay {
    padding-top: 60px;
  }
  
  .genres-menu {
    max-height: 80vh;
  }
  
  .genres-lists {
    flex-direction: column;
    gap: 24px;
  }
  
  .genres-title {
    font-size: 22px;
  }
  
  .genres-actions {
    flex-direction: column;
    gap: 8px;
  }
  
  .clear-btn,
  .apply-btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .genres-overlay {
    padding-top: 40px;
  }
  
  .genres-menu {
    padding: 16px 20px;
    border-radius: 20px;
  }
  
  .genres-title {
    font-size: 20px;
  }
  
  .genre-label {
    font-size: 15px;
  }
}
</style>