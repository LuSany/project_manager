'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { api } from '@/lib/api/client'
import { Loader2, Bell, Check, Mail, Settings } from 'lucide-react'
import Link from 'next/link'

interface Notification {
  id: string
  type: string
  title: string
  content: string
  link?: string
  isRead: boolean
  createdAt: string
}

const typeIcons: Record<string, React.ReactNode> = {
  RISK_ALERT: <Bell className="h-4 w-4 text-red-500" />,
  REVIEW_INVITE: <Mail className="h-4 w-4 text-blue-500" />,
  URGENT_TASK: <Bell className="h-4 w-4 text-orange-500" />,
  TASK_DUE_REMINDER: <Bell className="h-4 w-4 text-yellow-500" />,
  TASK_ASSIGNED: <Check className="h-4 w-4 text-green-500" />,
  COMMENT_MENTION: <Bell className="h-4 w-4 text-purple-500" />,
  DAILY_DIGEST: <Bell className="h-4 w-4 text-gray-500" />,
}

const typeLabels: Record<string, string> = {
  RISK_ALERT: '风险预警',
  REVIEW_INVITE: '评审邀请',
  URGENT_TASK: '紧急任务',
  TASK_DUE_REMINDER: '任务到期',
  TASK_ASSIGNED: '任务分配',
  COMMENT_MENTION: '@提及',
  DAILY_DIGEST: '每日摘要',
  SYSTEM: '系统通知',
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadOnly, setUnreadOnly] = useState(false)

  useEffect(() => {
    fetchNotifications()
  }, [unreadOnly])

  const fetchNotifications = async () => {
    try {
      const params = new URLSearchParams()
      if (unreadOnly) {
        params.append('unreadOnly', 'true')
      }
      const response = await api.get(`/notifications?${params.toString()}`)
      setNotifications((response as { data?: Notification[] }).data || [])
    } catch (error) {
      console.error('获取通知失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`)
      fetchNotifications()
    } catch (error) {
      console.error('标记已读失败:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all')
      fetchNotifications()
    } catch (error) {
      console.error('全部标记已读失败:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            通知中心
          </h1>
          <p className="text-muted-foreground">查看和管理您的所有通知</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={unreadOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => setUnreadOnly(!unreadOnly)}
          >
            只看未读
          </Button>
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
            <Check className="h-4 w-4 mr-2" />
            全部标记已读
          </Button>
          <Link href="/settings/preferences">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              通知偏好
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {notifications.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p>暂无通知</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>类型</TableHead>
                  <TableHead>标题</TableHead>
                  <TableHead>内容</TableHead>
                  <TableHead>时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.map((notification) => (
                  <TableRow
                    key={notification.id}
                    className={!notification.isRead ? 'bg-muted/50' : ''}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {typeIcons[notification.type] || <Bell className="h-4 w-4" />}
                        <Badge variant="outline">{typeLabels[notification.type] || notification.type}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{notification.title}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-muted-foreground max-w-md truncate">
                        {notification.content}
                      </p>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {new Date(notification.createdAt).toLocaleString('zh-CN')}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {notification.link && (
                        <Link href={notification.link}>
                          <Button variant="link" size="sm">查看</Button>
                        </Link>
                      )}
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          标记已读
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}