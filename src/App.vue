<template>
  <RouterView />
  <GuestMenu v-model:visible="showGuestMenu" />
  <UserMenu v-model:visible="showUserMenu" />
  <SellerMenu v-model:visible="showSellerMenu" />
  <GenresMenu v-model:visible="showGenresMenu" :initialSelected="selectedGenreIds" @apply="handleGenresApply" />
  <ScrollTop />
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import { RouterView } from 'vue-router'
import ScrollTop from './components/ScrollTop.vue'
import GuestMenu from './components/GuestMenu.vue'
import UserMenu from './components/UserMenu.vue'
import SellerMenu from './components/SellerMenu.vue'
import GenresMenu from './components/GenresMenu.vue'

import { showGuestMenu, showUserMenu, showGenresMenu, showSellerMenu, selectedGenreIds } from './stores/ui'

function handleGenresApply(ids) {
  selectedGenreIds.value = ids || []
}

// Обработчик клавиш: Escape закрывает меню, Ctrl+G тумблит гостевое меню
const handleKey = (e) => {
  try {
    if (e.key === 'Escape') {
      showGuestMenu.value = false
      showUserMenu.value = false
      showGenresMenu.value = false
      showSellerMenu.value = false
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'g' || e.key === 'G')) {
      e.preventDefault()
      showGuestMenu.value = !showGuestMenu.value
    }
  } catch (err) {
    console.error('handleKey error', err)
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKey)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKey)
})
</script>

<style>
html, body, #app {
  height: 100%;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Inter', system-ui, Arial, sans-serif;
  background: #F5F5F5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  box-sizing: border-box;
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}

:focus-visible {
  outline: 2px solid #007bff;
  outline-offset: 2px;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}
</style>