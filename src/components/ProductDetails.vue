<template>
  <transition name="modal">
    <div v-if="isVisible" class="modal-overlay" @click.self="emitClose">
      <div class="modal-content" @wheel="handleWheel" @touchmove="handleTouchMove">
        <button class="modal-close" @click="emitClose">×</button>
        
        <div v-if="loading" class="loading">
          Загрузка игры...
        </div>
        
        <div v-else-if="error" class="error">
          {{ error }}
        </div>
        
        <div v-else-if="currentGame" class="product-details-content">
          <!-- Левая колонка -->
          <div class="left-section">
            <!-- Карточка игры -->
            <div class="vertical-photo-wrapper card-size">
              <img 
                v-if="currentGame.cardImage || currentGame.imageUrl || currentGame.image" 
                :src="currentGame.cardImage || currentGame.imageUrl || currentGame.image" 
                :alt="currentGame.title || currentGame.name" 
                class="vertical-photo" 
              />
              <div v-else class="photo-placeholder">
                <div class="no-image-text">Нет изображения</div>
              </div>
            </div>
            <p class="photo-label">Изображение карточки товара</p>
          </div>

          <!-- Центральная колонка -->
          <div class="center-section">
            <!-- Основное изображение -->
            <div class="product-image-wrapper">
              <img 
                v-if="currentGame.imageUrl || currentGame.image" 
                :src="currentGame.imageUrl || currentGame.image" 
                :alt="currentGame.title || currentGame.name" 
                class="product-image" 
              />
              <div v-else class="photo-placeholder large">
                <div class="no-image-text">Нет изображения</div>
              </div>
            </div>
            
            <!-- Описание -->
            <div class="product-description-box">
              <label class="field-label">Описание:</label>
              <div class="description-text">
                {{ currentGame.description || localDescription || 'Нет описания' }}
              </div>
            </div>

            <!-- Цена -->
            <div class="price-section">
              <label class="field-label">Цена (₽):</label>
              <div class="price-display">
                {{ formatPrice(currentGame.price) }} ₽
              </div>
            </div>
          </div>

          <!-- Правая колонка -->
          <div class="right-section">
            <!-- Название -->
            <div class="product-title-display">
              {{ currentGame.title || currentGame.name || 'Название не указано' }}
            </div>

            <!-- Информация о продавце -->
            <div class="seller-info">
              <img src="/src/assets/icons/saleman.svg" alt="Продавец" class="seller-icon" />
              <span class="seller-name">{{ currentGame.seller?.username || 'Продавец' }}</span>
            </div>

            <!-- Технические характеристики -->
            <div class="specs">
              <div class="spec-row">
                <div class="spec-label">Разработчик:</div>
                <div class="spec-value">{{ currentGame.developerTitle || 'Не указан' }}</div>
              </div>
              
              <div class="spec-row">
                <div class="spec-label">Издатель:</div>
                <div class="spec-value">{{ currentGame.publisherTitle || 'Не указан' }}</div>
              </div>
              
              <!-- Жанры -->
              <div class="spec-row">
                <div class="spec-label">Жанры:</div>
                <div class="spec-value">
                  <div class="selected-genres">
                    <div v-for="(genre, index) in formattedGenres" :key="index" class="selected-genre-tag">
                      {{ genre }}
                    </div>
                    <div v-if="formattedGenres.length === 0" class="no-genres-text">
                      Не указаны
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Платформа - всегда PC -->
              <div class="spec-row">
                <div class="spec-label">Платформа:</div>
                <div class="spec-value">PC</div>
              </div>
              
              <!-- Язык интерфейса -->
              <div class="spec-row">
                <div class="spec-label">Язык интерфейса:</div>
                  <div class="spec-value">{{ displayLanguage(currentGame) }}</div>
              </div>

              <!-- Дата добавления -->
              <div class="spec-row">
                <div class="spec-label">Дата добавления:</div>
                <div class="spec-value">{{ formatDate(currentGame.createdAt || currentGame.created_at) }}</div>
              </div>
            </div>

            <!-- Кнопки действий -->
            <div class="buttons-section">
              <button 
                class="btn btn-primary" 
                @click="addToCart"
                :disabled="!currentGame || cartLoading"
              >
                <span v-if="cartLoading">Добавление...</span>
                <span v-else>В корзину</span>
              </button>
              
              <button 
                class="btn btn-success" 
                @click="buyNow"
                :disabled="!currentGame"
              >
                Купить сейчас
              </button>
            </div>
          </div>
        </div>
        
        <!-- Игра не найдена -->
        <div v-else class="not-found">
          Игра не найдена
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import genresList from '../data/genres.js'
import { useAuthStore } from '../stores/auth.js'
import { useRouter } from 'vue-router'
import { games, cart, orders } from '../services/api.js'

const props = defineProps({
  gameId: {
    type: [Number, String],
    required: false
  },
  game: {
    type: Object,
    default: null
  },
  isVisible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'add-to-cart', 'buy-now'])

const router = useRouter()
const authStore = useAuthStore?.()

// Состояние
const game = ref(null)
const loading = ref(false)
const error = ref('')
const cartLoading = ref(false)
const localDescription = ref('')
const localLanguage = ref('')

// Форматирование цены
const formatPrice = (price) => {
  return new Intl.NumberFormat('ru-RU').format(price || 0)
}

// Форматирование даты
const formatDate = (dateString) => {
  if (!dateString) return 'Не указана'
  try {
    return new Date(dateString).toLocaleDateString('ru-RU')
  } catch {
    return 'Не указана'
  }
}

// Форматирование жанров
const formattedGenres = computed(() => {
  if (!currentGame.value) return []

  const genres = currentGame.value.genres || currentGame.value.tags || currentGame.value.categories || []
  const labels = genres.map(g => {
    if (typeof g === 'string') {
      const found = genresList.find(x => x.id === g || x.label === g)
      return found ? found.label : null
    } else if (g && g.title) {
      const found = genresList.find(x => x.id === g.title || x.label === g.title)
      return found ? found.label : null
    } else if (g && g.id) {
      const found = genresList.find(x => x.id === g.id || x.label === g.id)
      return found ? found.label : null
    }
    return null
  }).filter(Boolean)

  // remove duplicates while preserving order
  const seen = new Set()
  const unique = []
  for (const l of labels) {
    if (!seen.has(l)) {
      seen.add(l)
      unique.push(l)
    }
  }
  return unique
})

// Показ языка интерфейса — принимает объект игры и поддерживает string или массив
const displayLanguage = (game) => {
  if (!game) return localLanguage.value || 'Не указан'
  const lang = game.language || game.Language || game.lang
  if (!lang) return localLanguage.value || 'Не указан'
  if (Array.isArray(lang)) return lang.join(', ')
  if (typeof lang === 'string') return lang
  try { return String(lang) } catch { return localLanguage.value || 'Не указан' }
}

// Текущая игра
const currentGame = computed(() => props.game || game.value)

function normalizeGameObject(g) {
  if (!g) return g
  const copy = JSON.parse(JSON.stringify(g))
  // normalize genres: accept ['ID','ID'] or [{title:'ID'}] or [{id:'ID'}]
  const rawGenres = copy.genres || copy.tags || copy.categories || []
  copy.genres = rawGenres.map(item => {
    if (!item) return null
    if (typeof item === 'string') return { title: item }
    if (item.title) return { title: item.title }
    if (item.id) return { title: item.id }
    return null
  }).filter(Boolean)

  // normalize language key
  copy.language = copy.language || copy.Language || copy.lang || ''

  return copy
}

// Загрузка игры
const loadGame = async () => {
  if (props.game) {
    game.value = props.game
    return
  }

  if (!props.gameId && props.gameId !== 0) return

  try {
    loading.value = true
    error.value = ''

    const resp = await games.getById(props.gameId)
    if (!resp || resp.statusCode) {
      if (resp && resp.statusCode === 404) throw new Error('Игра не найдена')
      throw new Error(resp?.message || 'Ошибка загрузки')
    }

    game.value = normalizeGameObject(resp)

  } catch (err) {
    error.value = err.message
    console.error('Ошибка загрузки игры:', err)
  } finally {
    loading.value = false
  }
}

// Загружаем описание из products.json и возможный запасной язык
const fetchLocalDescription = async (id) => {
  try {
    const resp = await games.getById(id)
    if (resp && !resp.statusCode) {
      if (resp.description) localDescription.value = resp.description
      if (resp.language && !currentGame.value?.language && !currentGame.value?.Language && !currentGame.value?.lang) {
        localLanguage.value = resp.language
      }
      return
    }
  } catch (err) {
    console.warn('fetchLocalDescription error', err)
  }
  localDescription.value = ''
}

// Добавление в корзину
const addToCart = async () => {
  if (!authStore?.isAuthenticated) {
    router.push('/login')
    emit('close')
    return
  }

  const g = currentGame.value
  if (!g) return

  cartLoading.value = true

  try {
    const resp = await cart.addItem(g.id, 1)
    if (!resp || resp.statusCode) {
      alert(resp?.message || 'Ошибка добавления в корзину')
    } else {
      emit('add-to-cart', g.id)
      alert('Товар добавлен в корзину!')
    }
  } catch (err) {
    alert('Ошибка сети')
  } finally {
    cartLoading.value = false
  }
}

// Покупка сейчас
const buyNow = async () => {
  if (!authStore?.isAuthenticated) {
    router.push('/login')
    emit('close')
    return
  }

  const g = currentGame.value
  if (!g) return

  try {
    const resp = await orders.createOrder([{ gameId: g.id, quantity: 1 }])
    if (!resp || resp.statusCode) {
      alert(resp?.message || 'Ошибка оформления заказа')
      return
    }
    emit('buy-now', resp)
    emit('close')
    router.push(`/order/${resp.id}`)
  } catch (err) {
    alert('Ошибка сети')
  }
}

// Закрытие
const emitClose = () => {
  emit('close')
}

// Закрытие по Escape
const handleEscape = (e) => {
  if (e.key === 'Escape' && props.isVisible) {
    emitClose()
  }
}

// Обработчик прокрутки колесиком мыши
const handleWheel = (e) => {
  const modalContent = e.currentTarget
  modalContent.scrollTop += e.deltaY
}

// Обработчик touch-событий для мобильных устройств
const handleTouchMove = (e) => {
  // Разрешаем стандартное поведение (прокрутку) для сенсорных устройств
}

// При монтировании
onMounted(() => {
  document.addEventListener('keydown', handleEscape)
  if (props.isVisible) {
    document.body.style.overflow = 'hidden'
  }
})

// При размонтировании
onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
  document.body.style.overflow = ''
})

// При изменении видимости
watch(() => props.isVisible, (visible) => {
  if (visible) {
    document.body.style.overflow = 'hidden'
    loadGame()
  } else {
    document.body.style.overflow = ''
  }
})

// При изменении gameId
watch(() => props.gameId, () => {
  if (props.isVisible) {
    loadGame()
  }
})

// Если родитель передаёт готовый объект игры
watch(() => props.game, (g) => {
  if (g) {
    game.value = normalizeGameObject(g)
    // if incoming game has language, set localLanguage so displayLanguage shows it
    if (g.language || g.Language || g.lang) localLanguage.value = g.language || g.Language || g.lang
  }
})

// Загружаем описание при изменении текущей игры
watch(currentGame, (cg) => {
  if (cg && (cg.id || cg._id)) {
    const id = cg.id || cg._id
    fetchLocalDescription(id)
  } else {
    localDescription.value = ''
  }
})
</script>

<style scoped>
/* Модальные стили */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  overflow: hidden;
}

.modal-content {
  width: 1505px;
  max-width: 95vw;
  max-height: 865px;
  background: #EFEFEF;
  border: 8px solid #A53DFF;
  border-radius: 30px;
  padding: 30px;
  box-sizing: border-box;
  position: relative;
  font-family: 'Montserrat Alternates', sans-serif;
  overflow-y: scroll; /* Изменено на scroll */
  /* Скрываем скроллбар */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE и Edge */
}

/* Скрываем скроллбар для WebKit браузеров (Chrome, Safari) */
.modal-content::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

.modal-close {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 24px;
  cursor: pointer;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s;
}

.modal-close:hover {
  background: rgba(0, 0, 0, 0.8);
}

/* Анимация */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* Основной контент */
.product-details-content {
  display: flex;
  gap: 50px;
}

/* Левая колонка */
.left-section {
  flex: 0 0 280px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
}

.vertical-photo-wrapper.card-size {
  width: 280px;
  height: 450px;
  background: transparent;
  border-radius: 30px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.vertical-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  position: relative;
  z-index: 2;
}

.photo-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #E6E6E6;
  z-index: 1;
  pointer-events: none;
}

.photo-placeholder.large {
  background: #E6E6E6;
}

.no-image-text {
  color: #999;
  font-size: 24px;
  font-family: 'Montserrat Alternates', sans-serif;
}

.photo-placeholder.large .no-image-text {
  font-size: 32px;
}

.photo-label {
  margin: 0;
  font-size: 16px;
  color: #666;
  align-self: center;
  text-align: center;
  width: 100%;
}

/* Центральная колонка */
.center-section {
  flex: 0 0 612px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.product-image-wrapper {
  width: 100%;
  height: 428px;
  max-height: 50vh;
  background: transparent;
  border-radius: 30px;
  overflow: hidden;
  position: relative;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: relative;
  z-index: 2;
}

.product-description-box {
  width: 100%;
  background: transparent;
}

.field-label {
  display: block;
  margin-bottom: 6px;
  color: #666;
  font-family: 'Montserrat Alternates', sans-serif;
  font-size: 20px;
}

.description-text {
  width: 100%;
  min-height: 115px;
  padding: 12px;
  border-radius: 15px;
  background: #E6E6E6;
  font-size: 20px;
  font-family: 'Montserrat Alternates', sans-serif;
  box-sizing: border-box;
  color: #000;
  line-height: 1.6;
  overflow-y: auto;
  word-wrap: break-word;
  /* Скрываем скроллбар внутри текста описания */
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.description-text::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

.price-section {
  margin-top: 10px;
  background: transparent;
  padding: 0;
}

.price-display {
  width: 100%;
  max-width: 288px;
  height: 113px;
  padding: 8px 12px;
  border-radius: 15px;
  font-size: 64px;
  color: #A53DFF;
  background: #E6E6E6;
  font-family: 'Montserrat Alternates', sans-serif;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

/* Правая колонка */
.right-section {
  flex: 0 0 372px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 0;
  box-sizing: border-box;
  align-items: flex-start;
}

.product-title-display {
  width: 100%;
  height: 73px;
  border-radius: 15px;
  background: #E6E6E6;
  font-size: 28px;
  color: #A53DFF;
  box-sizing: border-box;
  text-align: center;
  font-family: 'Montserrat Alternates', sans-serif;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  word-break: break-word;
}

.seller-info {
  display: flex;
  width: 100%;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  margin-top: 8px;
}

.seller-icon {
  width: 21px;
  height: 21px;
}

.seller-name {
  font-size: 24px;
  color: #454545;
  font-weight: 500;
}

/* Технические характеристики */
.specs {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 20px;
  background: #E6E6E6;
  border-radius: 15px;
  width: 100%;
}

.spec-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  font-size: 18px;
  min-height: 48px;
}

.spec-label {
  padding: 0;
  min-width: 140px;
  color: #666;
  font-weight: 600;
  text-align: left;
  line-height: 1.4;
}

.spec-value {
  width: 220px;
  flex: 0 0 220px;
  padding: 12px 14px;
  border-radius: 12px;
  background: #EFEFEF;
  font-size: 16px;
  font-family: 'Montserrat Alternates', sans-serif;
  box-sizing: border-box;
  color: #000;
  text-align: center;
  line-height: 1.4;
  word-break: break-word;
}

/* Выбранные жанры */
.selected-genres {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-start;
  width: 100%;
}

.selected-genre-tag {
  background: #A53DFF;
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-family: 'Montserrat Alternates', sans-serif;
}

.no-genres-text {
  color: #999;
  font-style: italic;
}

/* Кнопки действий */
.buttons-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  margin-top: auto;
  width: 100%;
}

.btn {
  width: 100%;
  max-width: 435px;
  height: 80px;
  border: none;
  border-radius: 15px;
  font-size: 32px;
  font-family: 'Montserrat Alternates', sans-serif;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}

.btn-primary {
  background: #A53DFF;
  color: #fff;
  box-shadow: 0 8px 20px rgba(165, 61, 255, 0.25);
}

.btn-primary:hover:not(:disabled) {
  background: #8B1FD9;
  transform: translateY(-3px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-success {
  background: #0962C9;
  color: #fff;
  box-shadow: 0 8px 20px rgba(9, 98, 201, 0.25);
}

.btn-success:hover:not(:disabled) {
  background: #0750A8;
  transform: translateY(-3px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
}

.btn-success:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn:active {
  transform: translateY(3px) scale(0.995);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.12);
}

/* Сообщения */
.loading, .error, .not-found {
  text-align: center;
  padding: 100px;
  font-size: 24px;
  color: #666;
  font-family: 'Montserrat Alternates', sans-serif;
}

/* Адаптивность - исправлены горизонтальные полосы */
@media (max-width: 1600px) {
  .product-details-content {
    gap: 30px;
    padding: 20px;
  }
  
  .center-section {
    flex: 0 0 500px;
  }
}

@media (max-width: 1400px) {
  .product-details-content {
    gap: 20px;
    padding: 15px;
  }
  
  .left-section {
    flex: 0 0 250px;
  }
  
  .vertical-photo-wrapper.card-size {
    width: 250px;
    height: 300px;
  }
  
  .center-section {
    flex: 0 0 450px;
  }
  
  .right-section {
    flex: 0 0 300px;
  }
  
  .spec-value,
  .selected-genres {
    width: 180px;
    flex: 0 0 180px;
  }
  
  .spec-label {
    min-width: 120px;
  }
}

@media (max-width: 1200px) {
  .product-details-content {
    flex-direction: column;
    height: auto;
    max-height: none;
    overflow-y: visible;
    gap: 30px;
  }
  
  .modal-content {
    max-height: 90vh;
  }
  
  .left-section,
  .center-section,
  .right-section {
    width: 100%;
    flex: none;
  }
  
  .vertical-photo-wrapper.card-size {
    width: 250px;
    height: 300px;
    margin: 0 auto;
  }
  
  .product-image-wrapper {
    width: 100%;
    height: 300px;
  }
  
  .specs {
    margin-top: 20px;
  }
  
  .buttons-section {
    margin-top: 30px;
  }
}

@media (max-width: 768px) {
  .modal-content {
    padding: 15px;
    gap: 15px;
    border-width: 4px;
  }
  
  .product-details-content {
    gap: 20px;
  }
  
  .spec-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    width: 100%;
  }
  
  .spec-value,
  .selected-genres {
    width: 100%;
    flex: none;
  }
  
  .spec-label {
    min-width: 100%;
  }
  
  .product-title-display {
    font-size: 24px;
    height: 60px;
  }
  
  .price-display {
    font-size: 48px;
    height: 80px;
  }
  
  .btn {
    height: 60px;
    font-size: 24px;
  }
  
  .seller-name {
    font-size: 20px;
  }
}

@media (max-width: 480px) {
  .modal-overlay {
    padding: 10px;
  }
  
  .modal-content {
    padding: 10px;
    border-width: 3px;
    border-radius: 20px;
  }
  
  .vertical-photo-wrapper.card-size {
    width: 200px;
    height: 250px;
    border-radius: 20px;
  }
  
  .product-image-wrapper {
    height: 200px;
    border-radius: 20px;
  }
  
  .product-title-display {
    font-size: 20px;
    height: 50px;
  }
  
  .btn {
    height: 50px;
    font-size: 20px;
  }
  
  .spec-label,
  .spec-value {
    font-size: 16px;
  }
  
  .price-display {
    font-size: 36px;
    height: 60px;
  }
  
  .description-text {
    font-size: 16px;
    min-height: 100px;
  }
}
</style>