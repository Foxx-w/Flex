<template>
  <div class="login-root">
    <SiteHeader />

    <main class="login-canvas" role="main" aria-label="Вход">
      <div class="login-layout">
        <div class="login-image" aria-hidden="true"></div>

        <div class="login-form">
          <h1 class="login-title">Вход в аккаунт</h1>
          <p class="login-sub">Введите детали входа</p>

          <!-- Разделили Email и Username согласно API -->
          <label class="login-field">
            <input 
              placeholder="Email *" 
              type="email"
              v-model="email" 
              :disabled="isLoading"
            />
            <div v-if="errors.email" class="field-error">{{ errors.email }}</div>
          </label>
          
          <label class="login-field">
            <input 
              placeholder="Имя пользователя *" 
              v-model="username" 
              :disabled="isLoading"
            />
            <div v-if="errors.username" class="field-error">{{ errors.username }}</div>
          </label>
          
          <label class="login-field">
            <input 
              placeholder="Пароль *" 
              type="password" 
              v-model="password" 
              :disabled="isLoading"
            />
            <div v-if="errors.password" class="field-error">{{ errors.password }}</div>
          </label>

          <!-- Роль теперь обязательна! -->
          <label class="login-field">
            <select v-model="userRole" :disabled="isLoading" required>
              <option value="" disabled>Выберите роль *</option>
              <option value="CUSTOMER">Покупатель</option>
              <option value="SELLER">Продавец</option>
            </select>
            <div v-if="errors.userRole" class="field-error">{{ errors.userRole }}</div>
          </label>

          <div class="login-actions">
            <button 
              class="login-submit" 
              @click="handleLogin"
              :disabled="isLoading || !isFormValid"
            >
              {{ isLoading ? 'Вход...' : 'Войти' }}
            </button>
            <div class="login-links">
              <router-link to="/register" class="login-forgot">
                Нет аккаунта? Зарегистрироваться
              </router-link>
            </div>
          </div>

          <!-- Общее сообщение об ошибке -->
          <div v-if="errorMessage" class="login-error">
            {{ errorMessage }}
          </div>

        </div>
      </div>
    </main>

    <Footer />
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import SiteHeader from '../components/Header.vue'
import Footer from '../components/Footer.vue'

const isLoading = ref(false)
const email = ref('')
const username = ref('')
const password = ref('')
const userRole = ref('')
const errorMessage = ref('')

const router = useRouter()
const authStore = useAuthStore()

const errors = reactive({
  email: '',
  username: '',
  password: '',
  userRole: ''
})

// Валидация формы
const isFormValid = computed(() => {
  return email.value.trim() && 
         username.value.trim() && 
         password.value.trim() && 
         userRole.value
})

const validateForm = () => {
  let isValid = true
  
  // Очищаем предыдущие ошибки
  Object.keys(errors).forEach(key => errors[key] = '')
  
  if (!email.value.trim()) {
    errors.email = 'Email обязателен'
    isValid = false
  } else if (!email.value.includes('@')) {
    errors.email = 'Введите корректный email'
    isValid = false
  }
  
  if (!username.value.trim()) {
    errors.username = 'Имя пользователя обязательно'
    isValid = false
  } else if (username.value.length < 2 || username.value.length > 100) {
    errors.username = 'Имя пользователя должно быть от 2 до 100 символов'
    isValid = false
  }
  
  if (!password.value.trim()) {
    errors.password = 'Пароль обязателен'
    isValid = false
  } else if (password.value.length < 6) {
    errors.password = 'Пароль должен быть не менее 6 символов'
    isValid = false
  }
  
  if (!userRole.value) {
    errors.userRole = 'Выберите роль'
    isValid = false
  }
  
  return isValid
}

const handleLogin = async () => {
  if (!validateForm() || isLoading.value) return
  
  isLoading.value = true
  errorMessage.value = ''
  
  try {
    // Создаем объект ТОЧНО как в документации UserRequest
    const userRequest = {
      Email: email.value.trim(),
      Username: username.value.trim(),
      Password: password.value,
      UserRole: userRole.value // CUSTOMER или SELLER
    }
    
    console.log('Отправляем запрос:', userRequest)
    
    const success = await authStore.login(userRequest)
    
    if (success) {
      console.log('Логин успешен, роль:', authStore.userRole)
      // После успешного логина перенаправляем по роли
      if (authStore.userRole === 'SELLER') {
        router.push('/sellerpage')
      } else {
        router.push('/')
      }
    } else {
      errorMessage.value = 'Неверные учетные данные'
    }
  } catch (error) {
    console.error('Login error:', error)
    errorMessage.value = error.response?.data?.message || 'Ошибка при входе. Попробуйте снова.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
/* Добавьте эти стили к существующим */

.field-error {
  color: #ff4444;
  font-size: 12px;
  margin-top: 4px;
  min-height: 16px;
}

.login-error {
  margin-top: 16px;
  padding: 12px;
  background-color: #fff5f5;
  border: 1px solid #ffcccc;
  border-radius: 8px;
  color: #ff4444;
  font-size: 14px;
  text-align: center;
}

.login-links {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
  width: 100%;
}

.login-forgot {
  color: #666;
  text-decoration: none;
  transition: color 0.2s ease;
  font-size: 14px;
  text-align: center;
}

.login-forgot:hover {
  color: #222;
  text-decoration: underline;
}

/* Обновим адаптивные стили */
@media (max-width: 600px) {
  .login-links {
    flex-direction: column;
    align-items: center;
  }
  
  .field-error {
    font-size: 11px;
  }
  
  .login-error {
    font-size: 13px;
    padding: 10px;
  }
}

@media (max-width: 400px) {
  .field-error {
    font-size: 10px;
  }
  
  .login-error {
    font-size: 12px;
  }
}
</style>