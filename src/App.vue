<template>
	<AppRouter />
	<GuestMenu v-model:visible="showGuestMenu" />
	<UserMenu v-model:visible="showUserMenu" />
	<GenresMenu v-model:visible="showGenresMenu" />
	<ScrollTop />
</template>

<script setup>
import { onMounted, onBeforeUnmount, watch } from 'vue'
import AppRouter from './AppRouter.vue'
import ScrollTop from './components/ScrollTop.vue'
import GuestMenu from './components/GuestMenu.vue'
import UserMenu from './components/UserMenu.vue'
import GenresMenu from './components/GenresMenu.vue'

import { showGuestMenu, showUserMenu, showGenresMenu } from './stores/ui'

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
</script>



