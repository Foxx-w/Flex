<template>
	<AppRouter />
	<GuestMenu v-model:visible="showGuestMenu" />
	<UserMenu v-model:visible="showUserMenu" />
	<SellerMenu v-model:visible="showSellerMenu" />
	<!-- Global GenresMenu: updates shared selectedGenreIds when applied -->
	<GenresMenu v-model:visible="showGenresMenu" :initialSelected="selectedGenreIds" @apply="handleGenresApply" />
	<ScrollTop />
</template>

<script setup>
import { onMounted, onBeforeUnmount, watch } from 'vue'
import AppRouter from './AppRouter.vue'
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
		}
		if ((e.ctrlKey || e.metaKey) && (e.key === 'g' || e.key === 'G')) {
			showGuestMenu.value = !showGuestMenu.value
		}
	} catch (err) {
		console.error('handleKey error', err)
	}
}

onMounted(()=> window.addEventListener('keydown', handleKey))
onBeforeUnmount(()=> window.removeEventListener('keydown', handleKey))

watch(showGuestMenu, ()=>{})
watch(showUserMenu, ()=>{})
watch(showGenresMenu, ()=>{})
watch(showSellerMenu, ()=>{})
</script>



