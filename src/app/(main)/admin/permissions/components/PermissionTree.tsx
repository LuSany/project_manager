'use client'

import { FolderKanban } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Resource {
  id: string
  name: string
  memberCount: number
}

interface PermissionTreeProps {
  resources: Resource[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function PermissionTree({ resources, selectedId, onSelect }: PermissionTreeProps) {
  return (
    <div className="space-y-2">
      {resources.map((resource) => (
        <Button
          key={resource.id}
          variant={selectedId === resource.id ? 'secondary' : 'ghost'}
          className={cn(
            'h-auto w-full justify-start gap-2 px-3 py-3',
            selectedId === resource.id && 'bg-primary/10 hover:bg-primary/15 border-primary/20'
          )}
          onClick={() => onSelect(resource.id)}
        >
          <FolderKanban className="text-muted-foreground h-4 w-4 shrink-0" />
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate font-medium">{resource.name}</p>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {resource.memberCount}
          </Badge>
        </Button>
      ))}
      {resources.length === 0 && (
        <div className="text-muted-foreground py-8 text-center text-sm">暂无项目</div>
      )}
    </div>
  )
}
