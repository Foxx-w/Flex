<template>
  <div class="register-root">
    <SiteHeader />

    <main class="register-canvas" role="main" aria-label="Регистрация">
      <div class="register-layout">
        <div class="register-image" aria-hidden="true"></div>

        <div class="register-form">
          <h1 class="reg-title">Создание аккаунта</h1>
          <p class="reg-sub">Введите детали аккаунта</p>

          <label class="reg-field">
            <input 
              placeholder="Имя пользователя *" 
              v-model="username" 
              :disabled="isLoading"
              @blur="validateUsername"
            />
            <div v-if="errors.username" class="field-error">{{ errors.username }}</div>
          </label>
          
          <label class="reg-field">
            <input 
              placeholder="Email *" 
              type="email" 
              v-model="email" 
              :disabled="isLoading"
              @blur="validateEmail"
            />
            <div v-if="errors.email" class="field-error">{{ errors.email }}</div>
          </label>
          
          <label class="reg-field">
            <input 
              placeholder="Пароль *" 
              type="password" 
              v-model="password" 
              :disabled="isLoading"
              @blur="validatePassword"
            />
            <div v-if="errors.password" class="field-error">{{ errors.password }}</div>
          </label>
          
          <label class="reg-field">
            <input 
              placeholder="Повторите пароль *" 
              type="password" 
              v-model="passwordConfirm" 
              :disabled="isLoading"
              @blur="validatePasswordConfirm"
            />
            <div v-if="errors.passwordConfirm" class="field-error">{{ errors.passwordConfirm }}</div>
          </label>

          <label class="reg-field">
            <select v-model="role" :disabled="isLoading">
              <option value="CUSTOMER">Покупатель</option>
              <option value="SELLER">Продавец</option>
            </select>
            <div v-if="errors.role" class="field-error">{{ errors.role }}</div>
          </label>

          <!-- Общее сообщение об ошибке -->
          <div v-if="errorMessage" class="register-error">
            {{ errorMessage }}
          </div>

          <button 
            class="reg-submit" 
            :disabled="isLoading || !isFormValid" 
            @click="handleRegister"
          >
            {{ isLoading ? 'Создание...' : 'Создать аккаунт' }}
          </button>

          <div class="reg-footer">
            Уже имеете аккаунт? 
            <router-link to="/login">Войти</router-link>
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
import SiteHeader from '../components/Header.vue'
import Footer from '../components/Footer.vue'
import { useAuthStore } from '../stores/auth' // Используем хранилище вместо прямого вызова API

const email = ref('')
const username = ref('')
const password = ref('')
const passwordConfirm = ref('')
const role = ref('CUSTOMER')
const isLoading = ref(false)
const errorMessage = ref('')

const errors = reactive({
  email: '',
  username: '',
  password: '',
  passwordConfirm: '',
  role: ''
})

const router = useRouter()
const authStore = useAuthStore()

// Валидация формы
const isFormValid = computed(() => {
  return email.value.trim() && 
         username.value.trim() && 
         password.value.trim() && 
         passwordConfirm.value.trim() && 
         role.value &&
         !errors.email && 
         !errors.username && 
         !errors.password && 
         !errors.passwordConfirm
})

// Валидация отдельных полей
const validateEmail = () => {
  if (!email.value.trim()) {
    errors.email = 'Email обязателен'
  } else if (!email.value.includes('@')) {
    errors.email = 'Введите корректный email'
  } else {
    errors.email = ''
  }
}

const validateUsername = () => {
  if (!username.value.trim()) {
    errors.username = 'Имя пользователя обязательно'
  } else if (username.value.length < 2) {
    errors.username = 'Имя пользователя должно быть не менее 2 символов'
  } else if (username.value.length > 100) {
    errors.username = 'Имя пользователя должно быть не более 100 символов'
  } else {
    errors.username = ''
  }
}

const validatePassword = () => {
  if (!password.value.trim()) {
    errors.password = 'Пароль обязателен'
  } else if (password.value.length < 6) {
    errors.password = 'Пароль должен быть не менее 6 символов'
  } else {
    errors.password = ''
  }
  // При изменении пароля также валидируем подтверждение
  if (passwordConfirm.value) {
    validatePasswordConfirm()
  }
}

const validatePasswordConfirm = () => {
  if (!passwordConfirm.value.trim()) {
    errors.passwordConfirm = 'Подтверждение пароля обязательно'
  } else if (password.value !== passwordConfirm.value) {
    errors.passwordConfirm = 'Пароли не совпадают'
  } else {
    errors.passwordConfirm = ''
  }
}

const validateAll = () => {
  validateEmail()
  validateUsername()
  validatePassword()
  validatePasswordConfirm()
  return isFormValid.value
}

const handleRegister = async () => {
  errorMessage.value = ''
  
  if (!validateAll()) {
    errorMessage.value = 'Исправьте ошибки в форме'
    return
  }

  isLoading.value = true
  
  try {
    const payload = {
      Email: email.value.trim(),
      Username: username.value.trim(),
      Password: password.value,
      UserRole: role.value
    }
    
    // Используем метод register из хранилища
    const success = await authStore.register(payload)
    
    if (success) {
      // После успешной регистрации пользователь автоматически логинится
      // (это реализовано в authStore.register)
      
      // Перенаправляем в зависимости от роли
      if (authStore.userRole === 'SELLER') {
        router.push('/sellerpage')
      } else {
        router.push('/')
      }
    } else {
      errorMessage.value = authStore.error || 'Ошибка регистрации. Проверьте введенные данные.'
    }
  } catch (e) {
    console.error('Register error:', e)
    errorMessage.value = e.message || 'Ошибка сети'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
/* Добавляем стили для ошибок */
.field-error {
  color: #ff4444;
  font-size: 12px;
  margin-top: 4px;
  min-height: 16px;
}

.register-error {
  margin-top: 8px;
  padding: 12px;
  background-color: #fff5f5;
  border: 1px solid #ffcccc;
  border-radius: 8px;
  color: #ff4444;
  font-size: 14px;
  text-align: center;
}

/* Улучшаем стиль select */
.reg-field select {
  width: 100%;
  border: 0;
  border-bottom: 1px solid #cfcfcf;
  padding: 12px 6px;
  font-size: 16px;
  background: transparent;
  outline: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  cursor: pointer;
  color: #222;
}

.reg-field select:focus {
  border-bottom-color: #222;
}

.reg-field select option {
  color: #000;
}

/* Делаем кнопку неактивной при загрузке или невалидной форме */
.reg-submit:disabled {
  background: #666;
  cursor: not-allowed;
  opacity: 0.7;
}

.reg-submit:not(:disabled):hover {
  background: #111;
}

/* Адаптивные стили для ошибок */
@media (max-width: 600px) {
  .field-error {
    font-size: 11px;
  }
  
  .register-error {
    font-size: 13px;
    padding: 10px;
  }
}

@media (max-width: 400px) {
  .field-error {
    font-size: 10px;
  }
  
  .register-error {
    font-size: 12px;
    padding: 8px;
  }
}
</style>