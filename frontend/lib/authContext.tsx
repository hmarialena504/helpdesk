'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'
import Cookies from 'js-cookie'
import api from './api'

interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'AGENT' | 'CUSTOMER'
  createdAt: string
  updatedAt: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, name: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialise token directly from cookie — no setState needed in effect
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(
    () => Cookies.get('token') ?? null
  )
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!token) {
        // No token — nothing to do, just mark loading as done
        // Use a microtask to avoid the synchronous setState warning
        Promise.resolve().then(() => setIsLoading(false))
        return
    }

    let cancelled = false

    api.get('/api/auth/me')
        .then((res) => {
        if (!cancelled) setUser(res.data.data)
        })
        .catch(() => {
        if (!cancelled) {
            Cookies.remove('token')
            setToken(null)
        }
        })
        .finally(() => {
        if (!cancelled) setIsLoading(false)
        })

    return () => {
        cancelled = true
    }
  }, [token])

  const login = async (email: string, password: string) => {
    const res = await api.post('/api/auth/login', { email, password })
    const { user, token } = res.data.data
    Cookies.set('token', token, { expires: 7, sameSite: 'strict' })
    setToken(token)
    setUser(user)
  }

  const register = async (email: string, name: string, password: string) => {
    const res = await api.post('/api/auth/register', { email, name, password })
    const { user, token } = res.data.data
    Cookies.set('token', token, { expires: 7, sameSite: 'strict' })
    setToken(token)
    setUser(user)
  }

  const logout = () => {
    Cookies.remove('token')
    setToken(null)
    setUser(null)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}