'use client'

import { useAuth } from '@/hooks/useAuth'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  Users,
  FolderKanban,
  FileText,
  Mail,
  Brain,
  ScrollText,
  Settings,
  ShieldAlert
} from 'lucide-react'
import { useEffect, useState } from 'react'

const adminNavItems = [
  { href: '/admin/users', icon: Users, label: '用户管理' },
  { href: '/admin/projects', icon: FolderKanban, label: '项目管理' },
  { href: '/admin/templates', icon: FileText, label: '模板管理' },
  { href: '/admin/email', icon: Mail, label: '邮件配置' },
  { href: '/admin/ai', icon: Brain, label: 'AI配置' },
  { href: '/admin/logs', icon: ScrollText, label: '审计日志' },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // 权限检查：只有管理员可以访问
  if (!user || user.role !== 'ADMIN') {
    redirect('/')
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-3 mb-6">
        <ShieldAlert className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">管理员控制台</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* 侧边导航 */}
        <nav className="w-full md:w-48 shrink-0">
          <Card>
            <CardContent className="p-2">
              <div className="flex md:flex-col gap-1 overflow-x-auto">
                {adminNavItems.map((item) => (
                  <Link key={item.href} href={item.href} className="block">
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2"
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="hidden md:inline">{item.label}</span>
                    </Button>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </nav>

        {/* 主内容区 */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}