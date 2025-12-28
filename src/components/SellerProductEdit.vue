<template>
  <div class="modal-overlay" @click.self="handleCancel">
    <div class="product-edit-modal">
      <div v-if="loading" class="loading">
        Загрузка данных...
      </div>
      
      <form v-else @submit.prevent="handleSubmit" class="product-details" enctype="multipart/form-data">
        
        <div class="left-section">
          <!-- Карточка игры -->
          <div class="vertical-photo-wrapper card-size">
            <img 
              v-if="previewCardImage" 
              :src="previewCardImage" 
              alt="Превью карточки" 
              class="vertical-photo" 
            />
            <img 
              v-else-if="form.imageUrl" 
              :src="form.imageUrl" 
              alt="Текущее изображение" 
              class="vertical-photo" 
            />
            <div v-else class="photo-placeholder">
              <div class="no-image-text">Нет изображения</div>
            </div>
            
            <!-- Менюшка загрузки для карточки (УБРАТЬ - нет в API) -->
            <div class="image-upload-menu">
              <label class="upload-menu-btn">
                <span>Выберите фото</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  @change="handleCardImageChange"
                  class="file-input-hidden"
                />
              </label>
            </div>
          </div>

          <p class="photo-label">Изображение игры</p>

          <!-- Файл с ключами (только при создании) -->
          <div class="photo-upload-placeholder" v-if="!isEditMode">
            <label class="upload-label">
              Файл с ключами (JSON) - обязателен:
              <div class="file-upload-btn">
                <span>Выбрать файл</span>
                <input 
                  type="file" 
                  accept=".json" 
                  @change="handleKeysFileChange"
                  class="file-input-hidden"
                  required
                />
              </div>
            </label>
            <div v-if="keysFile" class="file-name">
              {{ keysFile.name }}
            </div>
            <div v-else class="file-warning">
              *Обязательное поле для создания игры
            </div>
          </div>

          <div class="seller-note-plain">
            Примечание для продавцов:<br />
            Все поля обязательны для заполнения!
          </div>
          
          <!-- Количество в наличии -->
          <div class="stock-info" v-if="form.count !== undefined">
            <div class="field-label">Ключей в наличии:</div>
            <div class="stock-count">{{ form.count }}</div>
            <div class="add-keys-section" v-if="isEditMode">
              <label class="upload-label small">
                Добавить ключи (JSON):
                <div class="file-upload-btn small">
                  <span>Выбрать файл</span>
                  <input 
                    type="file" 
                    accept=".json" 
                    @change="handleAdditionalKeysChange"
                    class="file-input-hidden"
                  />
                </div>
              </label>
            </div>
          </div>
        </div>

        <div class="center-section">
          <!-- Основное изображение -->
          <div class="product-image-wrapper">
            <img 
              v-if="previewMainImage" 
              :src="previewMainImage" 
              alt="Превью основного изображения" 
              class="product-image" 
            />
            <img 
              v-else-if="form.imageUrl" 
              :src="form.imageUrl" 
              alt="Текущее изображение" 
              class="product-image" 
            />
            <div v-else class="photo-placeholder large">
              <div class="no-image-text">Нет изображения</div>
            </div>
            
            <!-- Менюшка загрузки для основного фото -->
            <div class="image-upload-menu">
              <label class="upload-menu-btn">
                <span>Выберите фото</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  @change="handleMainImageChange"
                  class="file-input-hidden"
                  :required="!isEditMode"
                />
              </label>
            </div>
          </div>
          
          <!-- Описание -->
          <div class="product-description-box">
            <label class="field-label">Описание (до 1000 символов):</label>
            <textarea 
              v-model="form.description" 
              class="product-description-input" 
              rows="4"
              :maxlength="1000"
              placeholder="Описание игры..."
            ></textarea>
            <div class="char-counter">{{ form.description?.length || 0 }}/1000</div>
          </div>

          <!-- Цена -->
          <div class="price-section">
            <label class="field-label">Цена (₽):</label>
            <input 
              type="number" 
              v-model.number="form.price" 
              class="price-input" 
              min="0.1" 
              step="0.01"
              required
            />
            <div class="price-hint">Минимальная цена: 0.1 ₽</div>
          </div>
        </div>

        <div class="right-section">
          <!-- Название -->
          <input 
            v-model="form.title" 
            class="product-title-input" 
            placeholder="Название игры"
            required
            minlength="2"
            maxlength="100"
          />

          <!-- Информация о продавце -->
          <div class="seller-info">
            <img src="/src/assets/icons/saleman.svg" alt="Продавец" class="seller-icon" />
            <span class="seller-name">{{ currentUser?.username || 'Продавец' }}</span>
          </div>

          <!-- Технические характеристики -->
          <div class="specs">
            <div class="spec-row">
              <div class="spec-label">Разработчик:</div>
              <input 
                class="spec-input" 
                v-model="form.developerTitle" 
                placeholder="CD Projekt Red"
                required
                minlength="2"
                maxlength="100"
              />
            </div>
            
            <div class="spec-row">
              <div class="spec-label">Издатель:</div>
              <input 
                class="spec-input" 
                v-model="form.publisherTitle" 
                placeholder="CD Projekt"
                required
                minlength="2"
                maxlength="100"
              />
            </div>
            
            <!-- Жанры -->
            <div class="spec-row">
              <div class="spec-label">Жанры:</div>
              <button 
                type="button" 
                class="genre-select-btn"
                @click="openGenreSelector"
              >
                Выбрать жанры
              </button>
            </div>
            
            <!-- Выбранные жанры -->
            <div v-if="selectedGenres.length > 0" class="selected-genres">
              <div v-for="(genre, index) in selectedGenres" :key="genre.id" class="selected-genre-tag">
                {{ genre.title }}
                <button type="button" class="remove-genre" @click="removeSelectedGenre(index)">×</button>
              </div>
            </div>
            
            <!-- УБИРАЕМ платформу и язык - их нет в API -->
          </div>

          <!-- Сообщения об ошибках/успехе -->
          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>
          
          <div v-if="successMessage" class="success-message">
            {{ successMessage }}
          </div>

          <!-- Кнопки действий -->
          <div class="buttons-section">
            <button type="submit" class="btn btn-save" :disabled="submitting">
              <span v-if="submitting">Сохранение...</span>
              <span v-else>{{ isEditMode ? 'Обновить игру' : 'Создать игру' }}</span>
            </button>
            
            <button type="button" class="btn btn-cancel" @click="handleCancel" :disabled="submitting">
              Отменить
            </button>
          </div>
        </div>
      </form>
      <GenresMenu v-model:visible="showGenreMenu" :initialSelected="initialSelectedIds" @apply="onGenresApply" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import GenresMenu from './GenresMenu.vue'
import genresList from '../data/genres.js' // ИСПРАВЛЕННЫЙ ПУТЬ
import { useAuthStore } from '../stores/auth.js'
import { games } from '../services/api' // ✅ правильный импорт

const authStore = useAuthStore?.() || {
  isAuthenticated: false,
  userRole: null,
  user: { username: 'Продавец' }
}

const props = defineProps({
  gameId: {
    type: [Number, String],
    default: null
  }
})

const emit = defineEmits(['saved', 'close'])

// Режим редактирования или создания
const isEditMode = computed(() => props.gameId !== null)

// Состояние формы (ТОЛЬКО поля из DTO)
const form = reactive({
  title: '',
  developerTitle: '',
  publisherTitle: '',
  price: 0.1, // Минимальная цена по API
  description: '',
  genres: [],
  imageUrl: ''
})

// Файлы
const mainImageFile = ref(null)
const keysFile = ref(null)
const additionalKeysFile = ref(null)

// Превью изображений
const previewMainImage = ref('')

// UI состояние
const loading = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Для отображения выбранных жанров
const selectedGenres = ref([])

// Текущий пользователь
const currentUser = computed(() => {
  return authStore.user || { username: 'Продавец' }
})

// Загрузка данных игры для редактирования
const loadGame = async () => {
  if (!isEditMode.value) return
  
  loading.value = true
  try {
    console.log('Загрузка игры ID:', props.gameId)
    const gameResp = await games.getById(props.gameId)
    
    // Проверяем на ошибку (если есть statusCode - это ошибка)
    if (gameResp && gameResp.statusCode) {
      throw new Error(gameResp.message || 'Не удалось загрузить игру')
    }
    
    if (!gameResp) {
      throw new Error('Игра не найдена')
    }

    // Заполняем форму (только нужные поля)
    Object.assign(form, {
      title: gameResp.title || '',
      developerTitle: gameResp.developerTitle || '',
      publisherTitle: gameResp.publisherTitle || '',
      price: gameResp.price || 0.1,
      description: gameResp.description || '',
      imageUrl: gameResp.imageUrl || '',
      count: gameResp.count || 0
    })

    // Обрабатываем жанры
    selectedGenres.value = (gameResp.genres || []).map(g => {
      const title = g.Title || g.title || ''
      const found = genresList.find(x => x.id === title || x.label === title)
      return { 
        id: found ? found.id : title, 
        title: found ? found.label : title 
      }
    })
    
    // Сохраняем для отправки (используем ID жанров)
    form.genres = selectedGenres.value.map(g => ({ title: g.id }))
    
  } catch (error) {
    console.error('Ошибка загрузки:', error)
    errorMessage.value = 'Ошибка загрузки: ' + error.message
  } finally {
    loading.value = false
  }
}

// Обработчики файлов
const handleMainImageChange = (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  if (!file.type.startsWith('image/')) {
    errorMessage.value = 'Пожалуйста, выберите изображение'
    return
  }
  
  if (file.size > 5 * 1024 * 1024) {
    errorMessage.value = 'Изображение должно быть меньше 5MB'
    return
  }
  
  mainImageFile.value = file
  
  const reader = new FileReader()
  reader.onload = (e) => {
    previewMainImage.value = e.target.result
  }
  reader.readAsDataURL(file)
}

// УБИРАЕМ handleCardImageChange - нет в API

const handleKeysFileChange = (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
    errorMessage.value = 'Пожалуйста, выберите JSON файл'
    return
  }
  
  keysFile.value = file
}

const handleAdditionalKeysChange = (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
    errorMessage.value = 'Пожалуйста, выберите JSON файл'
    return
  }
  
  additionalKeysFile.value = file
}

// Управление жанрами
const showGenreMenu = ref(false)

const openGenreSelector = () => {
  showGenreMenu.value = true
}

const initialSelectedIds = computed(() => {
  return selectedGenres.value.map(sg => sg.id).filter(Boolean)
})

const onGenresApply = (selectedIds) => {
  // selectedIds — массив id (например ['FPS','RPG'])
  selectedGenres.value = selectedIds.map(id => {
    const found = genresList.find(x => x.id === id)
    return { id, title: found ? found.label : id }
  })
  
  // Сохраняем ID жанров для отправки
  form.genres = selectedIds.map(id => ({ title: id }))
  showGenreMenu.value = false
}

const removeSelectedGenre = (index) => {
  selectedGenres.value.splice(index, 1)
  form.genres.splice(index, 1)
}

// Отправка формы (ИСПРАВЛЕННАЯ согласно API)
const handleSubmit = async () => {
  if (!validateForm()) return
  
  submitting.value = true
  errorMessage.value = ''
  successMessage.value = ''
  
  try {
    const formData = new FormData()
    
    // 1. Обязательные поля из GameWithKeysRequest/GameRequest
    formData.append('Title', form.title)
    formData.append('DeveloperTitle', form.developerTitle)
    formData.append('PublisherTitle', form.publisherTitle)
    formData.append('Price', form.price.toString())
    
    // 2. Опциональное поле
    if (form.description) {
      formData.append('Description', form.description)
    }
    
    // 3. Жанры (отправляем ID как Title)
    selectedGenres.value.forEach((genre, index) => {
      // Отправляем ID жанра (например 'FPS')
      formData.append(`Genres[${index}].Title`, genre.id)
    })
    
    // 4. Изображение (обязательно для создания, опционально для обновления)
    if (mainImageFile.value) {
      formData.append('Image', mainImageFile.value)
    } else if (!isEditMode.value) {
      throw new Error('Изображение обязательно для создания игры')
    }
    
    // 5. Ключи (только для создания)
    if (!isEditMode.value) {
      if (!keysFile.value) {
        throw new Error('Файл с ключами обязателен для создания игры')
      }
      formData.append('Keys', keysFile.value)
    }
    
    // 6. Отправляем через сервис
    const savedGame = isEditMode.value
      ? await games.update(props.gameId, formData)
      : await games.create(formData)

    // 7. Проверяем ответ (если есть statusCode - ошибка)
    if (savedGame && savedGame.statusCode) {
      throw new Error(savedGame.message || savedGame.Message || 'Ошибка сохранения')
    }
    
    if (!savedGame) {
      throw new Error('Пустой ответ от сервера')
    }

    // 8. Дополнительные ключи (если есть)
    if (isEditMode.value && additionalKeysFile.value) {
      const keysFormData = new FormData()
      keysFormData.append('Keys', additionalKeysFile.value)
      
      const keysResp = await games.addKeys(savedGame.id, keysFormData)
      if (keysResp && keysResp.statusCode) {
        console.warn('Не удалось добавить ключи:', keysResp.message)
        // Не прерываем успешное сохранение, только логируем
      }
    }

    // 9. Успех
    successMessage.value = isEditMode.value
      ? 'Игра успешно обновлена!'
      : 'Игра успешно создана!'

    // 10. Закрываем через 1.5 секунды
    setTimeout(() => {
      emit('saved', savedGame)
      emit('close')
    }, 1500)
    
  } catch (error) {
    console.error('Ошибка сохранения игры:', error)
    errorMessage.value = error.message || 'Неизвестная ошибка'
  } finally {
    submitting.value = false
  }
}

// Валидация формы (согласно DTO)
const validateForm = () => {
  errorMessage.value = ''
  
  // Title: 2-100 символов
  if (!form.title || form.title.length < 2) {
    errorMessage.value = 'Название должно быть не менее 2 символов'
    return false
  }
  if (form.title.length > 100) {
    errorMessage.value = 'Название должно быть не более 100 символов'
    return false
  }
  
  // DeveloperTitle: 2-100 символов
  if (!form.developerTitle || form.developerTitle.length < 2) {
    errorMessage.value = 'Разработчик должен быть не менее 2 символов'
    return false
  }
  if (form.developerTitle.length > 100) {
    errorMessage.value = 'Разработчик должен быть не более 100 символов'
    return false
  }
  
  // PublisherTitle: 2-100 символов
  if (!form.publisherTitle || form.publisherTitle.length < 2) {
    errorMessage.value = 'Издатель должен быть не менее 2 символов'
    return false
  }
  if (form.publisherTitle.length > 100) {
    errorMessage.value = 'Издатель должен быть не более 100 символов'
    return false
  }
  
  // Price: от 0.1
  if (form.price < 0.1) {
    errorMessage.value = 'Цена должна быть не менее 0.1 ₽'
    return false
  }
  
  // Description: до 1000 символов
  if (form.description && form.description.length > 1000) {
    errorMessage.value = 'Описание должно быть не более 1000 символов'
    return false
  }
  
  // Genres: хотя бы один
  if (selectedGenres.value.length === 0) {
    errorMessage.value = 'Добавьте хотя бы один жанр'
    return false
  }
  
  // Изображение (для создания)
  if (!isEditMode.value && !mainImageFile.value) {
    errorMessage.value = 'Изображение обязательно для создания игры'
    return false
  }
  
  // Ключи (для создания)
  if (!isEditMode.value && !keysFile.value) {
    errorMessage.value = 'Файл с ключами обязателен для создания игры'
    return false
  }
  
  return true
}

// Отмена
const handleCancel = () => {
  emit('close')
}

// Проверка авторизации
const checkAuth = () => {
  if (!authStore.isAuthenticated || authStore.userRole !== 'SELLER') {
    console.warn('Требуется авторизация продавца')
    errorMessage.value = 'Требуется авторизация продавца'
    return false
  }
  return true
}

// Инициализация
onMounted(() => {
  if (!checkAuth()) return
  loadGame()
})

// При изменении gameId
watch(() => props.gameId, () => {
  loadGame()
})
</script>

<style scoped>
/* Основные стили модального окна */
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

.product-edit-modal {
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
}

/* Основные стили формы */
.product-details {
  width: 1505px;
  max-width: 95vw;
  height: auto;
  max-height: 865px;
  background: #EFEFEF;
  border: 8px solid #A53DFF;
  border-radius: 30px;
  display: flex;
  gap: 50px;
  padding: 30px;
  box-sizing: border-box;
  font-family: 'Montserrat Alternates', sans-serif;
  position: relative;
}

.loading {
  text-align: center;
  padding: 100px;
  font-size: 24px;
  color: #666;
  font-family: 'Montserrat Alternates', sans-serif;
}

/* Место под фото с фоном */
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

.upload-label {
  display: block;
  margin-bottom: 8px;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  font-family: 'Montserrat Alternates', sans-serif;
}

.upload-label.small {
  font-size: 12px;
}

/* Кнопка для загрузки файлов */
.file-upload-btn {
  display: inline-block;
  padding: 8px 16px;
  background: #A53DFF;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-family: 'Montserrat Alternates', sans-serif;
  font-size: 14px;
  transition: background 0.3s;
  margin-top: 4px;
  text-align: center;
}

.file-upload-btn:hover {
  background: #8B1FD9;
}

.file-upload-btn.small {
  padding: 6px 12px;
  font-size: 12px;
}

.file-input-hidden {
  display: none;
}

.file-name {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
  word-break: break-all;
  font-family: 'Montserrat Alternates', sans-serif;
}

.file-warning {
  font-size: 12px;
  color: #FA541C;
  margin-top: 4px;
  font-family: 'Montserrat', sans-serif;
}

.stock-info {
  background: #E6E6E6;
  padding: 12px;
  border-radius: 15px;
  width: 100%;
  margin-top: 10px;
}

.stock-count {
  font-size: 24px;
  font-weight: bold;
  color: #52C41A;
  text-align: center;
  margin: 8px 0;
  font-family: 'Montserrat Alternates', sans-serif;
}

.add-keys-section {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #ddd;
}

.char-counter {
  text-align: right;
  font-size: 12px;
  color: #999;
  margin-top: 4px;
  font-family: 'Montserrat Alternates', sans-serif;
}

.price-hint {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
  font-family: 'Montserrat Alternates', sans-serif;
}

/* Менюшка загрузки фото */
.image-upload-menu {
  position: absolute;
  bottom: 10px;
  right: 10px;
  z-index: 3;
}

.upload-menu-btn {
  display: inline-block;
  padding: 8px 16px;
  background: #A53DFF;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-family: 'Montserrat Alternates', sans-serif;
  font-size: 14px;
  transition: all 0.3s;
}

.upload-menu-btn:hover {
  background: #8B1FD9;
  transform: scale(1.05);
}

/* Кнопка выбора жанров */
.genre-select-btn {
  width: 220px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(0,0,0,0.08);
  background: #A53DFF;
  color: white;
  font-size: 16px;
  font-family: 'Montserrat Alternates', sans-serif;
  cursor: pointer;
  transition: background 0.3s;
  border: none;
}

.genre-select-btn:hover {
  background: #8B1FD9;
}

/* Стили для выбранных жанров */
.selected-genres {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
  width: 100%;
}

.selected-genre-tag {
  background: #A53DFF;
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'Montserrat Alternates', sans-serif;
}

.remove-genre {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 16px;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Montserrat Alternates', sans-serif;
}

.remove-genre:hover {
  color: #ffcccc;
}

.error-message {
  background: #FFF2E8;
  border: 1px solid #FFBB96;
  color: #FA541C;
  padding: 12px;
  border-radius: 10px;
  margin: 10px 0;
  text-align: center;
  font-family: 'Montserrat Alternates', sans-serif;
}

.success-message {
  background: #F6FFED;
  border: 1px solid #B7EB8F;
  color: #52C41A;
  padding: 12px;
  border-radius: 10px;
  margin: 10px 0;
  text-align: center;
  font-family: 'Montserrat Alternates', sans-serif;
  animation: fadeIn 0.5s;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Секции формы */
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

.photo-upload-placeholder { 
  height:40px; 
  width:100%; 
  box-sizing:border-box 
}

.photo-label { 
  margin: 0; 
  font-size: 16px; 
  color: #666; 
  align-self: center; 
  text-align: center; 
}

.seller-note-plain { 
  margin-top: 100px; 
  color: #666; 
  font-size: 24px; 
  line-height:1.3 
}

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
  width:100%; 
  background: transparent; 
}

.field-label { 
  display:block; 
  margin-bottom:6px; 
  color:#666;
  font-family: 'Montserrat Alternates', sans-serif;
}

.product-description-input { 
  width: 100%; 
  height: 115px; 
  padding:12px; 
  border-radius:15px;
  background:#E6E6E6; 
  font-size: 20px; 
  font-family: 'Montserrat Alternates', sans-serif;
  border: none;
  resize: vertical;
  box-sizing: border-box;
}

.price-section { 
  margin-top: 10px; 
  background: transparent; 
  padding:0 
}

/* Убираем ползунки у input number */
.price-input {
  width: 100%; 
  max-width: 288px;
  height: 113px; 
  padding:8px 12px; 
  border-radius:15px; 
  font-size: 64px;
  color:#A53DFF;
  background:#E6E6E6;
  border: none;
  font-family: 'Montserrat Alternates', sans-serif;
  box-sizing: border-box;
  appearance: textfield;
  -moz-appearance: textfield;
}

.price-input::-webkit-outer-spin-button,
.price-input::-webkit-inner-spin-button {
  appearance: none;
  -webkit-appearance: none;
  margin: 0;
}

.right-section { 
  flex: 0 0 372px; 
  display: flex; 
  flex-direction: column; 
  gap:20px; 
  padding:0; 
  box-sizing: border-box; 
  align-items: flex-start 
}

.product-title-input { 
  width:100%; 
  height:73px; 
  border-radius:15px; 
  background:#E6E6E6; 
  font-size:28px; 
  color:#A53DFF; 
  box-sizing: border-box; 
  text-align: center; 
  font-family: 'Montserrat Alternates', sans-serif ; 
  font-weight: bold;
  border: none;
  padding: 0 20px;
}

.product-title-input::placeholder {
  color: rgba(165, 61, 255, 0.5);
}

.seller-info { 
  display:flex; 
  width:100%; 
  justify-content:center; 
  align-items:center; 
  gap:8px; 
  padding:6px 0; 
  margin-top:8px 
}

.seller-icon { 
  width:21px; 
  height:21px 
}

.specs { 
  flex:1; 
  display:flex; 
  flex-direction:column; 
  gap:18px; 
  padding:0; 
  border-radius:15px 
}

.spec-row { 
  display:flex; 
  justify-content:space-between; 
  align-items:center; 
  gap:12px; 
  font-size:18px 
}

.spec-label { 
  padding:0; 
  min-width:140px; 
  color:#666; 
  font-weight:600; 
  text-align:left 
}

.spec-input {
  width:220px; 
  flex: 0 0 220px; 
  padding:12px 14px; 
  border-radius:12px; 
  border:1px solid rgba(0,0,0,0.08); 
  background:#E6E6E6; 
  font-size:16px; 
  font-family: 'Montserrat Alternates', sans-serif;
  border: none;
  box-sizing: border-box;
}

.spec-input::placeholder {
  color: rgba(0, 0, 0, 0.3);
}

.buttons-section { 
  display:flex; 
  flex-direction:column; 
  gap:16px; 
  align-items:center; 
  margin-top:auto;
  width: 100%;
}

.btn { 
  width:100%; 
  max-width: 435px;
  height:80px; 
  border:none; 
  border-radius:15px; 
  font-size:32px; 
  font-family:'Montserrat Alternates', sans-serif; 
  font-weight:600; 
  cursor:pointer; 
  transition: transform 0.12s ease, box-shadow 0.12s ease 
}

.btn-save { 
  background:#A53DFF; 
  color:#fff; 
  box-shadow:0 8px 20px rgba(165,61,255,0.25) 
}

.btn-cancel { 
  background:#0962C9; 
  color:#fff; 
  box-shadow:0 8px 20px rgba(9,98,201,0.25) 
}

.btn:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.2);
}

.btn:active { 
  transform: translateY(3px) scale(0.995); 
  box-shadow: 0 6px 14px rgba(0,0,0,0.12) 
}

/* Адаптивность */
@media (max-width: 1600px) {
  .product-details {
    gap: 30px;
    padding: 20px;
    width: 1400px;
  }
  
  .center-section {
    flex: 0 0 500px;
  }
}

@media (max-width: 1400px) {
  .product-details {
    width: 1200px;
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
  
  .spec-input,
  .genre-select-btn {
    width: 180px;
    flex: 0 0 180px;
  }
  
  .spec-label {
    min-width: 120px;
  }
}

@media (max-width: 1200px) {
  .product-details {
    flex-direction: column;
    height: auto;
    max-height: 90vh;
    width: 95vw;
    overflow-y: auto;
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
  
  .seller-note-plain {
    margin-top: 20px;
    text-align: center;
  }
  
  .product-image-wrapper {
    width: 100%;
    height: 300px;
  }
  
  .specs {
    margin-top: 20px;
  }
  
  .spec-row {
    flex-wrap: wrap;
  }
  
  .buttons-section {
    margin-top: 30px;
  }
}

@media (max-width: 768px) {
  .product-details {
    padding: 15px;
    gap: 15px;
    border-width: 4px;
  }
  
  .spec-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    width: 100%;
  }
  
  .spec-input,
  .genre-select-btn {
    width: 100%;
    flex: none;
  }
  
  .spec-label {
    min-width: 100%;
  }
  
  .product-title-input {
    font-size: 24px;
    height: 60px;
  }
  
  .price-input {
    font-size: 48px;
    height: 80px;
  }
  
  .btn {
    height: 60px;
    font-size: 24px;
  }
  
  .seller-note-plain {
    font-size: 18px;
  }
  
  .image-upload-menu {
    bottom: 5px;
    right: 5px;
  }
  
  .upload-menu-btn {
    padding: 6px 12px;
    font-size: 12px;
  }
  
  .selected-genres {
    gap: 6px;
  }
  
  .selected-genre-tag {
    font-size: 13px;
    padding: 5px 10px;
  }
}

@media (max-width: 480px) {
  .modal-overlay {
    padding: 10px;
  }
  
  .product-details {
    padding: 10px;
    border-width: 3px;
    border-radius: 20px;
  }
  
  .vertical-photo-wrapper.card-size {
    width: 200px;
    height: 250px;
  }
  
  .product-image-wrapper {
    height: 200px;
    border-radius: 20px;
  }
  
  .vertical-photo-wrapper.card-size {
    border-radius: 20px;
  }
  
  .product-title-input {
    font-size: 20px;
    height: 50px;
  }
  
  .btn {
    height: 50px;
    font-size: 20px;
  }
  
  .spec-label {
    font-size: 16px;
  }
  
  .spec-input,
  .genre-select-btn {
    font-size: 14px;
    padding: 10px;
  }
  
  .selected-genre-tag {
    font-size: 12px;
    padding: 4px 8px;
  }
}

/* Убираем скроллбар в некоторых браузерах */
.product-edit-modal::-webkit-scrollbar {
  width: 6px;
}

.product-edit-modal::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.product-edit-modal::-webkit-scrollbar-thumb {
  background: #A53DFF;
  border-radius: 3px;
}

.product-edit-modal::-webkit-scrollbar-thumb:hover {
  background: #8B1FD9;
}

/* Placeholder стили для полей ввода */
.product-title-input::placeholder,
.spec-input::placeholder,
.product-description-input::placeholder {
  color: rgba(0, 0, 0, 0.3);
  font-family: 'Montserrat Alternates', sans-serif;
  opacity: 1;
  transition: opacity 0.2s;
}

.product-title-input:focus::placeholder,
.spec-input:focus::placeholder,
.product-description-input:focus::placeholder {
  opacity: 0.5;
}
</style>