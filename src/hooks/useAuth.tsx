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

const USER_STORAGE_KEY = 'pm_user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 首先尝试从 localStorage 恢复用户状态
    const storedUser = localStorage.getItem(USER_STORAGE_KEY)
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        localStorage.removeItem(USER_STORAGE_KEY)
      }
    }
    // 然后从服务器获取最新用户信息
    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      const response = await api.get<{ id: string; email: string; name: string; role: string; department?: string; position?: string; phone?: string; avatar?: string; status: string }>('/users/me')
      if (response.success && response.data) {
        const userData = response.data as User
        setUser(userData)
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData))
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
      // 如果 API 调用失败，不清除 localStorage 中的用户状态
      // 这样可以保持登录状态
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const response = await api.post<{ user: User; token: string }>('/auth/login', { email, password })
    if (response.success && response.data) {
      const userData = response.data.user
      setUser(userData)
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData))
    } else {
      // 处理错误消息 - error 可能是字符串或 { code, message } 对象
      let errorMsg = '登录失败'
      if (typeof response.error === 'string') {
        errorMsg = response.error
      } else if (response.error && typeof response.error === 'object' && 'message' in response.error) {
        errorMsg = (response.error as { message: string }).message
      }
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
      localStorage.removeItem(USER_STORAGE_KEY)
    }
  }

  const updateUser = (data: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...data }
      setUser(updatedUser)
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser))
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