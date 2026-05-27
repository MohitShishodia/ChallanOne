import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

let sharedSocket = null

export function useSocket() {
  const [socket, setSocket] = useState(sharedSocket)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    if (!sharedSocket) {
      sharedSocket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 10,
        reconnectionDelay: 2000
      })
      sharedSocket.on('connect', () => {
        sharedSocket.emit('join-admin')
      })
    }

    setSocket(sharedSocket)
  }, [])

  return socket
}
