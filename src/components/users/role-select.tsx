'use client'

import * as React from 'react'
import { Shield, Users, Crown, Briefcase, User } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// 角色配置
const ROLE_CONFIG = {
  ADMIN: {
    label: '系统管理员',
    icon: Shield,
    description: '拥有系统所有权限，可管理所有项目和用户',
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200',
  },
  PROJECT_ADMIN: {
    label: '项目管理员',
    icon: Crown,
    description: '拥有项目管理员权限，可管理项目成员和设置',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200',
  },
  PROJECT_OWNER: {
    label: '项目所有者',
    icon: Users,
    description: '项目的创建者，拥有项目完整权限',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
  },
  PROJECT_MEMBER: {
    label: '项目成员',
    icon: User,
    description: '普通项目成员，可参与项目任务和讨论',
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
  },
  EMPLOYEE: {
    label: '普通员工',
    icon: Briefcase,
    description: '普通员工，可查看参与的项目信息',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 border-gray-200',
  },
} as const

export type UserRole = keyof typeof ROLE_CONFIG

interface RoleSelectProps {
  value?: string
  onValueChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  showDescription?: boolean
}

export function RoleSelect({
  value,
  onValueChange,
  disabled = false,
  placeholder = '选择角色',
  showDescription = true,
}: RoleSelectProps) {
  const selectedConfig = value ? ROLE_CONFIG[value as UserRole] : null
  const SelectedIcon = selectedConfig?.icon

  return (
    <div className="space-y-2">
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder}>
            {selectedConfig && (
              <div className="flex items-center gap-2">
                <SelectedIcon className={`h-4 w-4 ${selectedConfig.color}`} />
                <span className={selectedConfig.color}>{selectedConfig.label}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(ROLE_CONFIG).map(([role, config]) => {
            const Icon = config.icon
            return (
              <SelectItem key={role} value={role}>
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${config.color}`} />
                  <span className={config.color}>{config.label}</span>
                </div>
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>

      {showDescription && selectedConfig && (
        <div
          className={`flex items-start gap-2 rounded-md border p-3 text-sm ${selectedConfig.bgColor}`}
        >
          <SelectedIcon className={`mt-0.5 h-4 w-4 flex-shrink-0 ${selectedConfig.color}`} />
          <p className="text-gray-700">{selectedConfig.description}</p>
        </div>
      )}
    </div>
  )
}

// 导出角色配置供其他组件使用
export { ROLE_CONFIG }
