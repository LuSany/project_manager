'use client'

import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  User,
  Bell,
  Shield,
  Palette,
  ChevronRight
} from 'lucide-react'
import { useState, useEffect } from 'react'

const settingsItems = [
  {
    title: '个人资料',
    description: '修改您的姓名、头像、部门等信息',
    icon: User,
    href: '/settings/profile',
  },
  {
    title: '通知偏好',
    description: '配置通知接收方式和偏好设置',
    icon: Bell,
    href: '/settings/preferences',
  },
  {
    title: '安全设置',
    description: '修改密码和安全选项',
    icon: Shield,
    href: '/settings/security',
  },
  {
    title: '外观设置',
    description: '自定义界面主题和显示选项',
    icon: Palette,
    href: '/settings/appearance',
  },
]

export default function SettingsPage() {
  const { user } = useAuth()

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">设置</h1>
        <p className="text-muted-foreground">管理您的账户设置和偏好</p>
      </div>

      {/* 用户信息卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">当前账户</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">
                {user?.name?.charAt(0) || '?'}
              </span>
            </div>
            <div>
              <p className="font-medium text-lg">{user?.name}</p>
              <p className="text-muted-foreground">{user?.email}</p>
              <p className="text-sm text-muted-foreground">
                {user?.department && `${user.department}`}
                {user?.position && ` · ${user.position}`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 设置项列表 */}
      <div className="grid gap-4">
        {settingsItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}