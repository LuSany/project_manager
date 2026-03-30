'use client'

import { useQuery } from '@tanstack/react-query'
import { Monitor, Pencil, Trash2, Eye } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useDeviceStore, DeviceStatus } from '@/stores/deviceStore'
import Link from 'next/link'

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

interface Device {
  id: string
  name: string
  status: DeviceStatus
  device_types: {
    id: string
    name: string
    modelName: string | null
    location: string | null
    owner: string | null
  }
}

export function DeviceTable() {
  const { filters, page, pageSize } = useDeviceStore()

  const { data, isLoading } = useQuery({
    queryKey: ['devices', filters, page, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.status) params.set('status', filters.status)
      if (filters.typeId) params.set('typeId', filters.typeId)
      if (filters.name) params.set('name', filters.name)
      params.set('page', String(page))
      params.set('pageSize', String(pageSize))

      const res = await fetch(`/api/v1/devices?${params}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data
    },
  })

  if (isLoading) {
    return <div className="p-4">加载中...</div>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>设备名称</TableHead>
          <TableHead>型号</TableHead>
          <TableHead>位置</TableHead>
          <TableHead>状态</TableHead>
          <TableHead>负责人</TableHead>
          <TableHead className="w-[100px]">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data?.items?.map((device: Device) => (
          <TableRow key={device.id}>
            <TableCell className="font-medium">{device.name}</TableCell>
            <TableCell>{device.device_types.modelName || '-'}</TableCell>
            <TableCell>{device.device_types.location || '-'}</TableCell>
            <TableCell>
              <Badge className={statusColors[device.status]}>{statusLabels[device.status]}</Badge>
            </TableCell>
            <TableCell>{device.device_types.owner || '-'}</TableCell>
            <TableCell>
              <div className="flex gap-1">
                <Link href={`/devices/${device.id}`}>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
                <Button variant="ghost" size="sm">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
