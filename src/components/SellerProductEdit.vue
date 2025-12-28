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
            
            <!-- Менюшка загрузки для карточки -->
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

          <p class="photo-label">Изображение карточки товара</p>

          <div class="photo-upload-placeholder" v-if="!isEditMode">
            <label class="upload-label">
              Файл с ключами (JSON):
              <div class="file-upload-btn">
                <span>Выбрать файл</span>
                <input 
                  type="file" 
                  accept=".json" 
                  @change="handleKeysFileChange"
                  class="file-input-hidden"
                />
              </div>
            </label>
            <div v-if="keysFile" class="file-name">
              {{ keysFile.name }}
            </div>
          </div>

          <div class="seller-note-plain">
            Примечание для продавцов:<br />
            Выставляя товар, вы обязаны заполнить все поля товара, в противном случае ваш товар будет удален!
          </div>
          
          <!-- Количество в наличии -->
          <div class="stock-info" v-if="form.count !== undefined">
            <div class="field-label">Ключей в наличии:</div>
            <div class="stock-count">{{ form.count }}</div>
            <div class="add-keys-section" v-if="isEditMode">
              <label class="upload-label small">
                Добавить ключи:
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
            <!-- Вернули фон -->
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
                />
              </label>
            </div>
          </div>
          
          <!-- Описание -->
          <div class="product-description-box">
            <label class="field-label">Описание:</label>
            <textarea 
              v-model="form.description" 
              class="product-description-input" 
              rows="4"
              :maxlength="1000"
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
              min="100" 
              step="1"
              required
            />
            <div class="price-hint">Минимальная цена: 100 ₽</div>
          </div>
        </div>

        <div class="right-section">
          <!-- Название -->
          <input 
            v-model="form.title" 
            class="product-title-input" 
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
            
            <!-- Скрываем отображение выбранных жанров: выбор виден в GenresMenu -->
            
            <!-- Платформа - всегда PC -->
            <div class="spec-row">
              <div class="spec-label">Платформа:</div>
              <div class="platform-text">PC</div>
            </div>
            
            <!-- Язык интерфейса с улучшенным меню -->
            <div class="spec-row spec-row-language">
              <div class="spec-label">Язык интерфейса:</div>
              <div class="language-select-container">
                <button type="button" class="language-select-btn" @click="toggleLanguageMenu">
                  <span v-if="selectedLanguages.length === 0">Выбрать язык</span>
                  <span v-else class="selected-count">{{ selectedLanguages.length }} выбрано</span>
                </button>
                
                <!-- Выбранные языки -->
                <div class="selected-languages-tags" v-if="selectedLanguages.length > 0">
                  <div v-for="(lang, i) in selectedLanguages" :key="lang" class="selected-language-tag">
                    {{ lang }}
                    <button type="button" class="remove-language" @click="toggleLanguage(lang)">×</button>
                  </div>
                </div>
                
                <!-- Меню выбора языков -->
                <div v-if="showLanguageMenu" class="language-menu">
                  <div class="language-menu-header">
                    <span class="language-menu-title">Выберите языки</span>
                    <button type="button" class="language-menu-close" @click="showLanguageMenu = false">×</button>
                  </div>
                  <div class="language-options">
                    <div v-for="opt in languageOptions" :key="opt" class="language-option">
                      <input 
                        type="checkbox" 
                        :id="`lang-${opt}`" 
                        :checked="selectedLanguages.includes(opt)" 
                        @change="toggleLanguage(opt)" 
                        class="language-checkbox"
                      />
                      <label :for="`lang-${opt}`" class="language-label">{{ opt }}</label>
                    </div>
                  </div>
                  <div class="language-menu-footer">
                    <button type="button" class="language-apply-btn" @click="showLanguageMenu = false">
                      Готово
                    </button>
                  </div>
                </div>
              </div>
            </div>
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
            
            <!-- Кнопка отменить теперь закрывает окно без изменений -->
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
import genresList from '../data/genres.js'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { games } from '../services/api'

const route = useRoute()
const router = useRouter()
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

const emit = defineEmits(['saved', 'save', 'canceled', 'cancel', 'close'])

// Режим редактирования или создания
const isEditMode = computed(() => props.gameId !== null)

// Состояние формы
const form = reactive({
  title: '',
  developerTitle: '',
  publisherTitle: '',
  price: 100, // Минимальная цена 100 рублей
  description: '',
  genres: [],
  language: '',
  platform: 'PC', // Платформа всегда PC
  imageUrl: ''
})

// Файлы
const mainImageFile = ref(null)
const cardImageFile = ref(null)
const keysFile = ref(null)
const additionalKeysFile = ref(null)

// Превью изображений
const previewMainImage = ref('')
const previewCardImage = ref('')

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
    
    if (!import.meta.env.VITE_API_URL) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockGame = {
        id: props.gameId,
        title: 'Название игры',
        developerTitle: 'Название разработчика',
        publisherTitle: 'Название издателя',
        price: 1000,
        description: 'Описание игры',
        genres: [{ title: 'Экшен' }, { title: 'Приключения' }],
        language: 'Русский, Английский',
        platform: 'PC',
        imageUrl: '',
        count: 10
      }
      
      Object.assign(form, mockGame)
      // map mock genres (may be labels) to {id, title}
      selectedGenres.value = (mockGame.genres || []).map(g => {
        const key = g.title
        const found = genresList.find(x => x.id === key || x.label === key)
        return { id: found ? found.id : key, title: found ? found.label : key }
      })
      successMessage.value = 'Мок-данные загружены (API не настроен)'
      // язык
      selectedLanguages.value = (mockGame.language || '').split(',').map(s=>s.trim()).filter(Boolean)
      
    } else {
      const gameResp = await games.getById(props.gameId)
      if (!gameResp || gameResp.statusCode) throw new Error(gameResp?.message || 'Не удалось загрузить игру')

      Object.assign(form, {
        title: gameResp.title,
        developerTitle: gameResp.developerTitle,
        publisherTitle: gameResp.publisherTitle,
        price: gameResp.price,
        description: gameResp.description || '',
        genres: gameResp.genres || [],
        language: gameResp.language || '',
        platform: gameResp.platform || 'PC',
        imageUrl: gameResp.imageUrl,
        count: gameResp.count
      })
      
      // normalize genres into {id, title}
      selectedGenres.value = (gameResp.genres || []).map(g => {
        const key = g.title
        const found = genresList.find(x => x.id === key || x.label === key)
        return { id: found ? found.id : key, title: found ? found.label : key }
      })
      // язык
      selectedLanguages.value = (gameResp.language || '').split(',').map(s=>s.trim()).filter(Boolean)
    }
    
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

const handleCardImageChange = (event) => {
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
  
  cardImageFile.value = file
  
  const reader = new FileReader()
  reader.onload = (e) => {
    previewCardImage.value = e.target.result
  }
  reader.readAsDataURL(file)
}

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
 
// Языки интерфейса
const languageOptions = ['Русский', 'Английский']
const showLanguageMenu = ref(false)
const selectedLanguages = ref([])

const toggleLanguageMenu = () => {
  showLanguageMenu.value = !showLanguageMenu.value
}

const toggleLanguage = (lang) => {
  const idx = selectedLanguages.value.indexOf(lang)
  if (idx === -1) selectedLanguages.value.push(lang)
  else selectedLanguages.value.splice(idx, 1)
  form.language = selectedLanguages.value.join(', ')
}

const initialSelectedIds = computed(() => {
  // возвращаем id для каждого выбранного жанра; поддерживаем объекты {id,title} или старые {title}
  return selectedGenres.value.map(sg => {
    if (!sg) return null
    if (sg.id) return sg.id
    const key = sg.title
    if (!key) return null
    const found = genresList.find(g => g.id === key || g.label === key)
    return found ? found.id : key
  }).filter(Boolean)
})

const onGenresApply = (selectedIds) => {
  // selectedIds — массив id (например ['FPS','RPG'])
  selectedGenres.value = selectedIds.map(id => {
    const found = genresList.find(x => x.id === id)
    return { id, title: found ? found.label : id }
  })
  // store ids in form.genres so backend/filtering uses ids
  form.genres = selectedIds.map(id => ({ title: id }))
  showGenreMenu.value = false
}

const removeSelectedGenre = (index) => {
  selectedGenres.value.splice(index, 1)
  form.genres.splice(index, 1)
}

// Отправка формы
const handleSubmit = async () => {
  if (!validateForm()) return
  
  submitting.value = true
  errorMessage.value = ''
  successMessage.value = ''
  
  try {
    const formData = new FormData()
    
    formData.append('Title', form.title)
    formData.append('DeveloperTitle', form.developerTitle)
    formData.append('PublisherTitle', form.publisherTitle)
    formData.append('Price', form.price.toString())
    formData.append('Description', form.description || '')
    formData.append('Platform', 'PC') // Всегда PC
    // Языки интерфейса — отправляем список как строку
    formData.append('Language', selectedLanguages.value.join(', '))
    
    // Жанры — отправляем id (genre.id) если есть, иначе genre.title
    selectedGenres.value.forEach((genre, index) => {
      const val = genre.id || genre.title
      formData.append(`Genres[${index}].Title`, val)
    })
    
    if (mainImageFile.value) {
      formData.append('Image', mainImageFile.value)
    }
    
    if (cardImageFile.value) {
      formData.append('CardImage', cardImageFile.value)
    }
    // Для локального мок-режима добавляем base64-превью, чтобы сохранить изображение в памяти
    if (previewMainImage.value) {
      formData.append('ImageData', previewMainImage.value)
    }
    if (previewCardImage.value) {
      formData.append('CardImageData', previewCardImage.value)
    }
    
    // Не требуем файл с ключами для тестовой локальной разработки — добавляем только если он есть
    if (!isEditMode.value && keysFile.value) {
      formData.append('Keys', keysFile.value)
    }
    
    const url = isEditMode.value 
      ? `/api/games/${props.gameId}`
      : '/api/games'
    
    const method = isEditMode.value ? 'PUT' : 'POST'
    
    console.log('Отправка формы:', {
      url,
      method,
      title: form.title,
      genres: selectedGenres.value,
      platform: 'PC'
    })
    
    // Для локальной разработки используем тот же код, что и для API: вызываем методы `games.create/update`.
    const savedGame = isEditMode.value
      ? await games.update(props.gameId, formData)
      : await games.create(formData)

    if (!savedGame || savedGame.statusCode) {
      throw new Error(savedGame?.message || 'Ошибка сохранения')
    }

    if (isEditMode.value && additionalKeysFile.value) {
      await addAdditionalKeys(savedGame.id)
    }

    successMessage.value = isEditMode.value
      ? 'Игра успешно обновлена!'
      : 'Игра успешно создана!'

    setTimeout(() => {
      emit('saved', savedGame)
      emit('save', savedGame)
      emit('close')
      emit('cancel')
    }, 2000)
    
  } catch (error) {
    console.error('Ошибка отправки:', error)
    errorMessage.value = error.message
  } finally {
    submitting.value = false
  }
}

// Добавление дополнительных ключей
const addAdditionalKeys = async (gameId) => {
  const keysFormData = new FormData()
  keysFormData.append('Keys', additionalKeysFile.value)

  const resp = await games.addKeys(gameId, keysFormData)
  if (!resp || resp.statusCode) {
    throw new Error(resp?.message || 'Не удалось добавить ключи')
  }
}

// Валидация формы
const validateForm = () => {
  errorMessage.value = ''
  
  if (!form.title || form.title.length < 2) {
    errorMessage.value = 'Название должно быть не менее 2 символов'
    return false
  }
  
  if (!form.developerTitle || form.developerTitle.length < 2) {
    errorMessage.value = 'Название разработчика должно быть не менее 2 символов'
    return false
  }
  
  if (!form.publisherTitle || form.publisherTitle.length < 2) {
    errorMessage.value = 'Название издателя должно быть не менее 2 символов'
    return false
  }
  
  if (form.price < 100) { // Минимальная цена 100 рублей
    errorMessage.value = 'Цена должна быть не менее 100 ₽'
    return false
  }
  
  if (selectedGenres.value.length === 0) {
    errorMessage.value = 'Добавьте хотя бы один жанр'
    return false
  }
  
  if (!isEditMode.value && !mainImageFile.value) {
    errorMessage.value = 'Загрузите основное изображение'
    return false
  }
  
  // при тестовой локальной разработке файл с ключами не обязателен
  
  return true
}

// Отмена - просто закрываем окно
const handleCancel = () => {
  emit('close')
  emit('cancel')
}

// Проверка авторизации при монтировании
const checkAuth = () => {
  if (!authStore.isAuthenticated || authStore.userRole !== 'SELLER') {
    console.warn('Требуется авторизация продавца')
    return false
  }
  return true
}

// Инициализация
onMounted(() => {
  // Временно отключаем проверку для тестирования
  // if (!checkAuth()) return
  
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

/* Убрали close-btn */

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
  background: #E6E6E6; /* Вернули фон */
  z-index: 1;
  pointer-events: none;
}

.photo-placeholder.large {
  background: #E6E6E6; /* Вернули фон для большого изображения */
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

/* Текст платформы */
.platform-text {
  width: 220px;
  flex: 0 0 220px;
  padding: 12px 14px;
  border-radius: 12px;
  background: #E6E6E6;
  font-size: 16px;
  font-family: 'Montserrat Alternates', sans-serif;
  box-sizing: border-box;
  color: #000;
  text-align: center;
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
  background: transparent; /* Сделали прозрачным, т.к. фон в placeholder */
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
  background: transparent; /* Сделали прозрачным, т.к. фон в placeholder */
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
  /* Убираем стрелки в браузерах */
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

/* Убираем placeholder из всех полей */
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
  color: transparent;
}

/* Специальные стили для строки с языками */
.spec-row-language {
  position: relative;
  align-items: flex-start;
}

.language-select-container {
  width: 220px;
  flex: 0 0 220px;
  position: relative;
}

.language-select-btn {
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  background: #A53DFF;
  color: white;
  border: none;
  font-size: 16px;
  font-family: 'Montserrat Alternates', sans-serif;
  cursor: pointer;
  transition: background 0.3s;
  text-align: center;
}

.language-select-btn:hover {
  background: #8B1FD9;
}

.selected-count {
  font-weight: bold;
}

.selected-languages-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
  width: 100%;
}

.selected-language-tag {
  background: #A53DFF;
  color: white;
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: 'Montserrat Alternates', sans-serif;
}

.remove-language {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Montserrat Alternates', sans-serif;
}

.remove-language:hover {
  color: #ffcccc;
}

/* Меню выбора языков */
.language-menu {
  position: absolute;
  top: 100%;
  right: 0;
  left: 0;
  background: #EFEFEF;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1400;
  margin-top: 4px;
  min-width: 180px;
  overflow: hidden;
}

.language-menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #E6E6E6;
  border-bottom: 1px solid #ddd;
}

.language-menu-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  font-family: 'Montserrat Alternates', sans-serif;
}

.language-menu-close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.language-menu-close:hover {
  color: #333;
}

.language-options {
  padding: 8px 0;
  max-height: 160px;
  overflow-y: auto;
}

.language-option {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  transition: background 0.2s;
}

.language-option:hover {
  background: #E6E6E6;
}

.language-checkbox {
  margin: 0;
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.language-label {
  margin-left: 8px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  font-family: 'Montserrat Alternates', sans-serif;
  user-select: none;
}

.language-menu-footer {
  padding: 8px 12px;
  border-top: 1px solid #ddd;
  background: #E6E6E6;
  display: flex;
  justify-content: flex-end;
}

.language-apply-btn {
  padding: 6px 16px;
  background: #A53DFF;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-family: 'Montserrat Alternates', sans-serif;
  cursor: pointer;
  transition: background 0.3s;
}

.language-apply-btn:hover {
  background: #8B1FD9;
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
  .genre-select-btn,
  .platform-text,
  .language-select-container {
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
  
  .language-select-container {
    width: 100%;
    flex: none;
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
  .spec-select,
  .genre-select-btn,
  .platform-text,
  .language-select-container {
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
  
  .language-menu {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90%;
    max-width: 300px;
    z-index: 2000;
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
  .genre-select-btn,
  .platform-text,
  .language-select-btn {
    font-size: 14px;
    padding: 10px;
  }
  
  .selected-language-tag {
    font-size: 12px;
    padding: 3px 8px;
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

/* Скрываем скроллбар в меню языков */
.language-options::-webkit-scrollbar {
  width: 4px;
}

.language-options::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.language-options::-webkit-scrollbar-thumb {
  background: #A53DFF;
}
</style>