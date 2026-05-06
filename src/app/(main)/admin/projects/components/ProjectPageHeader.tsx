'use client'

import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface ProjectPageHeaderProps {
  onCreateProject: () => void
}

export function ProjectPageHeader({ onCreateProject }: ProjectPageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">项目管理</h1>
        <p className="text-muted-foreground">管理系统内所有项目及其成员</p>
      </div>
      <Button onClick={onCreateProject}>
        <Plus className="mr-2 h-4 w-4" />
        创建项目
      </Button>
    </div>
  )
}