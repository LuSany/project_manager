'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api } from '@/lib/api/client'
import { Loader2, Save, ArrowLeft, Home } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Project {
  id: string
  name: string
  description?: string
  status: string
  startDate?: string
  endDate?: string
  owner: {
    id: string
    name: string
    email: string
  }
}

const statusOptions = [
  { value: 'PLANNING', label: '计划中' },
  { value: 'ACTIVE', label: '进行中' },
  { value: 'ON_HOLD', label: '暂停' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'CANCELLED', label: '已取消' },
]

export default function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'PLANNING',
    startDate: '',
    endDate: '',
  })

  useEffect(() => {
    params.then((p) => {
      fetchProject(p.id)
    })
  }, [params])

  const fetchProject = async (projectId: string) => {
    try {
      const response = await api.get(`/projects/${projectId}`)
      const data = (response as { data?: Project }).data
      if (data) {
        setProject(data)
        setFormData({
          name: data.name,
          description: data.description || '',
          status: data.status,
          startDate: data.startDate ? data.startDate.split('T')[0] : '',
          endDate: data.endDate ? data.endDate.split('T')[0] : '',
        })
      }
    } catch (error) {
      console.error('获取项目失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put(`/projects/${project?.id}`, {
        ...formData,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
      })
      toast({
        title: '保存成功',
        description: '项目设置已更新',
      })
    } catch (error) {
      toast({
        title: '保存失败',
        description: '请稍后重试',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 返回导航 */}
      <div className="flex items-center gap-2">
        <Link href={`/projects/${project?.id}`}>
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            返回项目
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="gap-1">
            <Home className="h-4 w-4" />
            工作台
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold">项目设置</h1>
        <p className="text-muted-foreground">管理项目基本信息和配置</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
          <CardDescription>项目的基本信息和状态</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">项目名称</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">项目描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">项目状态</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">开始日期</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">结束日期</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    保存更改
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>项目信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">项目所有者</p>
              <p className="font-medium">{project?.owner?.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">所有者邮箱</p>
              <p className="font-medium">{project?.owner?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}