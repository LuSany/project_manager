'use client'

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { X, Plus, Search, User, Users } from 'lucide-react'
import type { WizardData } from '../ReviewWizard'

interface ParticipantsStepProps {
  data: Pick<WizardData, 'moderatorId' | 'reviewers' | 'observers' | 'userNames'>
  onChange: (data: Partial<WizardData>) => void
  projectId: string
}

interface Member {
  userId: string
  userName: string
  userEmail: string
  role: string
}

interface SystemUser {
  id: string
  name: string
  email: string
  avatar?: string
  department?: string
  position?: string
}

interface ReviewGroup {
  id: string
  name: string
  description?: string
  members: Array<{
    userId: string
    role: string
    user: {
      id: string
      name: string
      email: string
    }
  }>
}

export function ParticipantsStep({ data, onChange, projectId }: ParticipantsStepProps) {
  const [tab, setTab] = useState<'project' | 'system' | 'group'>('project')
  const [projectMembers, setProjectMembers] = useState<Member[]>([])
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([])
  const [reviewGroups, setReviewGroups] = useState<ReviewGroup[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)

  // 获取项目成员
  useEffect(() => {
    fetch(`/api/v1/projects/${projectId}/members`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setProjectMembers(result.data || [])
        }
      })
      .catch((err) => console.error('获取项目成员失败:', err))
  }, [projectId])

  // 获取系统用户
  const fetchSystemUsers = async (query: string = '') => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (query) params.append('search', query)
      params.append('pageSize', '50')

      const response = await fetch(`/api/v1/users?${params.toString()}`)
      const result = await response.json()
      if (result.success) {
        setSystemUsers(result.data?.data || result.data || [])
      }
    } catch (err) {
      console.error('获取系统用户失败:', err)
    } finally {
      setLoading(false)
    }
  }

  // 获取评审组
  useEffect(() => {
    fetch('/api/v1/review-groups?isActive=true')
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setReviewGroups(result.data || [])
        }
      })
      .catch((err) => console.error('获取评审组失败:', err))
  }, [])

  useEffect(() => {
    if (tab === 'system' && systemUsers.length === 0) {
      fetchSystemUsers(searchQuery)
    }
  }, [tab])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (tab === 'system') {
        fetchSystemUsers(searchQuery)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, tab])

  const handleSelectModerator = (userId: string, userName?: string) => {
    const newModeratorId = data.moderatorId === userId ? null : userId
    const newUserNames = { ...data.userNames }
    if (newModeratorId && userName) {
      newUserNames[userId] = userName
    }
    onChange({ moderatorId: newModeratorId, userNames: newUserNames })
  }

  const handleToggleReviewer = (userId: string, userName?: string) => {
    const newReviewers = data.reviewers.includes(userId)
      ? data.reviewers.filter((id) => id !== userId)
      : [...data.reviewers, userId]
    const newUserNames = { ...data.userNames }
    if (userName) {
      newUserNames[userId] = userName
    }
    onChange({ reviewers: newReviewers, userNames: newUserNames })
  }

  const handleToggleObserver = (userId: string, userName?: string) => {
    const newObservers = data.observers.includes(userId)
      ? data.observers.filter((id) => id !== userId)
      : [...data.observers, userId]
    const newUserNames = { ...data.userNames }
    if (userName) {
      newUserNames[userId] = userName
    }
    onChange({ observers: newObservers, userNames: newUserNames })
  }

  const handleAddReviewGroup = (group: ReviewGroup) => {
    const newModeratorId = group.members.find((m) => m.role === 'MODERATOR')?.userId || data.moderatorId
    const newReviewers = [...new Set([...data.reviewers, ...group.members.filter((m) => m.role === 'REVIEWER').map((m) => m.userId)])]
    const newObservers = [...new Set([...data.observers, ...group.members.filter((m) => m.role === 'OBSERVER').map((m) => m.userId)])]
    const newUserNames = { ...data.userNames }
    group.members.forEach((m) => {
      newUserNames[m.userId] = m.user.name
    })

    onChange({
      moderatorId: newModeratorId,
      reviewers: newReviewers,
      observers: newObservers,
      userNames: newUserNames,
    })
  }

  const getSelectedUserName = (userId: string) => {
    const member = projectMembers.find((m) => m.userId === userId)
    const user = systemUsers.find((u) => u.id === userId)
    return member?.userName || user?.name || userId
  }

  const renderUserItem = (user: { userId?: string; id?: string; userName?: string; name?: string; email?: string; userEmail?: string }, type: 'moderator' | 'reviewer' | 'observer') => {
    const id = user.userId || user.id || ''
    const name = user.userName || user.name || ''
    const email = user.userEmail || user.email || ''
    const isSelected = type === 'moderator'
      ? data.moderatorId === id
      : type === 'reviewer'
        ? data.reviewers.includes(id)
        : data.observers.includes(id)

    return (
      <div
        key={id}
        className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
          isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
        }`}
        onClick={() => {
          if (type === 'moderator') handleSelectModerator(id, name)
          else if (type === 'reviewer') handleToggleReviewer(id, name)
          else handleToggleObserver(id, name)
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="font-medium">{name}</div>
            <div className="text-sm text-muted-foreground">{email}</div>
          </div>
        </div>
        {isSelected && (
          <Badge variant="default">已选</Badge>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 主持人选择 */}
      <div className="space-y-2">
        <Label>主持人（单选）</Label>
        <div className="text-sm text-muted-foreground mb-2">选择评审主持人</div>
        <div className="max-h-48 overflow-y-auto space-y-2">
          {projectMembers.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">暂无项目成员</div>
          ) : (
            projectMembers.map((member) => renderUserItem(member, 'moderator'))
          )}
        </div>
      </div>

      {/* 评审人选择 */}
      <div className="space-y-2">
        <Label>评审人（多选）</Label>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="project">项目成员</TabsTrigger>
            <TabsTrigger value="system">系统用户</TabsTrigger>
            <TabsTrigger value="group">评审组</TabsTrigger>
          </TabsList>

          <TabsContent value="project" className="space-y-2 mt-4">
            <div className="max-h-48 overflow-y-auto space-y-2">
              {projectMembers.map((member) => renderUserItem(member, 'reviewer'))}
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-2 mt-4">
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索用户..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {loading ? (
                <div className="text-center py-4 text-muted-foreground">加载中...</div>
              ) : systemUsers.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">未找到用户</div>
              ) : (
                systemUsers.map((user) => renderUserItem(user, 'reviewer'))
              )}
            </div>
          </TabsContent>

          <TabsContent value="group" className="space-y-2 mt-4">
            <div className="max-h-48 overflow-y-auto space-y-2">
              {reviewGroups.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">暂无评审组</div>
              ) : (
                reviewGroups.map((group) => (
                  <div
                    key={group.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleAddReviewGroup(group)}
                  >
                    <div>
                      <div className="font-medium">{group.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {group.members.length} 名成员
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      添加
                    </Button>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* 观察者选择 */}
      <div className="space-y-2">
        <Label>观察者（多选，可选）</Label>
        <div className="max-h-32 overflow-y-auto space-y-2">
          {projectMembers.map((member) => renderUserItem(member, 'observer'))}
        </div>
      </div>

      {/* 已选人员汇总 */}
      {(data.moderatorId || data.reviewers.length > 0 || data.observers.length > 0) && (
        <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
          <Label>已选择的人员</Label>
          <div className="flex flex-wrap gap-2">
            {data.moderatorId && (
              <Badge variant="default" className="gap-1">
                主持人: {getSelectedUserName(data.moderatorId)}
                <X className="h-3 w-3 cursor-pointer" onClick={() => onChange({ moderatorId: null })} />
              </Badge>
            )}
            {data.reviewers.map((id) => (
              <Badge key={id} variant="secondary" className="gap-1">
                评审人: {getSelectedUserName(id)}
                <X className="h-3 w-3 cursor-pointer" onClick={() => handleToggleReviewer(id)} />
              </Badge>
            ))}
            {data.observers.map((id) => (
              <Badge key={id} variant="outline" className="gap-1">
                观察者: {getSelectedUserName(id)}
                <X className="h-3 w-3 cursor-pointer" onClick={() => handleToggleObserver(id)} />
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}