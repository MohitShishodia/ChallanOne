// Centralized API URL builder for admin panel
// In dev: uses Vite proxy (relative URLs work fine)
// In production: prefixes with VITE_API_URL env var
const BASE = import.meta.env.VITE_API_URL || ''

export const apiUrl = (path) => `${BASE}${path}`
