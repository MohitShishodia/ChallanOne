// Admin auth context - manages JWT tokens and admin session
import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

const API_BASE = '/api/admin'

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)
  const [accessToken, setAccessToken] = useState(null)

  // Restore session from localStorage
  useEffect(() => {
    const token = localStorage.getItem('adminAccessToken')
    const storedAdmin = localStorage.getItem('adminUser')
    if (token && storedAdmin) {
      try {
        setAccessToken(token)
        setAdmin(JSON.parse(storedAdmin))
      } catch {
        localStorage.removeItem('adminAccessToken')
        localStorage.removeItem('adminUser')
      }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const data = await res.json()

    if (!data.success) {
      throw new Error(data.message || 'Login failed')
    }

    // Store tokens
    localStorage.setItem('adminAccessToken', data.accessToken)
    localStorage.setItem('adminRefreshToken', data.refreshToken)
    localStorage.setItem('adminUser', JSON.stringify(data.admin))

    setAccessToken(data.accessToken)
    setAdmin(data.admin)
    return data
  }, [])

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('adminRefreshToken')
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ refreshToken })
      })
    } catch {}

    localStorage.removeItem('adminAccessToken')
    localStorage.removeItem('adminRefreshToken')
    localStorage.removeItem('adminUser')
    setAccessToken(null)
    setAdmin(null)
  }, [accessToken])

  const refreshToken = useCallback(async () => {
    try {
      const rt = localStorage.getItem('adminRefreshToken')
      if (!rt) return false

      const res = await fetch(`${API_BASE}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rt })
      })
      const data = await res.json()

      if (data.success) {
        localStorage.setItem('adminAccessToken', data.accessToken)
        localStorage.setItem('adminUser', JSON.stringify(data.admin))
        setAccessToken(data.accessToken)
        setAdmin(data.admin)
        return true
      }
      return false
    } catch {
      return false
    }
  }, [])

  // Helper: get auth headers
  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken || localStorage.getItem('adminAccessToken')}`
  }), [accessToken])

  // Permission check helper
  const hasPermission = useCallback((permission) => {
    if (!admin) return false
    if (admin.role === 'Super Admin') return true
    return admin.permissions?.includes(permission) ?? false
  }, [admin])

  const hasAnyPermission = useCallback((...permissions) => {
    if (!admin) return false
    if (admin.role === 'Super Admin') return true
    return permissions.some(p => admin.permissions?.includes(p))
  }, [admin])

  return (
    <AuthContext.Provider value={{
      admin,
      loading,
      accessToken,
      login,
      logout,
      refreshToken,
      authHeaders,
      hasPermission,
      hasAnyPermission,
      isAuthenticated: !!admin
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
