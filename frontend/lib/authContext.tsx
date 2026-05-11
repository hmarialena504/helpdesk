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

// The shape of a user object
interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'AGENT' | 'CUSTOMER'
  createdAt: string
  updatedAt: string
}

// The shape of what the context provides to components
interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, name: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

// The provider wraps the entire app and manages auth state
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // On first load check if a token already exists in cookies
  // If it does, fetch the current user to restore the session
  useEffect(() => {
    const savedToken = Cookies.get('token')
    if (savedToken) {
      setToken(savedToken)
      api.get('/api/auth/me')
        .then((res) => setUser(res.data.data))
        .catch(() => {
          // Token is invalid or expired — clear everything
          Cookies.remove('token')
          setToken(null)
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const res = await api.post('/api/auth/login', { email, password })
    const { user, token } = res.data.data

    // Store token in a cookie — persists across page refreshes
    // expires: 7 matches the JWT expiry set in the backend
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

// Custom hook — components call useAuth() instead of useContext(AuthContext)
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}