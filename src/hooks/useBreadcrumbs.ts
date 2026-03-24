'use client'

import { useMemo } from 'react'
import { usePathname } from 'next/navigation'

const routeLabels: Record<string, string> = {
  dashboard: '工作台',
  projects: '项目',
  tasks: '任务',
  reviews: '评审',
  risks: '风险',
  milestones: '里程碑',
  issues: '问题',
  settings: '设置',
  profile: '个人资料',
  preferences: '偏好设置',
  admin: '管理',
  users: '用户管理',
  new: '新建',
  members: '成员',
  documents: '文档',
  edit: '编辑',
}

export function useBreadcrumbs() {
  const pathname = usePathname()

  return useMemo(() => {
    const segments = pathname.split('/').filter(Boolean)
    const breadcrumbs: { label: string; href?: string }[] = []

    let currentPath = ''
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`

      if (segment.match(/^[a-f0-9-]{36}$/) || segment.match(/^\d+$/)) {
        breadcrumbs.push({ label: '详情', href: currentPath })
        return
      }

      const label = routeLabels[segment] || segment
      const isLast = index === segments.length - 1

      breadcrumbs.push({
        label,
        href: isLast ? undefined : currentPath,
      })
    })

    return breadcrumbs
  }, [pathname])
}
