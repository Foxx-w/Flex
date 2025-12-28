import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia } from 'pinia'
import App from './App.vue'

// Импорты компонентов
import Home from './views/Home.vue'
import Register from './views/Register.vue'
import Login from './views/Login.vue'
import Cart from './views/Cart.vue'
import PurchaseHistory from './views/BuyHistory.vue'
import SellerPage from './views/SellerPage.vue'
import NotFound from './views/NotFound.vue'
import GameDetails from './components/GameDetails.vue' 

// Создаем Pinia
const pinia = createPinia()

const routes = [
  { path: '/', component: Home, name: 'Home' },
  { path: '/register', component: Register, name: 'Register' },
  { path: '/login', component: Login, name: 'Login' },
  { 
    path: '/cart', 
    component: Cart, 
    name: 'Cart', 
    meta: { requiresAuth: true, requiresCustomer: true }
  },
  { 
    path: '/history', 
    component: PurchaseHistory, 
    name: 'BuyHistory', 
    meta: { requiresAuth: true, requiresCustomer: true } 
  },
  { 
    path: '/sellerpage', 
    component: SellerPage, 
    name: 'SellerPage', 
    meta: { requiresAuth: true, requiresSeller: true } 
  },
  { path: '/seller', redirect: '/sellerpage' },
  
  // Страница деталей игры
  {
    path: '/game/:id',
    name: 'GameDetails',
    component: GameDetails,
    props: true
  },
  
  // Продавцовские страницы
  {
    path: '/seller/games/new',
    name: 'GameCreate',
    component: () => import('./components/SellerProductEdit.vue'), 
    meta: { requiresAuth: true, requiresSeller: true }
  },
  {
    path: '/seller/games/edit/:id',
    name: 'GameEdit',
    component: () => import('./components/SellerProductEdit.vue'),
    props: true,
    meta: { requiresAuth: true, requiresSeller: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Настройка хука авторизации
router.beforeEach((to, from, next) => {
  // Проверяем авторизацию через localStorage
  const userRole = localStorage.getItem('userRole')
  const isAuthenticated = !!userRole
  
  if (to.meta.requiresAuth && !isAuthenticated) {
    console.log('Требуется авторизация, перенаправляем на /login')
    next('/login')
    return
  }
  
  if (to.meta.requiresSeller && userRole !== 'SELLER') {
    console.log('Требуется роль SELLER, перенаправляем на /')
    next('/')
    return
  }
  
  if (to.meta.requiresCustomer && userRole !== 'CUSTOMER') {
    console.log('Требуется роль CUSTOMER, перенаправляем на /')
    next('/')
    return
  }
  
  next()
})

// Создаем приложение
const app = createApp(App)

// Устанавливаем Pinia
app.use(pinia)

// Инициализируем хранилища
import { initializeStores } from './stores'
initializeStores()

// Устанавливаем роутер
app.use(router)

// Глобальная обработка ошибок
app.config.errorHandler = (err, instance, info) => {
  console.error('Глобальная ошибка Vue:', err)
  console.error('Компонент:', instance?.$options.name || 'Unknown')
  console.error('Информация:', info)
}

// Монтируем приложение
app.mount('#app')

console.log('App initialized')