const CACHE_KEY = 'challanone_check_challan_state'
const TTL_MS = 30 * 60 * 1000 // 30 minutes

const defaultFilters = {
  activeTab: 'all',
  selectedState: 'all',
  searchQuery: '',
  courtFilter: 'all',
  dateFilter: 'all',
  sortBy: 'newest',
  page: 1,
}

export function getDefaultFilters() {
  return { ...defaultFilters }
}

export function loadChallanSearchState() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.fetchedAt) return null
    if (Date.now() - parsed.fetchedAt > TTL_MS) {
      sessionStorage.removeItem(CACHE_KEY)
      return null
    }
    return {
      ...parsed,
      filters: { ...defaultFilters, ...(parsed.filters || {}) },
      selectedChallans: Array.isArray(parsed.selectedChallans) ? parsed.selectedChallans : [],
    }
  } catch {
    return null
  }
}

export function saveChallanSearchState(state) {
  try {
    if (!state?.data) {
      sessionStorage.removeItem(CACHE_KEY)
      return
    }
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        data: state.data,
        vehicleNumber: state.vehicleNumber || '',
        flowType: state.flowType,
        selectedChallans: state.selectedChallans || [],
        filters: { ...defaultFilters, ...(state.filters || {}) },
        fetchedAt: state.fetchedAt || Date.now(),
      })
    )
  } catch {
    // Ignore quota / private mode errors
  }
}

export function clearChallanSearchState() {
  try {
    sessionStorage.removeItem(CACHE_KEY)
  } catch {
    // no-op
  }
}

export function isChallanSearchCacheExpired(fetchedAt) {
  if (!fetchedAt) return true
  return Date.now() - fetchedAt > TTL_MS
}
