'use client'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search } from 'lucide-react'

interface UserFiltersProps {
  table: any
  userCount: number
  activeCount: number
  pendingCount: number
  disabledCount: number
}

export function UserFilters({
  table,
  userCount,
  activeCount,
  pendingCount,
  disabledCount,
}: UserFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <div className="relative min-w-[200px] flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="搜索姓名或邮箱..."
            value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
            onChange={(event) => table.getColumn('name')?.setFilterValue(event.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={(table.getColumn('status')?.getFilterValue() as string) ?? 'all'}
          onValueChange={(value) =>
            table.getColumn('status')?.setFilterValue(value === 'all' ? undefined : value)
          }
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="状态筛选" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="PENDING">待审批</SelectItem>
            <SelectItem value="ACTIVE">已激活</SelectItem>
            <SelectItem value="DISABLED">已禁用</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={(table.getColumn('role')?.getFilterValue() as string) ?? 'all'}
          onValueChange={(value) =>
            table.getColumn('role')?.setFilterValue(value === 'all' ? undefined : value)
          }
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="角色筛选" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部角色</SelectItem>
            <SelectItem value="ADMIN">系统管理员</SelectItem>
            <SelectItem value="PROJECT_ADMIN">项目管理员</SelectItem>
            <SelectItem value="PROJECT_OWNER">项目所有者</SelectItem>
            <SelectItem value="PROJECT_MEMBER">项目成员</SelectItem>
            <SelectItem value="EMPLOYEE">普通员工</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="text-muted-foreground mb-4 flex gap-4 text-sm">
        <span>共 {userCount} 个用户</span>
        <span>|</span>
        <span>已激活: {activeCount}</span>
        <span>待审批: {pendingCount}</span>
        <span>已禁用: {disabledCount}</span>
      </div>
    </div>
  )
}