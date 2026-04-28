// Custom fetch hook with auth token injection and error handling
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'

export function useFetch(url, options = {}) {
  const { authHeaders, logout } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    if (!url) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(url, {
        ...options,
        headers: { ...authHeaders(), ...options.headers }
      })

      if (res.status === 401) {
        logout()
        return
      }

      const json = await res.json()
      if (!json.success) {
        setError(json.message || 'Request failed')
      } else {
        setData(json)
      }
    } catch (err) {
      setError(err.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }, [url])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

// Imperative fetch for mutations (POST, PUT, DELETE, PATCH)
export function useApi() {
  const { authHeaders, logout } = useAuth()
  const [loading, setLoading] = useState(false)

  const request = useCallback(async (url, { method = 'GET', body, ...opts } = {}) => {
    setLoading(true)
    try {
      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: body ? JSON.stringify(body) : undefined,
        ...opts
      })

      if (res.status === 401) {
        logout()
        throw new Error('Unauthorized')
      }

      const json = await res.json()
      return json
    } catch (err) {
      throw err
    } finally {
      setLoading(false)
    }
  }, [authHeaders, logout])

  return { request, loading }
}
