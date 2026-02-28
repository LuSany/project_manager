'use client'

import * as React from 'react'
import { Shield, Users, Crown, Briefcase, Lock, Search } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// 角色类型定义
export type UserRole = 'ADMIN' | 'PROJECT_ADMIN' | 'PROJECT_OWNER' | 'PROJECT_MEMBER' | 'EMPLOYEE'

// 角色配置
export interface RoleConfig {
  value: UserRole
  label: string
  description: string
  level: number
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  permissions: string[]
}

// 角色权限映射
export const ROLE_CONFIG: Record<UserRole, RoleConfig> = {
  ADMIN: {
    value: 'ADMIN',
    label: '系统管理员',
    description: '拥有系统全部权限，可管理所有项目和用户',
    level: 5,
    icon: Shield,
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200',
    permissions: ['系统管理', '用户管理', '所有项目管理', '系统设置', '数据导出'],
  },
  PROJECT_ADMIN: {
    value: 'PROJECT_ADMIN',
    label: '项目管理员',
    description: '可管理项目成员、任务、需求和评审流程',
    level: 4,
    icon: Crown,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200',
    permissions: ['项目查看', '项目编辑', '成员管理', '任务管理', '需求管理', '评审管理'],
  },
  PROJECT_OWNER: {
    value: 'PROJECT_OWNER',
    label: '项目所有者',
    description: '项目最高权限者，拥有项目的完整控制权',
    level: 4,
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
    permissions: [
      '项目查看',
      '项目编辑',
      '项目删除',
      '成员管理',
      '任务管理',
      '需求管理',
      '评审管理',
    ],
  },
  PROJECT_MEMBER: {
    value: 'PROJECT_MEMBER',
    label: '项目成员',
    description: '可参与项目任务和协作，拥有基本操作权限',
    level: 3,
    icon: Lock,
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
    permissions: ['项目查看', '任务查看', '任务更新', '评论创建'],
  },
  EMPLOYEE: {
    value: 'EMPLOYEE',
    label: '普通员工',
    description: '基础员工角色，可查看和提交需求',
    level: 1,
    icon: Briefcase,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 border-gray-200',
    permissions: ['个人信息管理', '分配项目查看', '需求提交'],
  },
}

// 所有角色列表
export const ALL_ROLES: UserRole[] = [
  'ADMIN',
  'PROJECT_ADMIN',
  'PROJECT_OWNER',
  'PROJECT_MEMBER',
  'EMPLOYEE',
]

// 项目成员可选角色（排除 ADMIN）
export const PROJECT_ROLES: UserRole[] = [
  'PROJECT_ADMIN',
  'PROJECT_OWNER',
  'PROJECT_MEMBER',
  'EMPLOYEE',
]

// 角色级别标签
function getLevelBadge(level: number) {
  const variants: Record<number, 'default' | 'secondary' | 'destructive'> = {
    5: 'destructive',
    4: 'default',
    3: 'secondary',
    1: 'secondary',
  }
  const labels: Record<number, string> = {
    5: '系统级',
    4: '高级',
    3: '中级',
    1: '基础',
  }
  return <Badge variant={variants[level] || 'secondary'}>{labels[level]}</Badge>
}

// 单选角色选择器 Props
export interface RoleSelectProps {
  value?: string
  onValueChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  label?: string
  error?: string
  excludeRoles?: UserRole[]
  showDescription?: boolean
  className?: string
}

// 单选角色选择器
export function RoleSelect({
  value,
  onValueChange,
  disabled = false,
  placeholder = '选择角色',
  label,
  error,
  excludeRoles = [],
  showDescription = true,
  className,
}: RoleSelectProps) {
  const selectedConfig = value ? ROLE_CONFIG[value as UserRole] : null
  const SelectedIcon = selectedConfig?.icon

  const availableRoles = ALL_ROLES.filter((role) => !excludeRoles.includes(role))

  return (
    <div className={cn('space-y-2', className)}>
      {label && <Label>{label}</Label>}
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className={cn('w-full', error && 'border-destructive')}>
          <SelectValue placeholder={placeholder}>
            {selectedConfig && (
              <div className="flex items-center gap-2">
                <SelectedIcon className={cn('h-4 w-4', selectedConfig.color)} />
                <span className={selectedConfig.color}>{selectedConfig.label}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {availableRoles.map((role) => {
            const config = ROLE_CONFIG[role]
            const Icon = config.icon
            return (
              <SelectItem key={role} value={role}>
                <div className="flex items-center gap-2">
                  <Icon className={cn('h-4 w-4', config.color)} />
                  <span className={config.color}>{config.label}</span>
                </div>
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
      {error && <p className="text-destructive text-sm">{error}</p>}
      {showDescription && selectedConfig && (
        <div
          className={cn(
            'flex items-start gap-2 rounded-md border p-3 text-sm',
            selectedConfig.bgColor
          )}
        >
          <SelectedIcon className={cn('mt-0.5 h-4 w-4 flex-shrink-0', selectedConfig.color)} />
          <p className="text-gray-700">{selectedConfig.description}</p>
        </div>
      )}
    </div>
  )
}

// 多选角色选择器 Props
export interface RoleMultiSelectProps {
  values?: string[]
  onChange?: (values: string[]) => void
  disabled?: boolean
  placeholder?: string
  label?: string
  excludeRoles?: UserRole[]
  className?: string
}

// 多选角色选择器
export function RoleMultiSelect({
  values = [],
  onChange,
  disabled = false,
  placeholder = '选择角色',
  label,
  excludeRoles = [],
  className,
}: RoleMultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  const availableRoles = ALL_ROLES.filter((role) => !excludeRoles.includes(role))

  const handleSelect = (role: UserRole) => {
    if (values.includes(role)) {
      onChange?.(values.filter((v) => v !== role))
    } else {
      onChange?.([...values, role])
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      {label && <Label>{label}</Label>}
      <Select open={open} onOpenChange={setOpen}>
        <SelectTrigger>
          <SelectValue
            placeholder={values.length > 0 ? `已选择 ${values.length} 个角色` : placeholder}
          />
        </SelectTrigger>
        <SelectContent>
          {availableRoles.map((role) => {
            const config = ROLE_CONFIG[role]
            const Icon = config.icon
            return (
              <div
                key={role}
                className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5"
                onClick={() => !disabled && handleSelect(role)}
              >
                <input
                  type="checkbox"
                  checked={values.includes(role)}
                  onChange={() => {}}
                  disabled={disabled}
                  className="h-4 w-4"
                />
                <Icon className={cn('h-4 w-4', config.color)} />
                <span className={config.color}>{config.label}</span>
              </div>
            )
          })}
        </SelectContent>
      </Select>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {values.map((role) => {
            const config = ROLE_CONFIG[role as UserRole]
            const Icon = config.icon
            return (
              <Badge key={role} variant="outline" className="gap-1">
                <Icon className={cn('h-3 w-3', config.color)} />
                {config.label}
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}

// 角色权限预览 Props
export interface RolePermissionPreviewProps {
  role: UserRole
  readOnly?: boolean
  className?: string
}

// 角色权限预览组件
export function RolePermissionPreview({
  role,
  readOnly = true,
  className,
}: RolePermissionPreviewProps) {
  const config = ROLE_CONFIG[role]
  const Icon = config.icon

  return (
    <Card className={cn('bg-muted/50', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={cn('h-4 w-4', config.color)} />
            <CardTitle className="text-base">{config.label}</CardTitle>
          </div>
          {getLevelBadge(config.level)}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-muted-foreground mb-2 text-sm">{config.description}</p>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-medium">权限:</p>
          <div className="flex flex-wrap gap-1">
            {config.permissions.map((permission) => (
              <Badge key={permission} variant="secondary" className="text-xs">
                {permission}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// 搜索角色选择器 Props
export interface RoleSearchSelectProps {
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  placeholder?: string
  label?: string
  excludeRoles?: UserRole[]
  className?: string
}

// 带搜索的角色选择器
export function RoleSearchSelect({
  value,
  onValueChange,
  disabled = false,
  placeholder = '搜索角色...',
  label,
  excludeRoles = [],
  className,
}: RoleSearchSelectProps) {
  const [search, setSearch] = React.useState('')

  const availableRoles = ALL_ROLES.filter(
    (role) =>
      !excludeRoles.includes(role) &&
      (ROLE_CONFIG[role].label.includes(search) ||
        ROLE_CONFIG[role].description.includes(search) ||
        ROLE_CONFIG[role].permissions.some((p) => p.includes(search)))
  )

  return (
    <div className={cn('space-y-2', className)}>
      {label && <Label>{label}</Label>}
      <div className="relative">
        <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
        <Input
          placeholder={placeholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
          disabled={disabled}
        />
      </div>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder="选择角色" />
        </SelectTrigger>
        <SelectContent>
          {availableRoles.length === 0 ? (
            <div className="text-muted-foreground p-4 text-center text-sm">没有找到匹配的角色</div>
          ) : (
            availableRoles.map((role) => {
              const config = ROLE_CONFIG[role]
              const Icon = config.icon
              return (
                <SelectItem key={role} value={role}>
                  <div className="flex flex-col gap-1">
                    <span className={cn('font-medium', config.color)}>{config.label}</span>
                    <span className="text-muted-foreground text-xs">{config.description}</span>
                  </div>
                </SelectItem>
              )
            })
          )}
        </SelectContent>
      </Select>
      {value && <RolePermissionPreview role={value as UserRole} />}
    </div>
  )
}

export { getLevelBadge }
