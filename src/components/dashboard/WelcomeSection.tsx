'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Plus,
  Calendar,
  ClipboardList,
  Bell,
  Sun,
  Moon,
  CloudSun
} from 'lucide-react'
import Link from 'next/link'

interface UserInfo {
  name: string
  email: string
  role: string
}

export function WelcomeSection() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // 获取用户信息
    const userInfo = localStorage.getItem('pm_user')
    if (userInfo) {
      try {
        setUser(JSON.parse(userInfo))
      } catch (e) {
        setUser({ name: '用户', email: '', role: '' })
      }
    } else {
      setUser({ name: '用户', email: '', role: '' })
    }

    // 更新时间
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // 每分钟更新

    // 获取未读通知数量
    fetchUnreadCount()

    return () => clearInterval(timer)
  }, [])

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/v1/notifications?unread=true')
      const data = await response.json()
      if (data.success) {
        setUnreadCount(data.data?.length || 0)
      }
    } catch (e) {
      console.error('获取通知失败:', e)
    }
  }

  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 6) return { text: '夜深了', icon: Moon }
    if (hour < 12) return { text: '早上好', icon: Sun }
    if (hour < 14) return { text: '中午好', icon: CloudSun }
    if (hour < 18) return { text: '下午好', icon: Sun }
    return { text: '晚上好', icon: Moon }
  }

  const formatDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    }
    return currentTime.toLocaleDateString('zh-CN', options)
  }

  const greeting = getGreeting()
  const GreetingIcon = greeting.icon

  return (
    <Card className="border-none shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* 左侧：欢迎信息 */}
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 border-2 border-white shadow-sm">
              <AvatarFallback className="bg-blue-600 text-white text-lg font-medium">
                {user?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <GreetingIcon className="h-5 w-5 text-amber-500" />
                <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                  {greeting.text}，{user?.name || '用户'}
                </h1>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {formatDate()} · 欢迎使用项目管理系统
              </p>
            </div>
          </div>

          {/* 右侧：快捷操作 */}
          <div className="flex items-center gap-3">
            <Link href="/projects/new">
              <Button className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-sm">
                <Plus className="h-4 w-4" />
                新建项目
              </Button>
            </Link>
            <Link href="/tasks/new">
              <Button variant="outline" className="gap-2 shadow-sm">
                <ClipboardList className="h-4 w-4" />
                新建任务
              </Button>
            </Link>
            <Link href="/notifications">
              <Button variant="ghost" size="icon" className="relative shadow-sm">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}