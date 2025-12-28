<template>
  <div v-if="visible" class="genres-overlay" :style="overlayStyle" @click.self="dismiss">
    <div class="genres-menu" :style="menuStyle" role="dialog" aria-label="Жанры">
      <div class="genres-header">
        <button type="button" class="close-btn" @click="dismiss" aria-label="Закрыть">×</button>
        <button type="button" class="apply-btn" @click="applySelection">Применить</button>
      </div>
      <div class="genres-inner" ref="inner">
        <div class="genres-list">
          <div v-for="(g, idx) in genresLeft" :key="g.id" class="genre-item">
            <CheckBox v-model="checked[idx]" />
            <span class="genre-label">{{ g.label }}</span>
          </div>
        </div>
        <div class="genres-list">
          <div v-for="(g, idx) in genresRight" :key="g.id" class="genre-item">
            <CheckBox v-model="checked[genresLeft.length + idx]" />
            <span class="genre-label">{{ g.label }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, watch, ref, nextTick, onMounted, onBeforeUnmount } from 'vue'
import CheckBox from './CheckBox.vue'
import genresList from '../data/genres.js'

const props = defineProps({ visible: { type: Boolean, default: false }, initialSelected: { type: Array, default: () => [] } })
const emits = defineEmits(['update:visible', 'close', 'apply'])

// импортируем единый список жанров (id — для фильтра/сохранения, label — для UI)
const genres = genresList

const half = Math.ceil(genres.length / 2)
const genresLeft = genres.slice(0, half)
const genresRight = genres.slice(half)

const menuStyle = ref({})
const overlayStyle = ref({})
const checked = ref(new Array(genres.length).fill(false))
const inner = ref(null)

function applySelection(){
  // отдаём выбранные жанры (id) при применении
  const selected = genres.filter((g, idx) => checked.value[idx]).map(g => g.id)
  emits('apply', selected)
  emits('update:visible', false)
}

function dismiss(){
  // закрываем без применения
  emits('update:visible', false)
  emits('close')
}

function positionMenu(){
  // желаемая максимальная высота меню; будет ограничена доступным местом в окне
  const desiredMenuHeight = 500
  const viewportPad = 40
  
  // определяем ширину меню в зависимости от размера экрана
  let menuWidth = 900  // шире для двухколонного макета
  if(window.innerWidth <= 761){
    menuWidth = Math.max(430, window.innerWidth - 40)
  } else if(window.innerWidth - viewportPad < menuWidth) {
    menuWidth = Math.max(320, window.innerWidth - viewportPad)
  }
  
  const headerEl = document.querySelector('.site-header')
  const anchor = document.querySelector('.site-header .header-inner')
  const rect = anchor ? anchor.getBoundingClientRect() : { left: 0, width: window.innerWidth }
  const headerRect = headerEl ? headerEl.getBoundingClientRect() : rect
  // если есть модальное окно товара и меню рендерится внутри него — позиционируем относительно модального окна
  const productModal = document.querySelector('.product-edit-modal') || document.querySelector('.modal-window')
  const modalRect = productModal ? productModal.getBoundingClientRect() : null

  // предпочитаем размещение внутри модального окна (absolute), иначе используем fixed поверх страницы
  if (productModal) {
    // отступ сверху внутри модального окна
    const insideTop = 8
    // ограничиваем высоту меню чтобы оно влезало внутрь модального окна
    const availableInside = Math.max((productModal.clientHeight || window.innerHeight) - insideTop - viewportPad, 120)
    const finalMenuHeight = Math.min(desiredMenuHeight, availableInside)

    overlayStyle.value = { position: 'absolute', left: 0, right: 0, top: insideTop + 'px', pointerEvents: 'auto', zIndex: 1300, display: 'flex', justifyContent: 'center' }
    // подогнать ширину под контейнер, но не превышать рассчитанную menuWidth
    const containerWidth = productModal.clientWidth || window.innerWidth
    const finalWidth = Math.min(menuWidth, Math.max(320, containerWidth - 40))
    menuStyle.value = { position: 'relative', width: finalWidth + 'px', height: finalMenuHeight + 'px', top: '0px', zIndex: 1201 }
  } else {
    // fallback — фиксированное позиционирование над страницей
    // place menu directly below header (with small gap) to avoid overlapping header
    const overlayTop = headerRect && headerRect.bottom ? Math.round(headerRect.bottom) + 8 : 8
    const availableBelow = Math.max(window.innerHeight - overlayTop - viewportPad, 120)
    const finalMenuHeight = Math.min(desiredMenuHeight, availableBelow)
    overlayStyle.value = { position: 'fixed', left: 0, right: 0, top: overlayTop + 'px', pointerEvents: 'auto', zIndex: 1300, display: 'flex', justifyContent: 'center' }
    menuStyle.value = { position: 'relative', width: menuWidth + 'px', height: finalMenuHeight + 'px', top: '0px', zIndex: 1201 }
  }
  
  // сбрасываем позицию прокрутки в начало, чтобы первые элементы были видны без скроллинга
  if(inner.value) {
    inner.value.scrollTop = 0
  }
}

watch(()=>props.visible, async (v)=>{
  if(v){
    await nextTick()
    positionMenu()
    window.addEventListener('resize', positionMenu)
  } else {
    window.removeEventListener('resize', positionMenu)
    overlayStyle.value = {}
    menuStyle.value = {}
  }
})

// sync initial selection
// initialSelected expected as array of ids (e.g. ['FPS','RPG'])
watch(()=>props.initialSelected, (arr)=>{
  if(!Array.isArray(arr)) return
  checked.value = genres.map(g => arr.includes(g.id))
}, { immediate: true })

onBeforeUnmount(()=>{
  window.removeEventListener('resize', positionMenu)
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600&display=swap');
.genres-overlay{position:fixed;left:0;right:0;display:block;pointer-events:auto}
.genres-menu{position:relative;top:0;background:#E2E2E2;border-top-left-radius:12px;border-top-right-radius:12px;border-bottom-left-radius:30px;border-bottom-right-radius:30px;box-sizing:border-box;padding:20px 32px 12px 32px;color:#111;overflow:hidden}
.genres-inner{display:flex;flex-direction:row;gap:40px;align-items:flex-start;justify-content:center;overflow-y:auto;max-height:calc(100% - 24px);scroll-behavior:smooth;padding-right:8px;padding-top:0}

.genres-header{display:flex;justify-content:flex-end;align-items:center;gap:8px;padding-bottom:8px}
.close-btn{background:transparent;border:none;font-size:20px;line-height:1;cursor:pointer;padding:6px 10px;color:#333;border-radius:6px;position:relative}
.apply-btn{background:#A53DFF;color:#fff;border:none;border-radius:8px;padding:8px 12px;cursor:pointer;font-family:'Montserrat',sans-serif}
.close-btn:focus,.apply-btn:focus{outline:2px solid rgba(165,61,255,0.18)}
.close-btn:hover{background:rgba(0,0,0,0.04)}

@media (max-width: 761px){
  .genres-inner{flex-direction:column-reverse;gap:24px;align-items:center}
  .genres-list{width:100%}
}

/* тонкий кастомный скроллбар */
.genres-inner::-webkit-scrollbar{width:8px;height:8px}
.genres-inner::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.18);border-radius:8px}
.genres-inner::-webkit-scrollbar-track{background:transparent}
.genres-inner{scrollbar-width:thin;scrollbar-color:rgba(0,0,0,0.18) transparent}

/* тонкие градиентные оверлеи, указывающие на наличие дополнительного контента */
.genres-menu::after{content:"";position:absolute;left:0;right:0;height:8px;pointer-events:none;bottom:0;background:linear-gradient(to top,#E2E2E2,rgba(226,226,226,0))}

/* Адаптивный макет: одна колонка на узких экранах */

@media (max-width: 430px){
  .genres-menu{padding:8px 12px}
  .genres-inner{gap:12px;max-height:calc(100% - 16px)}
  .genre-label{font-size:16px}
  .checkbox{width:36px;height:36px}
  .checkbox img{width:18px;height:18px}
}
.genres-list{display:flex;flex-direction:column;gap:18px;width:50%;min-width:0}
.genre-item{display:flex;align-items:center;gap:18px;min-width:0;min-height:56px}
.genre-label{font-family:'Montserrat',sans-serif;font-size:20px;line-height:1;color:#111;flex:1;min-width:0;white-space:normal;word-break:break-word;overflow-wrap:break-word}
</style>
