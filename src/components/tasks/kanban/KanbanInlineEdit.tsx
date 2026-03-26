'use client'

import * as React from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { UserPlus, Check } from 'lucide-react'

// ============================================================================
// 类型定义
// ============================================================================

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface Assignee {
  user: {
    id: string
    name: string
    email: string
  }
}

interface PriorityInlineEditProps {
  priority: TaskPriority
  taskId: string
  onUpdate: (taskId: string, data: { priority: TaskPriority }) => void
}

interface AssigneeInlineEditProps {
  assignees: Assignee[] | undefined
  projectId: string
  taskId: string
  onUpdate: (taskId: string, data: { assigneeIds: string[] }) => void
}

// ============================================================================
// 常量配置
// ============================================================================

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; badgeClass: string }[] = [
  { value: 'LOW', label: '低', badgeClass: 'bg-gray-100 text-gray-800 hover:bg-gray-200' },
  { value: 'MEDIUM', label: '中', badgeClass: 'bg-blue-100 text-blue-800 hover:bg-blue-200' },
  { value: 'HIGH', label: '高', badgeClass: 'bg-orange-100 text-orange-800 hover:bg-orange-200' },
  { value: 'CRITICAL', label: '紧急', badgeClass: 'bg-red-100 text-red-800 hover:bg-red-200' },
]

const getPriorityBadgeClass = (priority: TaskPriority): string => {
  const option = PRIORITY_OPTIONS.find((opt) => opt.value === priority)
  return option?.badgeClass || 'bg-gray-100 text-gray-800'
}

const getPriorityLabel = (priority: TaskPriority): string => {
  const option = PRIORITY_OPTIONS.find((opt) => opt.value === priority)
  return option?.label || priority
}

// ============================================================================
// PriorityInlineEdit 组件
// ============================================================================

export function PriorityInlineEdit({
  priority,
  taskId,
  onUpdate,
}: PriorityInlineEditProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (value: TaskPriority) => {
    onUpdate(taskId, { priority: value })
    setOpen(false)
  }

  const currentLabel = getPriorityLabel(priority)
  const badgeClass = getPriorityBadgeClass(priority)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={currentLabel}
          className="min-h-[44px] min-w-[44px] cursor-pointer touch-manipulation"
        >
          <Badge
            variant="secondary"
            className={cn('text-xs transition-transform duration-200', badgeClass)}
          >
            {currentLabel}
          </Badge>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-2" align="start">
        <div className="space-y-1">
          {PRIORITY_OPTIONS.map((option) => (
            <button
              key={option.value}
              role="option"
              aria-selected={option.value === priority}
              className={cn(
                'flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm',
                'hover:bg-accent hover:text-accent-foreground',
                option.value === priority && 'bg-accent'
              )}
              onClick={() => handleSelect(option.value)}
            >
              <span>{option.label}</span>
              {option.value === priority && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ============================================================================
// AssigneeInlineEdit 组件
// ============================================================================

interface ProjectMember {
  id: string
  name: string
  email: string
}

export function AssigneeInlineEdit({
  assignees,
  projectId,
  taskId,
  onUpdate,
}: AssigneeInlineEditProps) {
  const [open, setOpen] = React.useState(false)
  const [members, setMembers] = React.useState<ProjectMember[]>([])
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(
    new Set(assignees?.map((a) => a.user.id) || [])
  )
  const [isLoading, setIsLoading] = React.useState(false)

  // 加载项目成员
  React.useEffect(() => {
    if (open && members.length === 0 && !isLoading) {
      setIsLoading(true)
      fetch(`/api/v1/projects/${projectId}/members`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data?.members) {
            setMembers(data.data.members)
          }
        })
        .catch((err) => console.error('获取项目成员失败:', err))
        .finally(() => setIsLoading(false))
    }
  }, [open, projectId, members.length, isLoading])

  // 同步 assignees 变化
  React.useEffect(() => {
    setSelectedIds(new Set(assignees?.map((a) => a.user.id) || []))
  }, [assignees])

  const handleToggle = (userId: string) => {
    const newSelectedIds = new Set(selectedIds)
    if (newSelectedIds.has(userId)) {
      newSelectedIds.delete(userId)
    } else {
      newSelectedIds.add(userId)
    }
    setSelectedIds(newSelectedIds)
    onUpdate(taskId, { assigneeIds: Array.from(newSelectedIds) })
  }

  const displayAssignees = assignees?.slice(0, 3) || []
  const remainingCount = (assignees?.length || 0) - 3

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={assignees && assignees.length > 0 ? '负责人' : '添加负责人'}
          className="min-h-[44px] min-w-[44px] cursor-pointer touch-manipulation"
        >
          {assignees && assignees.length > 0 ? (
            <div className="flex -space-x-1">
              {displayAssignees.map((assignee) => (
                <Avatar
                  key={assignee.user.id}
                  className="h-6 w-6 border-2 border-background"
                >
                  <AvatarFallback className="bg-primary/10 text-xs font-medium">
                    {assignee.user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {remainingCount > 0 && (
                <div className="bg-muted border-background flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs">
                  +{remainingCount}
                </div>
              )}
            </div>
          ) : (
            <div className="text-muted-foreground hover:text-foreground transition-colors">
              <UserPlus className="h-5 w-5" />
            </div>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <div className="space-y-1">
          {isLoading ? (
            <div className="text-muted-foreground px-3 py-2 text-sm">加载中...</div>
          ) : members.length === 0 ? (
            <div className="text-muted-foreground px-3 py-2 text-sm">暂无成员</div>
          ) : (
            members.map((member) => (
              <button
                key={member.id}
                role="option"
                aria-selected={selectedIds.has(member.id)}
                aria-label={member.name}
                className={cn(
                  'flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm',
                  'hover:bg-accent hover:text-accent-foreground',
                  selectedIds.has(member.id) && 'bg-accent'
                )}
                onClick={() => handleToggle(member.id)}
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-primary/10 text-xs font-medium">
                      {member.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{member.name}</span>
                </div>
                {selectedIds.has(member.id) && <Check className="h-4 w-4" />}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}