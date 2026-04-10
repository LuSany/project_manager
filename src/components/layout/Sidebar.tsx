import React, { useState, useEffect } from 'react'
import {
  Folder,
  Calendar,
  CalendarDays,
  Settings,
  Users,
  FileText,
  CheckSquare,
  AlertCircle,
  Menu,
  Clock,
  LayoutDashboard,
  Monitor,
  ShieldCheck,
  BarChart3,
  Wrench,
  PieChart,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { useUIStore } from '@/stores/uiStore'

interface NavItem {
  title: string
  icon: React.ComponentType<{ className?: string }>
  path: string
  badge?: number | null
  adminOnly?: boolean
}

export interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  // 从 store 获取状态
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed)
  const toggleSidebar = useUIStore((state) => state.toggleSidebar)
  const _hydrated = useUIStore((state) => state._hydrated)

  // 用于 SSR hydration 检测
  const [mounted, setMounted] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [myTasksCount, setMyTasksCount] = useState<number | null>(null)
  const pathname = usePathname()

  // 获取当前用户角色和任务数
  useEffect(() => {
    setMounted(true)

    const fetchUserRole = async () => {
      try {
        const response = await fetch('/api/v1/users/me', {
          credentials: 'include',
        })
        if (!response.ok) {
          return
        }
        const data = await response.json()
        if (data.success) {
          setUserRole(data.data.role)
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
      }
    }

    const fetchMyTasksCount = async () => {
      try {
        const response = await fetch('/api/v1/dashboard/stats', {
          credentials: 'include',
        })
        if (!response.ok) {
          return
        }
        const data = await response.json()
        if (data.success && typeof data.data?.myTasksCount === 'number') {
          setMyTasksCount(data.data.myTasksCount)
        }
      } catch (error) {
        console.error('获取我的任务数失败:', error)
      }
    }

    fetchUserRole()
    fetchMyTasksCount()
  }, [])

  const isAdmin = userRole === 'ADMIN'

  const navItems: NavItem[] = [
    {
      title: '工作台',
      icon: LayoutDashboard,
      path: '/dashboard',
    },
    {
      title: '我的任务',
      icon: CheckSquare,
      path: '/tasks',
      badge: myTasksCount,
    },
    {
      title: '项目',
      icon: Folder,
      path: '/projects',
    },
    {
      title: '里程碑',
      icon: Calendar,
      path: '/milestones',
    },
    {
      title: '需求',
      icon: FileText,
      path: '/requirements',
    },
    {
      title: '问题',
      icon: AlertCircle,
      path: '/issues',
    },
    {
      title: '机时管理',
      icon: Clock,
      path: '/timesheet',
    },
    {
      title: '设备管理',
      icon: Monitor,
      path: '/devices',
    },
    {
      title: '设备类型',
      icon: Wrench,
      path: '/admin/device-types',
    },
    {
      title: '设备统计',
      icon: BarChart3,
      path: '/equipment/stats',
    },
    {
      title: '我的预定',
      icon: CalendarDays,
      path: '/bookings',
    },
    {
      title: '审批管理',
      icon: ShieldCheck,
      path: '/approvals',
    },
    {
      title: '审批配置',
      icon: ShieldCheck,
      path: '/admin/approval-configs',
      adminOnly: true,
    },
    {
      title: '配额管理',
      icon: PieChart,
      path: '/admin/quotas',
      adminOnly: true,
    },
    {
      title: '用户管理',
      icon: Users,
      path: '/admin/users',
      adminOnly: true,
    },
  ]

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/'
    }
    return pathname.startsWith(path)
  }

  // SSR hydration 未完成时渲染骨架
  if (!mounted || !_hydrated) {
    return (
      <aside
        className={cn(
          'bg-card border-border flex h-screen flex-col border-r',
          'w-64', // 默认展开宽度
          className
        )}
      >
        <div className="bg-muted/50 h-16 animate-pulse" />
        <div className="flex-1 p-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-muted/50 mb-2 h-10 animate-pulse rounded" />
          ))}
        </div>
      </aside>
    )
  }

  // 折叠按钮点击处理
  const handleToggle = () => {
    toggleSidebar()
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'bg-card border-border flex h-screen flex-col border-r transition-all duration-300 ease-in-out',
          sidebarCollapsed ? 'w-16' : 'w-64',
          className
        )}
      >
        {/* 侧边栏头部 */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
              <span className="text-xl font-bold">PM</span>
            </div>
            {!sidebarCollapsed && <span className="text-foreground font-semibold">项目管理</span>}
          </Link>
          <button
            onClick={handleToggle}
            className="hover:bg-accent rounded-md p-2"
            aria-label={sidebarCollapsed ? '展开侧边栏' : '折叠侧边栏'}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {/* 导航菜单 */}
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
          {navItems
            .filter((item) => !item.adminOnly || isAdmin)
            .map((item) => (
              <Tooltip key={item.path} delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.path}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                      isActive(item.path)
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'hover:bg-accent'
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <span className={sidebarCollapsed ? 'hidden' : 'block'}>{item.title}</span>
                    {item.badge !== null &&
                      item.badge !== undefined &&
                      item.badge > 0 &&
                      !sidebarCollapsed && (
                        <span className="bg-destructive ml-auto rounded-full px-2 py-0.5 text-xs text-white">
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                  </Link>
                </TooltipTrigger>
                {sidebarCollapsed && <TooltipContent side="right">{item.title}</TooltipContent>}
              </Tooltip>
            ))}
        </nav>

        {/* 侧边栏底部 */}
        <div className="mt-auto border-t p-4">
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Link
                href="/settings"
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                  pathname.startsWith('/settings')
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-accent'
                )}
              >
                <Settings className="h-5 w-5 flex-shrink-0" />
                <span className={sidebarCollapsed ? 'hidden' : 'block'}>设置</span>
              </Link>
            </TooltipTrigger>
            {sidebarCollapsed && <TooltipContent side="right">设置</TooltipContent>}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  )
}
