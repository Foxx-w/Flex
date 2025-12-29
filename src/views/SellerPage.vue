<template>
  <div class="app-root">
    <SiteHeader />

    <main class="seller-canvas" role="main" aria-label="Страница продавца">
      <div class="products-section">
        <div class="products-header">
          <h2 class="products-title">Мои игры</h2>
          <span class="products-count">{{ sellerGames.length }} шт.</span>
          <button class="add-product-btn" @click="openAddModal" aria-label="Добавить игру">
            Добавить игру
          </button>
        </div>

        <!-- Загрузка -->
        <div v-if="loading" class="loading">Загрузка игр...</div>
        
        <!-- Список игр -->
        <div v-else class="products-container">
          <!-- Если игр нет -->
          <div v-if="sellerGames.length === 0" class="no-games">
            <p>У вас пока нет игр. Добавьте первую!</p>
          </div>
          
          <!-- Список игр -->
          <div v-for="game in sellerGames" :key="game.id" class="game-card">
            <img :src="game.imageUrl || '/placeholder-image.png'" :alt="game.title" class="game-image" />
            <div class="game-info">
              <h3 class="game-title">{{ game.title }}</h3>
              <p class="game-price">{{ game.price }} ₽</p>
              <p class="game-keys">Ключей: {{ game.count || 0 }}</p>
              <div class="game-actions">
                <button @click="openEditModal(game.id)" class="btn-edit">Редактировать</button>
                <button @click="deleteGame(game.id)" class="btn-delete">Удалить</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <Footer />

    <!-- Модальное окно для добавления/редактирования -->
    <ProductEditModal
      :gameId="editingGameId"
      v-model:visible="showAddModal"
      @saved="onModalSave"
      @close="closeAddModal"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import SiteHeader from '../components/Header.vue'
import Footer from '../components/Footer.vue'
import ProductEditModal from '../components/SellerProductEdit.vue'

const API_URL = 'http://localhost:8080/api'

const showAddModal = ref(false)
const editingGameId = ref(null)
const loading = ref(false)
const sellerGames = ref([])

// Загружаем игры продавца
const loadSellerGames = async () => {
  loading.value = true
  
  try {
    // Проверяем авторизацию
    const userRole = localStorage.getItem('userRole')
    const authToken = localStorage.getItem('auth_token')
    
    if (!userRole || userRole !== 'SELLER') {
      alert('Доступно только для продавцов')
      window.location.href = '/login'
      return
    }
    
    if (!authToken) {
      alert('Требуется авторизация')
      window.location.href = '/login'
      return
    }
    
    // GET /api/games/my?page=...&pageSize=... – получить страницу игр текущего продавца
    const response = await fetch(`${API_URL}/games/my?Page=1&PageSize=100`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      credentials: 'include'
    })
    
    if (!response.ok) {
      try {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP ${response.status}`)
      } catch {
        throw new Error(`HTTP ${response.status}`)
      }
    }
    
    const data = await response.json()
    
    // Обрабатываем ответ в формате Page<GameResponse>
    if (data && Array.isArray(data.content)) {
      sellerGames.value = data.content
    } else if (Array.isArray(data)) {
      sellerGames.value = data
    } else if (data && data.items) {
      sellerGames.value = data.items
    } else {
      sellerGames.value = []
      console.warn('Неожиданный формат ответа:', data)
    }
    
    console.log('Загружено игр продавца:', sellerGames.value.length)
    
  } catch (error) {
    console.error('Ошибка загрузки игр продавца:', error)
    alert(error.message || 'Ошибка загрузки игр')
    sellerGames.value = []
  } finally {
    loading.value = false
  }
}

// Удаление игры
const deleteGame = async (gameId) => {
  if (!confirm('Удалить эту игру?')) return
  
  try {
    const authToken = localStorage.getItem('auth_token')
    
    if (!authToken) {
      alert('Требуется авторизация')
      return
    }
    
    // DELETE /api/games/{id} – удалить игру по id (Продавец)
    const response = await fetch(`${API_URL}/games/${gameId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      credentials: 'include'
    })
    
    if (!response.ok) {
      try {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP ${response.status}`)
      } catch {
        throw new Error(`HTTP ${response.status}`)
      }
    }
    
    // Удаляем игру из локального списка
    sellerGames.value = sellerGames.value.filter(game => game.id !== gameId)
    
    alert('Игра успешно удалена')
    
  } catch (error) {
    console.error('Ошибка удаления игры:', error)
    alert(error.message || 'Ошибка удаления игры')
  }
}

function openAddModal() {
  editingGameId.value = null
  showAddModal.value = true
}

function openEditModal(gameId) {
  editingGameId.value = gameId
  showAddModal.value = true
}

function closeAddModal() {
  showAddModal.value = false
  editingGameId.value = null
}

async function onModalSave(savedGame) {
  console.log('Игра сохранена:', savedGame)
  // Перезагружаем список
  await loadSellerGames()
  closeAddModal()
}

// Загружаем игры при монтировании
onMounted(async () => {
  await loadSellerGames()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Montserrat+Alternates:wght@400;600&display=swap');

.seller-canvas {
  max-width: 1920px;
  width: 100%;
  min-height: calc(100vh - 164px);
  background: #F5F5F5;
  padding: 40px 64px;
  box-sizing: border-box;
}

.products-section {
  background: #FFFFFF;
  border-radius: 30px;
  padding: 32px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.products-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 16px;
}

.products-title {
  font-family: 'Montserrat Alternates', sans-serif;
  font-size: 32px;
  margin: 0;
  color: #111;
}

.products-count {
  font-family: 'Montserrat Alternates', sans-serif;
  font-size: 18px;
  color: #666;
  background: #F5F5F5;
  padding: 6px 16px;
  border-radius: 20px;
}

.add-product-btn {
  background: #222222;
  color: #fff;
  border: 0;
  border-radius: 30px;
  padding: 12px 24px;
  font-size: 16px;
  cursor: pointer;
  font-family: 'Montserrat Alternates', sans-serif;
  transition: all 0.3s ease;
}

.add-product-btn:hover {
  background: #A53DFF;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(165, 61, 255, 0.3);
}

.add-product-btn:active {
  transform: translateY(0);
}

.loading {
  text-align: center;
  padding: 60px;
  color: #666;
  font-family: 'Montserrat Alternates', sans-serif;
  font-size: 18px;
}

.no-games {
  text-align: center;
  padding: 60px;
  color: #999;
  font-family: 'Montserrat Alternates', sans-serif;
  font-size: 16px;
  background: #FAFAFA;
  border-radius: 20px;
  margin: 20px 0;
}

.products-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 28px;
  padding-top: 20px;
}

.game-card {
  background: #FFFFFF;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
  border: 1px solid #EFEFEF;
}

.game-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.game-image {
  width: 100%;
  height: 180px;
  object-fit: cover;
  background: #F5F5F5;
}

.game-info {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.game-title {
  font-family: 'Montserrat Alternates', sans-serif;
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #111;
  line-height: 1.3;
  min-height: 52px;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.game-price {
  font-family: 'Montserrat Alternates', sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: #52C41A;
  margin: 0 0 8px 0;
}

.game-keys {
  font-family: 'Montserrat', sans-serif;
  font-size: 14px;
  color: #666;
  margin: 0 0 20px 0;
  padding: 4px 8px;
  background: #F6FFED;
  border-radius: 4px;
  display: inline-block;
  align-self: flex-start;
}

.game-actions {
  display: flex;
  gap: 12px;
  margin-top: auto;
}

.btn-edit, .btn-delete {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-family: 'Montserrat', sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.btn-edit {
  background: #0962C9;
  color: white;
}

.btn-edit:hover {
  background: #0850A6;
  transform: translateY(-1px);
}

.btn-delete {
  background: #FFF2E8;
  color: #FA541C;
  border: 1px solid #FFBB96;
}

.btn-delete:hover {
  background: #FFE7D9;
  transform: translateY(-1px);
}

/* Адаптивность */
@media (max-width: 1400px) {
  .seller-canvas {
    padding: 40px 50px;
  }
  
  .products-container {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 24px;
  }
}

@media (max-width: 1200px) {
  .seller-canvas {
    padding: 40px 30px;
  }
  
  .products-section {
    padding: 28px;
  }
  
  .products-title {
    font-size: 28px;
  }
  
  .products-container {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
  }
}

@media (max-width: 900px) {
  .seller-canvas {
    padding: 30px 20px;
  }
  
  .products-section {
    padding: 24px;
    border-radius: 24px;
  }
  
  .products-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .products-title {
    font-size: 26px;
    text-align: center;
  }
  
  .products-count {
    align-self: center;
  }
  
  .add-product-btn {
    width: 100%;
  }
  
  .products-container {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 16px;
  }
  
  .game-image {
    height: 160px;
  }
  
  .game-title {
    font-size: 18px;
    min-height: 46px;
  }
  
  .game-price {
    font-size: 22px;
  }
  
  .game-actions {
    flex-direction: column;
  }
}

@media (max-width: 600px) {
  .seller-canvas {
    padding: 20px 15px;
    min-height: calc(100vh - 140px);
  }
  
  .products-section {
    padding: 20px;
    border-radius: 20px;
  }
  
  .products-title {
    font-size: 24px;
  }
  
  .products-container {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .game-card {
    max-width: 400px;
    margin: 0 auto;
  }
  
  .game-image {
    height: 180px;
  }
  
  .btn-edit, .btn-delete {
    padding: 12px 16px;
    font-size: 15px;
  }
  
  .loading, .no-games {
    padding: 40px 20px;
    font-size: 16px;
  }
}

@media (max-width: 400px) {
  .seller-canvas {
    padding: 15px 10px;
  }
  
  .products-section {
    padding: 16px;
    border-radius: 16px;
  }
  
  .products-title {
    font-size: 22px;
  }
  
  .game-title {
    font-size: 17px;
  }
  
  .game-price {
    font-size: 20px;
  }
}
</style>