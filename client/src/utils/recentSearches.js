const STORAGE_KEY = 'challanone_recent_searches'
const MAX_ITEMS = 20

function readList() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function writeList(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_ITEMS)))
}

/**
 * @param {string} vehicleNumber
 * @param {'challan' | 'rc'} type
 */
export function addRecentSearch(vehicleNumber, type = 'challan') {
  const number = String(vehicleNumber || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
  if (!number || number.length < 4) return getRecentSearches()

  const next = [
    { vehicleNumber: number, type, searchedAt: Date.now() },
    ...readList().filter((item) => item.vehicleNumber !== number),
  ]
  writeList(next)
  return next
}

/**
 * @param {{ type?: 'challan' | 'rc', limit?: number }} [opts]
 */
export function getRecentSearches(opts = {}) {
  const { type, limit = MAX_ITEMS } = opts
  let list = readList()
  if (type) list = list.filter((item) => item.type === type)
  return list.slice(0, limit)
}

export function clearRecentSearches() {
  localStorage.removeItem(STORAGE_KEY)
}

export function formatRecentSearchTime(timestamp) {
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return ''

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfThatDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const dayDiff = Math.round((startOfToday - startOfThatDay) / 86400000)

  const time = date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })

  if (dayDiff === 0) return `Today, ${time}`
  if (dayDiff === 1) return `Yesterday, ${time}`

  const day = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
  return `${day}, ${time}`
}
