'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { PermissionTree } from './components/PermissionTree'
import { PermissionEditor } from './components/PermissionEditor'
import { api } from '@/lib/api/client'

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
      const response = await api.get<any[]>('/admin/permissions')
      if ((response as { success?: boolean }).success) {
        const permissions = (response as { data?: any[] }).data || []

        const projectsMap = new Map<string, Resource>()

        for (const perm of permissions) {
          const projectId = perm.project?.id || perm.projectId
          const projectName = perm.project?.name || ''

          if (projectId && projectName) {
            if (!projectsMap.has(projectId)) {
              projectsMap.set(projectId, {
                id: projectId,
                name: projectName,
                memberCount: 0,
              })
            }
            const resource = projectsMap.get(projectId)!
            resource.memberCount += 1
          }
        }

        setResources(Array.from(projectsMap.values()))
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
            <PermissionTree
              resources={resources}
              selectedId={selectedResourceId}
              onSelect={setSelectedResourceId}
            />
          </CardContent>
        </Card>

        <Card className="min-w-0 flex-1">
          <CardContent className="p-6">
            {selectedResourceId && selectedResource ? (
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
