'use client'

import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import Link from 'next/link'
import { User, Bell, Shield, Palette, ChevronRight, Mail, Building2, Briefcase } from 'lucide-react'
import { cn } from '@/lib/utils'

const settingsItems = [
  {
    title: '个人资料',
    description: '修改您的姓名、头像、部门等信息',
    icon: User,
    href: '/settings/profile',
    color: 'blue',
  },
  {
    title: '通知偏好',
    description: '配置通知接收方式和偏好设置',
    icon: Bell,
    href: '/settings/preferences',
    color: 'amber',
  },
  {
    title: '安全设置',
    description: '修改密码和安全选项',
    icon: Shield,
    href: '/settings/security',
    color: 'emerald',
  },
  {
    title: '外观设置',
    description: '自定义界面主题和显示选项',
    icon: Palette,
    href: '/settings/appearance',
    color: 'purple',
  },
]

const colorConfig: Record<string, { bg: string; text: string; border: string }> = {
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'hover:border-blue-200 dark:hover:border-blue-800',
  },
  amber: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'hover:border-amber-200 dark:hover:border-amber-800',
  },
  emerald: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'hover:border-emerald-200 dark:hover:border-emerald-800',
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'hover:border-purple-200 dark:hover:border-purple-800',
  },
}

// 设置项卡片组件
function SettingsCard({
  item,
}: {
  item: {
    title: string
    description: string
    icon: React.ElementType
    href: string
    color: string
  }
}) {
  const colors = colorConfig[item.color]
  const Icon = item.icon

  return (
    <Link href={item.href} className="block">
      <Card
        className={cn(
          'group cursor-pointer rounded-xl border border-slate-200 bg-white transition-all duration-200',
          'hover:shadow-md dark:border-slate-700 dark:bg-slate-800',
          colors.border
        )}
      >
        <CardContent className="flex items-center gap-4 p-5">
          {/* 图标 */}
          <div
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
              colors.bg
            )}
          >
            <Icon className={cn('h-5 w-5', colors.text)} />
          </div>

          {/* 内容 */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-medium text-slate-800 dark:text-slate-100">
                {item.title}
              </h3>
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition-colors group-hover:text-blue-500" />
            </div>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{item.description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default function SettingsPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-6 pb-8">
      {/* 页面头部 - 渐变背景卡片 */}
      <Card className="via-background border-none bg-gradient-to-br from-[var(--brand-50)] to-[color-mix(in_oklch,var(--brand-100),transparent_50%)] shadow-sm">
        <CardContent className="p-6">
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">设置</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">管理您的账户设置和偏好</p>
        </CardContent>
      </Card>

      {/* 用户信息卡片 */}
      <Card className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row">
            {/* 左侧：头像和基本信息 */}
            <div className="flex items-center gap-4 p-6 sm:flex-1">
              <Avatar className="h-16 w-16 border-2 border-white shadow-md">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-xl font-medium text-white">
                  {user?.name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {user?.name || '用户'}
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {user?.role || '用户'}
                  </Badge>
                  {user?.department && (
                    <Badge variant="outline" className="text-xs">
                      {user.department}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* 右侧：详细信息 */}
            <div className="border-t border-slate-100 bg-slate-50/50 p-6 sm:border-t-0 sm:border-l dark:border-slate-700 dark:bg-slate-800/50">
              <div className="space-y-3">
                {user?.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-slate-600 dark:text-slate-400">{user.email}</span>
                  </div>
                )}
                {user?.department && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                      <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-slate-600 dark:text-slate-400">{user.department}</span>
                  </div>
                )}
                {user?.position && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                      <Briefcase className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <span className="text-slate-600 dark:text-slate-400">{user.position}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 设置项网格 */}
      <div className="grid gap-4 sm:grid-cols-2">
        {settingsItems.map((item) => (
          <SettingsCard key={item.href} item={item} />
        ))}
      </div>

      {/* 退出登录区域 */}
      <Card className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-medium text-slate-800 dark:text-slate-100">账户安全</h3>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                退出当前账户并清除登录状态
              </p>
            </div>
            <Button
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30"
            >
              退出登录
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
