'use client'

import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { User, Bell, Shield, Palette, ChevronRight } from 'lucide-react'
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
    <div className="container mx-auto space-y-6 py-6">
      {/* 页面头部 */}
      <div className="via-background rounded-lg border-none bg-gradient-to-br from-[var(--brand-50)] to-[color-mix(in_oklch,var(--brand-100),transparent_50%)] p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">设置</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">管理您的账户设置和偏好</p>
      </div>

      {/* 用户信息卡片 */}
      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <CardHeader>
          <CardTitle className="text-lg text-slate-800 dark:text-slate-100">当前账户</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm">
              <span className="text-2xl font-bold text-white">{user?.name?.charAt(0) || '?'}</span>
            </div>
            <div>
              <p className="text-lg font-medium text-slate-800 dark:text-slate-100">{user?.name}</p>
              <p className="text-slate-500 dark:text-slate-400">{user?.email}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
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
            <Card className="rounded-xl border border-slate-200 bg-white transition-all hover:border-blue-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-blue-800">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <item.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-800 dark:text-slate-100">{item.title}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{item.description}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
