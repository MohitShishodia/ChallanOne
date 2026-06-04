import { useEffect, useState } from 'react'
import { API } from '../config/api'

export function useCmsPage(slug) {
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(!!slug)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!slug) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(API.config.page(slug))
        const data = await res.json()
        if (!cancelled) {
          if (data.success) setPage(data.page)
          else setError(data.message || 'Page not found')
        }
      } catch {
        if (!cancelled) setError('Failed to load content')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [slug])

  return { page, loading, error }
}
