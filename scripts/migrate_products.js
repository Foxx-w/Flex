const fs = require('fs')
const path = require('path')

const genresModule = require('../src/data/genres.js')
const genres = genresModule && genresModule.default ? genresModule.default : genresModule

function normalize(entry) {
  if (!entry) return entry
  const copy = JSON.parse(JSON.stringify(entry))
  const rawGenres = copy.genres || copy.tags || copy.categories || []
  const normalized = []
  for (const item of rawGenres) {
    if (!item) continue
    if (typeof item === 'string') {
      const found = genres.find(x => x.id === item || x.label === item)
      normalized.push({ title: found ? found.id : item })
      continue
    }
    if (item.title) {
      const found = genres.find(x => x.id === item.title || x.label === item.title)
      normalized.push({ title: found ? found.id : item.title })
      continue
    }
    if (item.id) {
      normalized.push({ title: item.id })
      continue
    }
  }
  const seen = new Set()
  copy.genres = normalized.filter(x => {
    if (!x || !x.title) return false
    if (seen.has(x.title)) return false
    seen.add(x.title)
    return true
  })
  if (Array.isArray(copy.language)) copy.language = copy.language.join(', ')
  if (!copy.createdAt) copy.createdAt = new Date().toISOString()
  return copy
}

const filePath = path.join(__dirname, '..', 'src', 'data', 'games', 'products.json')
const backupPath = path.join(__dirname, '..', 'src', 'data', 'games', 'products.json.bak')

try {
  const raw = fs.readFileSync(filePath, 'utf8')
  const data = JSON.parse(raw)
  const migrated = data.map(normalize)
  // write backup
  fs.writeFileSync(backupPath, raw, 'utf8')
  fs.writeFileSync(filePath, JSON.stringify(migrated, null, 2), 'utf8')
  console.log('Migration complete. Backup saved to', backupPath)
} catch (e) {
  console.error('Migration failed:', e)
  process.exit(1)
}
