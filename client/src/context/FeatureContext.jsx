import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { API, API_BASE_URL } from '../config/api'

const FeatureContext = createContext({
  features: {},
  settings: {},
  loading: true,
  isFeatureEnabled: () => true,
  refetch: () => {}
})

export function FeatureProvider({ children }) {
  const [features, setFeatures] = useState({})
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const socketRef = useRef(null)

  const fetchConfig = async () => {
    try {
      const [featRes, settRes] = await Promise.all([
        fetch(API.config.features).then(r => r.json()).catch(() => ({ success: false })),
        fetch(API.config.settings).then(r => r.json()).catch(() => ({ success: false }))
      ])

      if (featRes.success) setFeatures(featRes.features || {})
      if (settRes.success) setSettings(settRes.config || {})
    } catch {
      // Fallback: all features enabled
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchConfig() }, [])

  useEffect(() => {
    const socket = io(API_BASE_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 3000
    })
    socketRef.current = socket

    socket.on('service-status-changed', () => {
      fetchConfig()
    })

    socket.on('settings-updated', () => {
      fetchConfig()
    })

    return () => { socket.disconnect() }
  }, [])

  const isFeatureEnabled = (featureKey) => {
    if (loading) return true
    return features[featureKey] !== false
  }

  return (
    <FeatureContext.Provider value={{ features, settings, loading, isFeatureEnabled, refetch: fetchConfig }}>
      {children}
    </FeatureContext.Provider>
  )
}

export function useFeatures() {
  return useContext(FeatureContext)
}
