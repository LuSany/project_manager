'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Folder,
  Calendar,
  Settings,
  Users,
  FileText,
  CheckSquare,
  AlertCircle,
  Clock,
  LayoutDashboard,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'

interface NavItem {
  title: string
  icon: React.ComponentType<{ className?: string }>
  path: string
  badge?: number
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { title: '工作台', icon: LayoutDashboard, path: '/dashboard' },
  { title: '我的任务', icon: CheckSquare, path: '/tasks', badge: 5 },
  { title: '项目', icon: Folder, path: '/projects' },
  { title: '里程碑', icon: Calendar, path: '/milestones' },
  { title: '需求', icon: FileText, path: '/requirements' },
  { title: '问题', icon: AlertCircle, path: '/issues' },
  { title: '机时管理', icon: Clock, path: '/timesheet' },
  { title: '用户管理', icon: Users, path: '/admin/users', adminOnly: true },
]

export interface MobileNavProps {
  className?: string
}

export function MobileNav({ className }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { user } = useAuth()

  const isAdmin = user?.role === 'ADMIN'

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/'
    }
    return pathname.startsWith(path)
  }

  // 导航后关闭抽屉
  const handleNavClick = () => {
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('md:hidden', className)}
          aria-label="打开导航菜单"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
          </svg>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-3/4 sm:max-w-xs">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
              <span className="text-xl font-bold">PM</span>
            </div>
            <span>项目管理</span>
          </SheetTitle>
        </SheetHeader>
        <nav className="mt-6 flex flex-col gap-1">
          {navItems
            .filter((item) => !item.adminOnly || isAdmin)
            .map((item) => (
              <Link
                key={item.path}
                href={item.path}
                onClick={handleNavClick}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-3 text-sm transition-colors',
                  'min-h-[44px] min-w-[44px]', // 触摸友好
                  isActive(item.path)
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-accent'
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.title}</span>
                {item.badge && (
                  <span className="bg-destructive ml-auto rounded-full px-2 py-0.5 text-xs text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          <div className="mt-4 border-t pt-4">
            <Link
              href="/settings"
              onClick={handleNavClick}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-3 text-sm transition-colors',
                'min-h-[44px] min-w-[44px]',
                pathname.startsWith('/settings')
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'hover:bg-accent'
              )}
            >
              <Settings className="h-5 w-5 flex-shrink-0" />
              <span>设置</span>
            </Link>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  )
}