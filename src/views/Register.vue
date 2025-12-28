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
              placeholder="Логин *" 
              v-model="username" 
              :disabled="isLoading"
            />
            <div v-if="errors.username" class="field-error">{{ errors.username }}</div>
          </label>
          
          <label class="reg-field">
            <input 
              placeholder="Почта *" 
              type="email"
              v-model="email" 
              :disabled="isLoading"
            />
            <div v-if="errors.email" class="field-error">{{ errors.email }}</div>
          </label>
          
          <label class="reg-field">
            <input 
              placeholder="Пароль *" 
              type="password" 
              v-model="password" 
              :disabled="isLoading"
            />
            <div v-if="errors.password" class="field-error">{{ errors.password }}</div>
          </label>
          
          <label class="reg-field">
            <input 
              placeholder="Повторите пароль *" 
              type="password" 
              v-model="confirmPassword" 
              :disabled="isLoading"
            />
            <div v-if="errors.confirmPassword" class="field-error">{{ errors.confirmPassword }}</div>
          </label>

          <label class="reg-field">
            <select v-model="userRole" :disabled="isLoading" required>
              <option value="" disabled>Выберите роль *</option>
              <option value="CUSTOMER">Покупатель</option>
              <option value="SELLER">Продавец</option>
            </select>
            <div v-if="errors.userRole" class="field-error">{{ errors.userRole }}</div>
          </label>

          <button 
            class="reg-submit"
            @click="handleRegister"
            :disabled="isLoading || !isFormValid"
          >
            {{ isLoading ? 'Регистрация...' : 'Создать аккаунт' }}
          </button>

          <div v-if="errorMessage" class="reg-error">
            {{ errorMessage }}
          </div>

          <div class="reg-footer">
            Уже имеете аккаунт? 
            <router-link to="/login" class="reg-link">Войти</router-link>
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
const confirmPassword = ref('')
const userRole = ref('')
const errorMessage = ref('')

const router = useRouter()
const authStore = useAuthStore()

const errors = reactive({
  email: '',
  username: '',
  password: '',
  confirmPassword: '',
  userRole: ''
})

// Валидация формы
const isFormValid = computed(() => {
  return email.value.trim() && 
         username.value.trim() && 
         password.value.trim() && 
         confirmPassword.value.trim() && 
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
  
  if (!confirmPassword.value.trim()) {
    errors.confirmPassword = 'Подтвердите пароль'
    isValid = false
  } else if (password.value !== confirmPassword.value) {
    errors.confirmPassword = 'Пароли не совпадают'
    isValid = false
  }
  
  if (!userRole.value) {
    errors.userRole = 'Выберите роль'
    isValid = false
  }
  
  return isValid
}

const handleRegister = async () => {
  if (!validateForm() || isLoading.value) return
  
  isLoading.value = true
  errorMessage.value = ''
  
  try {
    // Создаем объект для регистрации
    const userRequest = {
      Email: email.value.trim(),
      Username: username.value.trim(),
      Password: password.value,
      UserRole: userRole.value // CUSTOMER или SELLER
    }
    
    console.log('Отправляем запрос на регистрацию:', userRequest)
    
    const success = await authStore.register(userRequest)
    
    if (success) {
      console.log('Регистрация успешна')
      // После успешной регистрации перенаправляем на логин
      router.push('/login')
    } else {
      errorMessage.value = 'Ошибка при регистрации'
    }
  } catch (error) {
    console.error('Register error:', error)
    errorMessage.value = error.response?.data?.message || 'Ошибка при регистрации. Попробуйте снова.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Montserrat+Alternates:wght@400;600&display=swap');

.register-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #F5F5F5;
}

.register-canvas {
  width: 100%;
  display: flex;
  justify-content: center;
  background: #F5F5F5;
  flex: 1;
  padding: 150px 70px;
  box-sizing: border-box;
  transition: all 0.3s ease;
}

.register-layout {
  display: flex;
  align-items: center;
  gap: 160px;
  width: 100%;
  max-width: 1480px;
  margin: 0 auto;
  transition: all 0.3s ease;
}

.register-image {
  width: 900px;
  height: 510px;
  background-image: url('/src/assets/photos/registration.png');
  background-size: cover;
  background-position: center;
  border-radius: 30px;
  flex: 0 0 900px;
  transition: all 0.3s ease;
}

.register-form {
  width: 420px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.reg-title {
  font-family: 'Montserrat Alternates', sans-serif;
  font-size: 36px;
  margin: 0 0 6px;
  line-height: 1.2;
  transition: font-size 0.3s ease;
}

.reg-sub {
  margin: 0;
  color: #333;
  font-size: 16px;
  line-height: 1.4;
  transition: font-size 0.3s ease;
}

.reg-field {
  display: block;
}

.reg-field input,
.reg-field select {
  width: 100%;
  border: 0;
  border-bottom: 1px solid #cfcfcf;
  padding: 12px 6px;
  font-size: 16px;
  background: transparent;
  outline: none;
  transition: all 0.3s ease;
  font-family: inherit;
}

.reg-field input:focus,
.reg-field select:focus {
  border-bottom-color: #222;
}

.reg-field input:disabled,
.reg-field select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.field-error {
  color: #ff4444;
  font-size: 12px;
  margin-top: 4px;
  min-height: 16px;
  transition: all 0.3s ease;
}

.reg-submit {
  margin-top: 8px;
  background: #222;
  color: #fff;
  border: 0;
  border-radius: 30px;
  padding: 12px 18px;
  font-size: 16px;
  cursor: pointer;
  font-family: 'Montserrat Alternates', sans-serif;
  min-width: 180px;
  transition: all 0.3s ease;
}

.reg-submit:active:not(:disabled) {
  background: #111;
}

.reg-submit:disabled {
  background: #666;
  cursor: not-allowed;
  opacity: 0.7;
}

.reg-error {
  margin-top: 16px;
  padding: 12px;
  background-color: #fff5f5;
  border: 1px solid #ffcccc;
  border-radius: 8px;
  color: #ff4444;
  font-size: 14px;
  text-align: center;
  transition: all 0.3s ease;
}

.reg-footer {
  margin-top: 12px;
  color: #666;
  font-size: 15px;
  text-align: center;
  transition: all 0.3s ease;
}

.reg-link {
  color: #222;
  text-decoration: none;
  margin-left: 6px;
  font-weight: 600;
  transition: color 0.2s ease;
}

.reg-link:hover {
  color: #A53DFF;
}

/* Плавная адаптация для больших экранов */
@media (max-width: 1600px) {
  .register-canvas {
    padding: 120px 50px;
  }
  
  .register-layout {
    gap: 120px;
    max-width: 1340px;
  }
  
  .register-image {
    width: 800px;
    height: 450px;
    flex: 0 0 800px;
  }
}

@media (max-width: 1400px) {
  .register-canvas {
    padding: 100px 40px;
  }
  
  .register-layout {
    gap: 80px;
    max-width: 1200px;
  }
  
  .register-image {
    width: 700px;
    height: 400px;
    flex: 0 0 700px;
  }
  
  .register-form {
    width: 380px;
  }
}

@media (max-width: 1200px) {
  .register-canvas {
    padding: 80px 30px;
  }
  
  .register-layout {
    gap: 60px;
    max-width: 1000px;
  }
  
  .register-image {
    width: 600px;
    height: 340px;
    flex: 0 0 600px;
  }
  
  .register-form {
    width: 340px;
  }
  
  .reg-title {
    font-size: 32px;
  }
}

@media (max-width: 1100px) {
  .register-canvas {
    padding: 60px 25px;
  }
  
  .register-layout {
    gap: 40px;
    max-width: 900px;
  }
  
  .register-image {
    width: 500px;
    height: 284px;
    flex: 0 0 500px;
  }
  
  .register-form {
    width: 320px;
  }
  
  .reg-title {
    font-size: 30px;
  }
  
  .reg-sub {
    font-size: 15px;
  }
}

/* Планшеты - скрываем изображение, центрируем форму */
@media (max-width: 1024px) {
  .register-canvas {
    padding: 50px 20px;
  }
  
  .register-layout {
    justify-content: center;
  }
  
  .register-image {
    display: none;
  }
  
  .register-form {
    width: 100%;
    max-width: 500px;
    padding: 40px;
    background: #FDFDFD;
    border-radius: 25px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }
  
  .reg-title {
    text-align: center;
    font-size: 30px;
  }
  
  .reg-sub {
    text-align: center;
  }
  
  .reg-submit {
    align-self: center;
    min-width: 200px;
  }
  
  .reg-footer {
    text-align: center;
  }
  
  .field-error {
    text-align: left;
  }
}

@media (max-width: 900px) {
  .register-canvas {
    padding: 40px 20px;
  }
  
  .register-form {
    padding: 35px 30px;
  }
  
  .reg-title {
    font-size: 28px;
  }
  
  .reg-sub {
    font-size: 15px;
  }
  
  .reg-field input,
  .reg-field select {
    padding: 10px 6px;
    font-size: 15px;
  }
  
  .reg-submit {
    padding: 10px 16px;
    font-size: 15px;
  }
  
  .reg-footer {
    font-size: 14px;
  }
  
  .field-error {
    font-size: 11px;
  }
  
  .reg-error {
    font-size: 13px;
    padding: 10px;
  }
}

/* Мобильные устройства среднего размера */
@media (max-width: 600px) {
  .register-canvas {
    padding: 30px 15px;
  }
  
  .register-form {
    padding: 30px 25px;
    border-radius: 20px;
  }
  
  .reg-title {
    font-size: 26px;
  }
  
  .reg-sub {
    font-size: 14px;
  }
  
  .reg-field input,
  .reg-field select {
    padding: 9px 6px;
    font-size: 14px;
  }
  
  .reg-submit {
    padding: 9px 14px;
    font-size: 14px;
    min-width: 100%;
  }
  
  .reg-footer {
    font-size: 13px;
  }
  
  .field-error {
    font-size: 10px;
  }
  
  .reg-error {
    font-size: 12px;
  }
}

/* Маленькие мобильные устройства */
@media (max-width: 480px) {
  .register-canvas {
    padding: 25px 12px;
  }
  
  .register-form {
    padding: 25px 20px;
    border-radius: 18px;
    gap: 15px;
  }
  
  .reg-title {
    font-size: 24px;
  }
  
  .reg-sub {
    font-size: 13px;
  }
  
  .reg-field input,
  .reg-field select {
    padding: 8px 6px;
    font-size: 13px;
  }
  
  .reg-submit {
    padding: 8px 12px;
    font-size: 13px;
  }
  
  .reg-footer {
    font-size: 12px;
  }
  
  .field-error {
    font-size: 9px;
  }
  
  .reg-error {
    font-size: 11px;
    padding: 8px;
  }
}

@media (max-width: 360px) {
  .register-canvas {
    padding: 20px 10px;
  }
  
  .register-form {
    padding: 20px 18px;
    border-radius: 16px;
    gap: 12px;
  }
  
  .reg-title {
    font-size: 22px;
  }
  
  .reg-sub {
    font-size: 12px;
  }
  
  .reg-field input,
  .reg-field select {
    padding: 7px 5px;
    font-size: 12px;
  }
  
  .reg-submit {
    padding: 7px 10px;
    font-size: 12px;
  }
  
  .reg-footer {
    font-size: 11px;
  }
  
  .field-error {
    font-size: 8px;
  }
  
  .reg-error {
    font-size: 10px;
    padding: 6px;
  }
}

/* Очень маленькие экраны */
@media (max-width: 320px) {
  .register-canvas {
    padding: 18px 8px;
  }
  
  .register-form {
    padding: 18px 16px;
    border-radius: 14px;
  }
  
  .reg-title {
    font-size: 20px;
  }
  
  .reg-sub {
    font-size: 11px;
  }
  
  .reg-field input,
  .reg-field select {
    padding: 6px 4px;
    font-size: 11px;
  }
  
  .reg-submit {
    padding: 6px 8px;
    font-size: 11px;
  }
  
  .reg-footer {
    font-size: 10px;
  }
  
  .field-error {
    font-size: 7px;
  }
  
  .reg-error {
    font-size: 9px;
    padding: 5px;
  }
}
</style>