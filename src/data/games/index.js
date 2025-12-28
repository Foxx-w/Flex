import products from './products.json'
import genresList from '../genres.js'

// Попытаемся загрузить сохранённые mock-данные из localStorage (для разработки)
const STORAGE_KEY = 'mock_products_v1'

let games = []
try {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length) {
      games = parsed.map(g => ({ ...g }))
    }
  }
} catch (e) {
  console.warn('Не удалось прочитать mock_products из localStorage:', e)
}

// Если в localStorage ничего нет — берём из products.json
if (!games || games.length === 0) {
  games = products.map(g => ({ ...g }))
}

// Уникальные id
const ids = new Set()
// Normalize loaded entries and dedupe
games = games.map(normalizeGameEntry)

games = games.filter(g => {
  if (!g || g.id == null) return false
  if (ids.has(g.id)) return false
  ids.add(g.id)
  return true
})

let nextId = games.length ? Math.max(...games.map(g => g.id)) + 1 : 1

function clone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

function normalizeGameEntry(g) {
  if (!g) return g
  const copy = clone(g)

  // normalize genres into array of { title: ID }
  const rawGenres = copy.genres || copy.tags || copy.categories || []
  const normalized = []
  for (const item of rawGenres) {
    if (!item) continue
    if (typeof item === 'string') {
      // try to map label -> id
      const found = genresList.find(x => x.id === item || x.label === item)
      normalized.push({ title: found ? found.id : item })
      continue
    }
    if (item.title) {
      const found = genresList.find(x => x.id === item.title || x.label === item.title)
      normalized.push({ title: found ? found.id : item.title })
      continue
    }
    if (item.id) {
      normalized.push({ title: item.id })
      continue
    }
  }
  // dedupe preserving order
  const seen = new Set()
  copy.genres = normalized.filter(x => {
    if (!x || !x.title) return false
    if (seen.has(x.title)) return false
    seen.add(x.title)
    return true
  })

  // normalize language to string (comma-separated if array)
  if (Array.isArray(copy.language)) copy.language = copy.language.join(', ')
  if (copy.Language && !copy.language) copy.language = copy.Language
  if (!copy.language) copy.language = copy.lang || copy.Language || ''

  // ensure createdAt
  if (!copy.createdAt) copy.createdAt = new Date().toISOString()

  return copy
}

export function getAll(minPrice, maxPrice, gameTitle, genres, page = 1, pageSize = 20) {
  let list = games.slice()
  if (minPrice != null) list = list.filter(g => g.price >= Number(minPrice))
  if (maxPrice != null) list = list.filter(g => g.price <= Number(maxPrice))
  if (gameTitle) list = list.filter(g => g.title.toLowerCase().includes(String(gameTitle).toLowerCase()))
  if (genres && genres.length) list = list.filter(g => genres.every(gn => g.genres.some(gg => gg.title === gn)))

  const totalElements = list.length
  const totalPages = Math.max(1, Math.ceil(totalElements / pageSize))
  const start = (page - 1) * pageSize
  const content = list.slice(start, start + pageSize).map(clone)

  return Promise.resolve({ content, pageNumber: page, pageSize, totalElements, totalPages })
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(games))
  } catch (e) {
    console.warn('Не удалось сохранить mock_products в localStorage:', e)
  }
}

export function getById(id) {
  const g = games.find(x => String(x.id) === String(id))
  if (!g) return Promise.resolve({ statusCode: 404, message: 'Not found' })
  return Promise.resolve(clone(g))
}

export function create(formData) {
  const payload = normalizeFormData(formData)
  const normalized = normalizeGameEntry(payload)
  const newGame = { id: nextId++, createdAt: new Date().toISOString(), ...normalized }
  games.push(newGame)
  persist()
  return Promise.resolve(clone(newGame))
}

export function update(id, formData) {
  const payload = normalizeFormData(formData)
  const payloadNorm = normalizeGameEntry(payload)
  const idx = games.findIndex(x => String(x.id) === String(id))
  if (idx === -1) return Promise.resolve({ statusCode: 404, message: 'Not found' })
  games[idx] = { ...games[idx], ...payloadNorm }
  persist()
  return Promise.resolve(clone(games[idx]))
}

export function remove(id) {
  const idx = games.findIndex(x => String(x.id) === String(id))
  if (idx === -1) return Promise.resolve({ statusCode: 404, message: 'Not found' })
  games.splice(idx, 1)
  persist()
  return Promise.resolve({})
}

export function addKeys(id, formData) {
  // Примитивная реализация: увеличиваем count на количество ключей в json (если передан)
  const idx = games.findIndex(x => String(x.id) === String(id))
  if (idx === -1) return Promise.resolve({ statusCode: 404, message: 'Not found' })

  // Попробуем прочитать поле Keys (FormData или объект)
  let added = 0
  if (formData instanceof FormData) {
    const file = formData.get('Keys')
    if (file && typeof file === 'object' && 'name' in file) {
      // Не читаем содержимое файла; прибавим фиксированное количество
      added = 10
    }
  } else if (Array.isArray(formData)) {
    added = formData.length
  }

  games[idx].count = (games[idx].count || 0) + added
  persist()
  return Promise.resolve(clone(games[idx]))
}

function normalizeFormData(fd) {
  if (!fd) return {}
  if (fd instanceof FormData) {
    const obj = {}
    for (const pair of fd.entries()) {
      const [k, v] = pair
      // Приведём ключи: Title -> title, Price -> price
      const key = k.replace(/^(.).*$/, (m) => m)
      if (k === 'Price') obj.price = Number(v)
      else if (k === 'Title') { obj.title = v; obj.name = v }
      else if (k === 'DeveloperTitle') obj.developerTitle = v
      else if (k === 'PublisherTitle') obj.publisherTitle = v
      else if (k === 'Description') obj.description = v
      else if (k === 'Language' || k === 'language' || k === 'Lang' || k === 'lang') obj.language = v
      else if (k === 'ImageData') {
        // base64 preview string
        obj.image = v
        obj.imageUrl = v
      } else if (k === 'CardImageData') {
        obj.cardImage = v
      }
      else if (k.startsWith('Genres[')) {
        // Genres[0].Title => add to genres
        obj.genres = obj.genres || []
        const match = k.match(/Genres\[(\d+)\]\.Title/)
        if (match) obj.genres[Number(match[1])] = { title: v }
      }
    }
    if (obj.genres) obj.genres = obj.genres.filter(Boolean)
    return obj
  }
  // если пришёл объект
  return fd
}
