'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { api } from '@/lib/api/client'

interface User {
  id: string
  email: string
  name: string
  avatar?: string
  phone?: string
  department?: string
  position?: string
  role: string
  status: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  updateUser: (data: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      const response = await api.get<{ id: string; email: string; name: string; role: string; department?: string; position?: string; phone?: string; avatar?: string; status: string }>('/users/me')
      if (response.success && response.data) {
        setUser(response.data as User)
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const response = await api.post<{ user: User; token: string }>('/auth/login', { email, password })
    if (response.success && response.data) {
      setUser(response.data.user)
    } else {
      const errorMsg = typeof response.error === 'string' ? response.error : '登录失败'
      throw new Error(errorMsg)
    }
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
    }
  }

  const updateUser = (data: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...data })
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}