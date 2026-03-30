'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Pencil, Settings } from 'lucide-react'
import { DeviceStatus } from '@/stores/deviceStore'

const statusColors: Record<DeviceStatus, string> = {
  AVAILABLE: 'bg-green-100 text-green-800',
  RESERVED: 'bg-blue-100 text-blue-800',
  IN_USE: 'bg-amber-100 text-amber-800',
  MAINTENANCE: 'bg-orange-100 text-orange-800',
  DISABLED: 'bg-gray-100 text-gray-800',
}

const statusLabels: Record<DeviceStatus, string> = {
  AVAILABLE: '可用',
  RESERVED: '已预约',
  IN_USE: '使用中',
  MAINTENANCE: '维护中',
  DISABLED: '已停用',
}

interface DeviceDetailCardProps {
  device: {
    id: string
    name: string
    status: DeviceStatus
    device_types: {
      id: string
      name: string
      modelName: string | null
      location: string | null
      description: string | null
      owner: string | null
    }
  }
  onEdit?: () => void
  onStatusChange?: () => void
}

export function DeviceDetailCard({ device, onEdit, onStatusChange }: DeviceDetailCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">{device.name}</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={onStatusChange}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <div>
            <p className="text-muted-foreground text-sm">设备类型</p>
            <p className="font-medium">{device.device_types.name}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">型号</p>
            <p className="font-medium">{device.device_types.modelName || '-'}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">位置</p>
            <p className="font-medium">{device.device_types.location || '-'}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">负责人</p>
            <p className="font-medium">{device.device_types.owner || '-'}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">状态</p>
            <Badge className={statusColors[device.status]}>{statusLabels[device.status]}</Badge>
          </div>
          {device.device_types.description && (
            <div className="col-span-2 md:col-span-3">
              <p className="text-muted-foreground text-sm">描述</p>
              <p className="font-medium">{device.device_types.description}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
