'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Bell, Search, User, LogOut, Settings, ChevronDown, Sun, Moon } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useTheme } from '@/hooks/useTheme'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { MobileNav } from './MobileNav'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export function Header() {
  const { user, logout } = useAuth()
  const breadcrumbs = useBreadcrumbs()
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // 响应式检测
  const isDesktop = useMediaQuery('md') // >= 768px

  // 获取未读通知数量
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await fetch('/api/v1/notifications?unread=true', {
          credentials: 'include',
        })
        if (!response.ok) {
          return
        }
        const data = await response.json()
        if (data.success) {
          setUnreadCount(data.data?.length || 0)
        }
      } catch (e) {
        console.error('获取通知失败:', e)
      }
    }

    if (isDesktop) {
      fetchUnreadCount()
    }
  }, [isDesktop])

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
      setSearchQuery('')
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return '系统管理员'
      case 'PROJECT_ADMIN':
        return '项目管理员'
      case 'PROJECT_OWNER':
        return '项目所有者'
      case 'PROJECT_MEMBER':
        return '项目成员'
      default:
        return '普通员工'
    }
  }

  return (
    <header className="bg-background/95 supports-[backdrop-blur] sticky top-0 z-50 border-b backdrop-blur">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        {/* 左侧区域 */}
        <div className="flex items-center gap-2">
          {/* 移动端：汉堡菜单 */}
          {!isDesktop && <MobileNav />}

          {/* 桌面端：面包屑导航 */}
          {isDesktop && <Breadcrumb items={breadcrumbs} className="flex" />}
        </div>

        {/* 搜索框 - 仅桌面端显示 */}
        {isDesktop && (
          <div className="max-w-md flex-1 md:ml-4">
            <form onSubmit={handleSearch} className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索项目、任务、需求..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-input bg-background placeholder:text-muted-foreground focus:ring-primary/20 focus:border-primary h-9 w-full rounded-md border pr-4 pl-9 text-sm focus:ring-2 focus:outline-none"
              />
              <kbd className="bg-muted text-muted-foreground absolute top-1/2 right-3 hidden h-5 -translate-y-1/2 items-center rounded border px-1.5 text-[10px] sm:inline-flex">
                ⌘K
              </kbd>
            </form>
          </div>
        )}

        {/* 右侧操作区 */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* 通知图标 - 仅桌面端显示 */}
          {isDesktop && (
            <Link
              href="/notifications"
              className="hover:bg-accent relative rounded-md p-2 transition-colors"
            >
              <Bell className="text-muted-foreground h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          )}

          {/* 用户菜单 */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="hover:bg-accent flex items-center gap-2 rounded-md p-1.5 transition-colors"
            >
              <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
                <User className="text-primary h-4 w-4" />
              </div>
              {/* 用户名 - 仅桌面端显示 */}
              {isDesktop && (
                <>
                  <div className="text-left">
                    <p className="text-sm leading-tight font-medium">{user?.name || '用户'}</p>
                    <p className="text-muted-foreground text-xs">{getRoleLabel(user?.role)}</p>
                  </div>
                  <ChevronDown className="text-muted-foreground h-4 w-4" />
                </>
              )}
            </button>

            {/* 下拉菜单 */}
            {showUserMenu && (
              <div className="bg-popover absolute top-full right-0 mt-1 w-48 rounded-md border p-1 shadow-lg">
                {isDesktop && (
                  <div className="mb-1 border-b px-2 py-1.5 text-sm font-medium">{user?.email}</div>
                )}
                {/* 主题切换 */}
                <button
                  onClick={() => {
                    toggleTheme()
                    setShowUserMenu(false)
                  }}
                  className="hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm"
                >
                  {theme === 'light' ? (
                    <>
                      <Moon className="h-4 w-4" />
                      切换到深色模式
                    </>
                  ) : (
                    <>
                      <Sun className="h-4 w-4" />
                      切换到浅色模式
                    </>
                  )}
                </button>
                <Link
                  href="/settings/profile"
                  className="hover:bg-accent flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Settings className="h-4 w-4" />
                  个人设置
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-destructive hover:bg-destructive/10 flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm"
                >
                  <LogOut className="h-4 w-4" />
                  退出登录
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
