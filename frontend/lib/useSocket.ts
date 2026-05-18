import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './authContext'

let socketInstance: Socket | null = null

export const useSocket = () => {
  const { token } = useAuth()
  const [socket, setSocket] = useState<Socket | null>(socketInstance)
  const [isConnected, setIsConnected] = useState(
    () => socketInstance?.connected ?? false
  )

  useEffect(() => {
    if (!token) return

    // Reuse existing connection if already established
    if (socketInstance?.connected) {
      Promise.resolve().then(() => {
        setSocket(socketInstance)
        setIsConnected(true)
      })
      return
    }

    // Create new connection
    const newSocket = io(
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
      {
        auth: { token },
        transports: ['polling', 'websocket'],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      }
    )

    newSocket.on('connect', () => {
      console.log('⚡ Socket connected')
      setIsConnected(true)
    })

    newSocket.on('disconnect', () => {
      console.log('🔌 Socket disconnected')
      setIsConnected(false)
    })

    newSocket.on('connect_error', (err: Error) => {
      console.error('Socket connection error:', err.message)
      setIsConnected(false)
    })

    socketInstance = newSocket

    Promise.resolve().then(() => {
      setSocket(newSocket)
    })

    return () => {
      // Don't disconnect on unmount — keep alive across navigations
    }
  }, [token])

  return { socket, isConnected }
}