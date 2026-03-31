'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api } from '@/lib/api/client'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Clock, CheckCircle2 } from 'lucide-react'

interface Project {
  id: string
  name: string
  status: string
}

interface ScanConfig {
  scanProjects: string[]
  scanInterval: number
  isActive: boolean
}

const INTERVAL_OPTIONS = [
  { value: '4', label: '4 小时' },
  { value: '8', label: '8 小时' },
  { value: '12', label: '12 小时' },
  { value: '24', label: '24 小时' },
]

export function ScanConfigTab() {
  const { toast } = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [scanInterval, setScanInterval] = useState('8')
  const [isActive, setIsActive] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [projectsRes, configRes] = await Promise.all([
        api.get<Project[]>('/admin/projects'),
        api.get<{ config?: ScanConfig }>('/admin/ai/configs?type=scan'),
      ])

      if (projectsRes.success) {
        setProjects((projectsRes as any).data || [])
      }

      if (configRes.success && (configRes as any).data?.config) {
        const config = JSON.parse((configRes as any).data.config)
        setSelectedProjects(config.scanProjects || [])
        setScanInterval(String(config.scanInterval || 8))
        setIsActive(config.isActive || false)
      }
    } catch (error) {
      console.error('获取数据失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleProjectToggle = (projectId: string) => {
    setSelectedProjects((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId]
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const config: ScanConfig = {
        scanProjects: selectedProjects,
        scanInterval: parseInt(scanInterval),
        isActive,
      }

      const response = await api.post('/admin/ai/configs', {
        name: '定时扫描配置',
        provider: 'INTERNAL',
        config: JSON.stringify(config),
        isActive: true,
      })

      if (response.success) {
        toast({
          title: '保存成功',
          description: '扫描配置已更新',
          variant: 'success',
        })
      } else {
        toast({
          title: '保存失败',
          description: response.error?.message || '请稍后重试',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: '保存失败',
        description: '网络错误，请稍后重试',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          定时扫描配置
        </CardTitle>
        <CardDescription>
          配置自动风险扫描的项目和频率，系统将定期分析项目风险并发送通知
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">启用自动扫描</p>
              <p className="text-muted-foreground text-sm">
                开启后系统将按设定频率自动扫描项目风险
              </p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="mb-2 font-medium">扫描频率</p>
            <Select value={scanInterval} onValueChange={setScanInterval}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="选择频率" />
              </SelectTrigger>
              <SelectContent>
                {INTERVAL_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="mb-2 font-medium">参与扫描的项目</p>
            <p className="text-muted-foreground mb-3 text-sm">选择需要定期扫描风险的项目</p>
            <div className="max-h-[300px] divide-y overflow-y-auto rounded-lg border">
              {projects.length === 0 ? (
                <div className="text-muted-foreground p-8 text-center">暂无项目</div>
              ) : (
                projects.map((project) => (
                  <div
                    key={project.id}
                    className="hover:bg-muted/50 flex cursor-pointer items-center gap-3 p-3"
                    onClick={() => handleProjectToggle(project.id)}
                  >
                    <Checkbox
                      checked={selectedProjects.includes(project.id)}
                      onCheckedChange={() => handleProjectToggle(project.id)}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{project.name}</p>
                      <p className="text-muted-foreground text-sm">{project.status}</p>
                    </div>
                    {selectedProjects.includes(project.id) && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              '保存配置'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
