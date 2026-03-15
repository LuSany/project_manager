'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { NotificationIcon } from './NotificationIcon'

interface Notification {
  id: string
  type: string
  title: string
  content: string
  link?: string | null
  isRead: boolean
  createdAt: Date
}

interface NotificationDrawerProps {
  open: boolean
  onClose: () => void
}

export function NotificationDrawer({ open, onClose }: NotificationDrawerProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/v1/notifications', {
        credentials: 'include'
      })
      const data = await response.json()
      if (data.success) {
        setNotifications(data.data || [])
      }
    } catch (err) {
      console.error('获取通知失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/v1/notifications/${id}`, {
        method: 'PUT',
      })
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === id ? { ...notif, isRead: true } : notif))
      )
    } catch (err) {
      console.error('标记通知已读失败:', err)
    }
  }

  const deleteNotification = async (id: string) => {
    if (!confirm('确定要删除此通知吗？')) return

    try {
      await fetch(`/api/v1/notifications/${id}`, {
        method: 'DELETE',
      })
      setNotifications((prev) => prev.filter((notif) => notif.id !== id))
    } catch (err) {
      console.error('删除通知失败:', err)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'RISK_ALERT':
        return '⚠️'
      case 'REVIEW_INVITE':
        return '📋'
      case 'URGENT_TASK':
        return '🔥'
      case 'TASK_DUE_REMINDER':
        return '⏰'
      case 'TASK_ASSIGNED':
        return '📝'
      case 'COMMENT_MENTION':
        return '💬'
      case 'DAILY_DIGEST':
        return '📊'
      default:
        return '📌'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'RISK_ALERT':
        return 'text-red-600'
      case 'REVIEW_INVITE':
        return 'text-blue-600'
      case 'URGENT_TASK':
        return 'text-orange-600'
      case 'TASK_DUE_REMINDER':
        return 'text-yellow-600'
      case 'TASK_ASSIGNED':
        return 'text-green-600'
      case 'COMMENT_MENTION':
        return 'text-purple-600'
      default:
        return 'text-gray-600'
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))

    if (hours < 1) {
      return '刚刚'
    } else if (hours < 24) {
      return `${Math.floor(hours / 24)}小时前`
    } else if (hours < 48) {
      return '昨天'
    } else if (hours < 168) {
      return `${Math.floor(hours / 24)}天前`
    } else {
      return date.toLocaleDateString('zh-CN')
    }
  }

  return (
    <div
      className={`bg-background fixed inset-y-0 right-0 h-full w-80 shadow-lg transition-transform sm:w-96 ${open ? 'translate-x-0' : 'translate-x-full'}`}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold">通知</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <div>加载中...</div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-muted-foreground flex h-full flex-col items-center justify-center py-4 text-center">
              <p>暂无通知</p>
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`hover:bg-accent/5 p-3 ${!notification.isRead ? 'bg-accent/50' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`text-xl ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p
                          className={`text-sm font-medium ${!notification.isRead ? 'font-semibold' : ''}`}
                        >
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <Badge variant="default" className="ml-2">
                            未读
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground mt-1 text-xs">{notification.content}</p>
                      <p className="text-muted-foreground text-xs">
                        {formatTime(new Date(notification.createdAt))}
                      </p>
                      {notification.link && (
                        <a
                          href={notification.link}
                          className="mt-2 inline-block text-xs text-blue-600 hover:underline"
                        >
                          查看详情
                        </a>
                      )}
                      <div className="mt-2 flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          disabled={notification.isRead}
                        >
                          标记已读
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNotification(notification.id)}
                          className="text-destructive hover:text-destructive/80"
                        >
                          删除
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
