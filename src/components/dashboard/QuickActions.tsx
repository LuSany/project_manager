'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FolderOpen,
  Calendar,
  Clock,
  ArrowRight,
  Star,
  Zap,
  Users,
  Shield
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface RecentProject {
  id: string
  name: string
  status: string
  progress: number
  updatedAt: string
}

interface Milestone {
  id: string
  title: string
  dueDate: string
  project: {
    id: string
    name: string
  }
}

interface UserInfo {
  id: string
  role: string
}

export function QuickActions() {
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([])
  const [upcomingMilestones, setUpcomingMilestones] = useState<Milestone[]>([])
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 获取当前用户信息
        const userRes = await fetch('/api/v1/users/me')
        const userData = await userRes.json()
        if (userData.success) {
          setCurrentUser(userData.data)
        }

        // 获取最近项目
        const projectsRes = await fetch('/api/v1/projects?limit=3&sort=updatedAt')
        const projectsData = await projectsRes.json()
        if (projectsData.success && projectsData.data?.items) {
          setRecentProjects(projectsData.data.items.slice(0, 3) || [])
        }

        // 获取即将到来的里程碑
        const milestonesRes = await fetch('/api/v1/milestones/upcoming?limit=3')
        const milestonesData = await milestonesRes.json()
        if (milestonesData.success) {
          setUpcomingMilestones(milestonesData.data || [])
        }
      } catch (e) {
        console.error('获取快捷数据失败:', e)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      ACTIVE: { label: '进行中', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
      PLANNING: { label: '计划中', className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' },
      COMPLETED: { label: '已完成', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
      ON_HOLD: { label: '暂停', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' }
    }
    return config[status] || config.PLANNING
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays <= 0) return '已到期'
    if (diffDays === 1) return '明天'
    if (diffDays <= 7) return `${diffDays}天后`
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  const quickLinks = [
    { icon: FolderOpen, label: '项目列表', href: '/projects', color: 'text-blue-500' },
    { icon: Calendar, label: '日程安排', href: '/calendar', color: 'text-purple-500' },
    { icon: Clock, label: '工时统计', href: '/timesheet', color: 'text-emerald-500' },
    { icon: Star, label: '我的收藏', href: '/favorites', color: 'text-amber-500' }
  ]

  // 管理员入口
  const adminLinks = currentUser?.role === 'ADMIN' ? [
    { icon: Users, label: '用户管理', href: '/admin/users', color: 'text-rose-500' },
    { icon: Shield, label: '管理控制台', href: '/admin', color: 'text-slate-500' },
  ] : []

  return (
    <Card className="shadow-sm h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <Zap className="h-5 w-5 text-amber-500" />
          快捷入口
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {/* 快捷链接 */}
        <div className="grid grid-cols-2 gap-2">
          {quickLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <link.icon className={cn('h-5 w-5', link.color)} />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {link.label}
              </span>
            </Link>
          ))}
        </div>

        {/* 管理员入口 */}
        {adminLinks.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">管理员功能</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {adminLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 p-3 rounded-lg border border-rose-100 dark:border-rose-900/30 hover:border-rose-200 dark:hover:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                >
                  <link.icon className={cn('h-5 w-5', link.color)} />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {link.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 最近项目 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">最近项目</span>
            <Link href="/projects" className="text-xs text-blue-500 hover:text-blue-600">
              查看全部
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1, 2].map(i => (
                <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
              ))}
            </div>
          ) : recentProjects.length === 0 ? (
            <div className="text-center py-4 text-sm text-slate-400">
              暂无项目
            </div>
          ) : (
            <div className="space-y-2">
              {recentProjects.map(project => {
                const statusConfig = getStatusBadge(project.status)
                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <FolderOpen className="h-4 w-4 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {project.name}
                        </p>
                        <Badge className={cn('text-xs', statusConfig.className)}>
                          {statusConfig.label}
                        </Badge>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* 即将到来的里程碑 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">近期里程碑</span>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1, 2].map(i => (
                <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
              ))}
            </div>
          ) : upcomingMilestones.length === 0 ? (
            <div className="text-center py-4 text-sm text-slate-400">
              暂无近期里程碑
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingMilestones.map(milestone => (
                <div
                  key={milestone.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {milestone.title}
                      </p>
                      <p className="text-xs text-slate-500">{milestone.project.name}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500">
                    {formatDate(milestone.dueDate)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}