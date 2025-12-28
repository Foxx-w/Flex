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
            <img :src="game.imageUrl" :alt="game.title" class="game-image" />
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
import { useAppStore } from '../stores/app.js' // или useAuthStore

const appStore = useAppStore() // или const authStore = useAuthStore()

const showAddModal = ref(false)
const editingGameId = ref(null)
const loading = ref(false)

// Игры продавца
const sellerGames = ref([])

// Загружаем игры при монтировании
onMounted(async () => {
  await loadSellerGames()
})

async function loadSellerGames() {
  loading.value = true
  try {
    const result = await appStore.loadSellerGames() // метод из app.js
    if (result.success) {
      sellerGames.value = appStore.sellerGames || []
    } else {
      console.error('Ошибка загрузки игр:', result.error)
    }
  } catch (error) {
    console.error('Ошибка:', error)
  } finally {
    loading.value = false
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

async function deleteGame(gameId) {
  if (!confirm('Удалить эту игру?')) return
  
  try {
    const result = await appStore.deleteGame(gameId)
    if (result.success) {
      // Удаляем из локального списка
      sellerGames.value = sellerGames.value.filter(g => g.id !== gameId)
    } else {
      alert('Ошибка удаления: ' + result.error)
    }
  } catch (error) {
    console.error('Ошибка удаления:', error)
    alert('Ошибка удаления')
  }
}
</script>

<style scoped>
/* Существующие стили + новые */

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
  font-family: 'Montserrat Alternates', sans-serif;
}

.no-games {
  text-align: center;
  padding: 40px;
  color: #999;
  font-family: 'Montserrat Alternates', sans-serif;
}

.products-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
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
}

.game-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.game-image {
  width: 100%;
  height: 160px;
  object-fit: cover;
}

.game-info {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.game-title {
  font-family: 'Montserrat Alternates', sans-serif;
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #111;
  line-height: 1.3;
}

.game-price {
  font-family: 'Montserrat Alternates', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: #52C41A;
  margin: 0 0 8px 0;
}

.game-keys {
  font-family: 'Montserrat', sans-serif;
  font-size: 14px;
  color: #666;
  margin: 0 0 16px 0;
}

.game-actions {
  display: flex;
  gap: 8px;
  margin-top: auto;
}

.btn-edit, .btn-delete {
  flex: 1;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-family: 'Montserrat', sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-edit {
  background: #0962C9;
  color: white;
}

.btn-edit:hover {
  background: #0850A6;
}

.btn-delete {
  background: #FFF2E8;
  color: #FA541C;
  border: 1px solid #FFBB96;
}

.btn-delete:hover {
  background: #FFE7D9;
}

@media (max-width: 768px) {
  .products-container {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
  }
  
  .game-image {
    height: 140px;
  }
  
  .game-title {
    font-size: 16px;
  }
  
  .game-price {
    font-size: 20px;
  }
}
</style>