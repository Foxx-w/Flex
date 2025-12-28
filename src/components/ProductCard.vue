<template>
  <div class="product-card" @click="openDetails" role="button" tabindex="0" @keydown.enter="openDetails">
    <div class="product-image-wrapper">
      <img :src="product.imageUrl || product.image" :alt="product.name || product.title" class="product-image" />
    </div>
    
    <div class="product-info">
      <h3 class="product-name">{{ product.name || product.title }}</h3>
      <div class="product-price">{{ formatPrice(product.price) }} ₽</div>
    </div>

    <button 
      class="add-to-cart-btn" 
      aria-label="Добавить в корзину"
      @click.stop="addToCart"
      :class="{ 'adding': isAdding, 'added': isAdded || isInCart }"
      :disabled="isAdding || isInCart || !isAvailable || !canAddToCart"
    >
      <span class="btn-text">{{ buttonText }}</span>
      <span class="btn-icon">✓</span>
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useCartStore } from '../stores/cart'

const props = defineProps({
  product: {
    type: Object,
    required: true,
    default: () => ({
      id: null,
      name: '',
      title: '',
      price: 0,
      image: '',
      imageUrl: '',
      count: 0,
      description: ''
    })
  }
})

const emit = defineEmits(['add-to-cart', 'open-details'])

const router = useRouter()
const authStore = useAuthStore()
const cartStore = useCartStore()

const isAdding = ref(false)
const isAdded = ref(false)

// Проверяем, доступен ли товар
const isAvailable = computed(() => {
  return props.product.count !== undefined && props.product.count !== null 
    ? props.product.count > 0 
    : true // Если count не указан, считаем что доступен
})

// Проверяем, может ли пользователь добавлять в корзину
const canAddToCart = computed(() => {
  return authStore.isAuthenticated && authStore.userRole === 'CUSTOMER'
})

// Проверяем, есть ли товар в корзине
const isInCart = computed(() => {
  if (!authStore.isAuthenticated || authStore.userRole !== 'CUSTOMER') {
    return false
  }
  return cartStore.isInCart(props.product.id)
})

// Получаем количество товара в корзине
const quantityInCart = computed(() => {
  if (!authStore.isAuthenticated || authStore.userRole !== 'CUSTOMER') {
    return 0
  }
  return cartStore.getItemQuantity(props.product.id)
})

// Форматирование цены
const formatPrice = (price) => {
  if (!price && price !== 0) return '0'
  const numPrice = typeof price === 'string' ? parseInt(price.replace(/\D/g, '')) || 0 : price
  return new Intl.NumberFormat('ru-RU').format(numPrice)
}

// Текст кнопки
const buttonText = computed(() => {
  if (!authStore.isAuthenticated) return 'Войдите, чтобы купить'
  if (authStore.userRole !== 'CUSTOMER') return 'Только для покупателей'
  if (isAdding.value) return 'Добавляется...'
  if (isInCart.value) {
    const qty = quantityInCart.value
    return qty > 0 ? `В корзине (${qty})` : 'В корзине'
  }
  if (!isAvailable.value) return 'Нет в наличии'
  return 'В корзину'
})

// Добавление в корзину
const addToCart = async () => {
  // Если не авторизован - перенаправляем на логин
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }

  // Если не покупатель - показываем сообщение
  if (authStore.userRole !== 'CUSTOMER') {
    alert('Корзина доступна только покупателям')
    return
  }

  // Если товар недоступен
  if (!isAvailable.value) {
    alert('Товар временно недоступен')
    return
  }

  // Если уже добавляется или уже в корзине
  if (isAdding.value || isInCart.value) {
    return
  }

  isAdding.value = true

  try {
    // Используем хранилище корзины для добавления товара
    const success = await cartStore.addToCart(props.product.id, 1)
    
    if (success) {
      isAdded.value = true
      
      // Отправляем событие родителю
      emit('add-to-cart', props.product)
      
      // Показываем успех 2 секунды, затем сбрасываем анимацию
      setTimeout(() => {
        isAdded.value = false
      }, 2000)
    } else {
      alert('Не удалось добавить товар в корзину')
    }
  } catch (error) {
    console.error('Ошибка добавления в корзину:', error)
    alert('Ошибка при добавлении в корзину')
  } finally {
    isAdding.value = false
  }
}

// Открытие деталей товара
const openDetails = () => {
  emit('open-details', props.product.id)
}

// Следим за изменениями в корзине
watch(
  () => cartStore.items,
  () => {
    // При изменении корзины обновляем состояние
    if (isInCart.value && isAdded.value) {
      isAdded.value = false
    }
  },
  { deep: true }
)
</script>

<style scoped>
.product-card {
  width: 240px;
  height: 400px;
  background: #E2E2E2;
  border: 8px solid #CFCFCF;
  border-radius: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
  padding: 20px 12px 12px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

.product-image-wrapper {
  width: 180px;
  height: 245px;
  background: #F5F5F5;
  border-radius: 20px;
  overflow: hidden;
  margin-bottom: 12px;
  transition: all 0.3s ease;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.5s ease;
}

.product-card:hover .product-image {
  transform: scale(1.05);
}

.product-info {
  width: 100%;
  text-align: center;
  margin-bottom: 12px;
  transition: all 0.3s ease;
}

.product-name {
  font-size: 20px;
  margin: 0 0 6px;
  color: #A53DFF;
  font-weight: 600;
  font-family: 'Montserrat Alternates', sans-serif;
  line-height: 1.2;
  overflow-wrap: break-word;
  hyphens: auto;
  transition: font-size 0.3s ease;
}

.product-price {
  font-size: 20px;
  color: #A53DFF;
  font-weight: 600;
  font-family: 'Montserrat Alternates', sans-serif;
  transition: font-size 0.3s ease;
}

.add-to-cart-btn {
  width: 204px;
  height: 40px;
  background: #222222;
  color: #FFFFFF;
  border: none;
  border-radius: 30px;
  font-size: 18px;
  font-family: 'Montserrat Alternates', sans-serif;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  text-align: center;
  justify-content: center;
  gap: 8px;
  padding: 0 20px;
}

.add-to-cart-btn:hover:not(:disabled) {
  background: #111111;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
  transform: translateY(-2px);
}

.add-to-cart-btn:active:not(:disabled) {
  transform: scale(0.98);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.add-to-cart-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  background: #666;
}

.add-to-cart-btn.adding {
  background: #444;
  animation: pulse 1.5s ease-in-out infinite;
}

.add-to-cart-btn.added {
  background: #4CAF50;
  animation: successPop 0.5s ease;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}

@keyframes successPop {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.add-to-cart-btn::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
  background-image: radial-gradient(circle, #fff 10%, transparent 10.01%);
  background-repeat: no-repeat;
  background-position: 50%;
  transform: scale(10, 10);
  opacity: 0;
  transition: transform 0.5s, opacity 1s;
}

.add-to-cart-btn:active:not(:disabled)::after {
  transform: scale(0, 0);
  opacity: 0.3;
  transition: 0s;
}

.btn-icon {
  opacity: 0;
  transform: scale(0);
  transition: all 0.3s ease;
  font-size: 20px;
  line-height: 1;
}

.add-to-cart-btn.added .btn-icon {
  opacity: 1;
  transform: scale(1);
  animation: iconPop 0.4s ease;
}

@keyframes iconPop {
  0% { transform: scale(0); opacity: 0; }
  70% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}

/* Адаптивные стили остаются без изменений */

@media (max-width: 1600px) {
  .product-card {
    width: 230px;
    height: 390px;
  }
  
  .product-image-wrapper {
    width: 170px;
    height: 235px;
  }
  
  .add-to-cart-btn {
    width: 190px;
  }
}

@media (max-width: 1400px) {
  .product-card {
    width: 220px;
    height: 380px;
    border-width: 7px;
  }
  
  .product-image-wrapper {
    width: 165px;
    height: 225px;
  }
  
  .product-name,
  .product-price {
    font-size: 19px;
  }
  
  .add-to-cart-btn {
    width: 180px;
    height: 38px;
    font-size: 17px;
  }
}

@media (max-width: 1200px) {
  .product-card {
    width: 210px;
    height: 370px;
    border-width: 6px;
    border-radius: 28px;
    padding: 18px 10px 10px;
  }
  
  .product-image-wrapper {
    width: 160px;
    height: 215px;
    border-radius: 18px;
  }
  
  .product-name,
  .product-price {
    font-size: 18px;
  }
  
  .add-to-cart-btn {
    width: 170px;
    height: 36px;
    font-size: 16px;
  }
}

@media (max-width: 1024px) {
  .product-card {
    width: 200px;
    height: 360px;
  }
  
  .product-image-wrapper {
    width: 155px;
    height: 205px;
  }
  
  .product-name,
  .product-price {
    font-size: 17px;
  }
  
  .add-to-cart-btn {
    width: 160px;
    height: 34px;
    font-size: 15px;
  }
}

@media (max-width: 900px) {
  .product-card {
    width: 190px;
    height: 340px;
    border-width: 5px;
    border-radius: 26px;
  }
  
  .product-image-wrapper {
    width: 145px;
    height: 190px;
    border-radius: 16px;
  }
  
  .product-name,
  .product-price {
    font-size: 16px;
  }
  
  .add-to-cart-btn {
    width: 150px;
    height: 32px;
    font-size: 14px;
  }
}

@media (max-width: 768px) {
  .product-card {
    width: 180px;
    height: 320px;
    padding: 15px 8px 8px;
  }
  
  .product-image-wrapper {
    width: 140px;
    height: 180px;
    margin-bottom: 10px;
  }
  
  .product-info {
    margin-bottom: 10px;
  }
  
  .product-name,
  .product-price {
    font-size: 15px;
  }
  
  .add-to-cart-btn {
    width: 140px;
    height: 30px;
    font-size: 13px;
    gap: 6px;
    padding: 0 16px;
  }
  
  .btn-icon {
    font-size: 16px;
  }
}

@media (max-width: 600px) {
  .product-card {
    width: 170px;
    height: 310px;
    border-radius: 24px;
  }
  
  .product-image-wrapper {
    width: 130px;
    height: 170px;
    border-radius: 14px;
  }
  
  .product-name,
  .product-price {
    font-size: 14px;
  }
  
  .add-to-cart-btn {
    width: 130px;
    height: 28px;
    font-size: 12px;
  }
  
  .btn-icon {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .product-card {
    width: 160px;
    height: 300px;
    border-width: 4px;
    border-radius: 22px;
  }
  
  .product-image-wrapper {
    width: 120px;
    height: 160px;
    border-radius: 12px;
  }
  
  .product-name {
    font-size: 13px;
    margin-bottom: 4px;
  }
  
  .product-price {
    font-size: 13px;
  }
  
  .add-to-cart-btn {
    width: 120px;
    height: 26px;
    font-size: 11px;
    gap: 4px;
    padding: 0 12px;
  }
}

@media (max-width: 360px) {
  .product-card {
    width: 150px;
    height: 290px;
    border-radius: 20px;
  }
  
  .product-image-wrapper {
    width: 110px;
    height: 150px;
  }
  
  .product-name,
  .product-price {
    font-size: 12px;
  }
  
  .add-to-cart-btn {
    width: 110px;
    height: 24px;
    font-size: 10px;
  }
}
</style>