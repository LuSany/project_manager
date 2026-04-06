'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { PermissionTree } from './components/PermissionTree'
import { PermissionEditor } from './components/PermissionEditor'
import { api } from '@/lib/api/client'
import { ShieldCheck } from 'lucide-react'

interface Resource {
  id: string
  name: string
  memberCount: number
}

export default function PermissionsPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchResources()
  }, [])

  const fetchResources = async () => {
    setLoading(true)
    try {
      // 获取权限数据（包含项目和权限列表）
      const response = await api.get('/admin/permissions')
      if ((response as { success?: boolean }).success) {
        const data = (response as { data?: { projects?: any[]; permissions?: any[] } }).data
        const projects = data?.projects || []
        const permissions = data?.permissions || []

        // 创建成员计数映射
        const memberCountMap = new Map<string, number>()
        for (const perm of permissions) {
          const projectId = perm.project?.id || perm.projectId
          if (projectId) {
            memberCountMap.set(projectId, (memberCountMap.get(projectId) || 0) + 1)
          }
        }

        // 构建资源列表，包含所有项目
        const resourceList: Resource[] = projects.map((project) => ({
          id: project.id,
          name: project.name,
          memberCount: memberCountMap.get(project.id) || 0,
        }))

        setResources(resourceList)
      }
    } catch (error) {
      console.error('获取资源列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePermissionsChange = async () => {
    await fetchResources()
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
      </div>
    )
  }

  const selectedResource = resources.find((r) => r.id === selectedResourceId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">权限配置</h1>
        <p className="text-muted-foreground">管理项目和资源的访问权限</p>
      </div>

      <div className="flex flex-col gap-6 md:flex-row">
        <Card className="w-full shrink-0 md:w-64">
          <CardContent className="p-4">
            <h3 className="text-muted-foreground mb-3 text-sm font-medium">项目列表</h3>
            {!resources || resources.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center text-sm">暂无项目权限配置</div>
            ) : (
              <PermissionTree
                resources={resources}
                selectedId={selectedResourceId}
                onSelect={setSelectedResourceId}
              />
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0 flex-1">
          <CardContent className="p-6">
            {!resources || resources.length === 0 ? (
              <div className="text-muted-foreground flex min-h-[300px] flex-col items-center justify-center">
                <ShieldCheck className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>暂无项目权限配置</p>
                <p className="mt-2 text-sm">请先创建项目后再配置权限</p>
              </div>
            ) : selectedResourceId && selectedResource ? (
              <PermissionEditor
                resourceId={selectedResourceId}
                resourceName={selectedResource.name}
                onPermissionsChange={handlePermissionsChange}
              />
            ) : (
              <div className="text-muted-foreground flex min-h-[300px] items-center justify-center">
                请选择一个项目查看权限配置
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
