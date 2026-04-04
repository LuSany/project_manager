'use client'

import { useQuery } from '@tanstack/react-query'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useDeviceStore, DeviceStatus } from '@/stores/deviceStore'

export function DeviceFilterBar() {
  const { filters, setFilters, clearFilters } = useDeviceStore()

  const { data: deviceTypes } = useQuery({
    queryKey: ['device-types'],
    queryFn: async () => {
      const res = await fetch('/api/v1/device-types?pageSize=100')
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data.items
    },
  })

  return (
    <div className="flex gap-4 p-4">
      <Input
        placeholder="搜索设备名称..."
        value={filters.name || ''}
        onChange={(e) => setFilters({ ...filters, name: e.target.value })}
        className="w-[200px]"
      />
      <Select
        value={filters.status || 'all'}
        onValueChange={(value) =>
          setFilters({ ...filters, status: value === 'all' ? undefined : (value as DeviceStatus) })
        }
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="状态筛选" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部状态</SelectItem>
          <SelectItem value="AVAILABLE">可用</SelectItem>
          <SelectItem value="RESERVED">已预约</SelectItem>
          <SelectItem value="IN_USE">使用中</SelectItem>
          <SelectItem value="MAINTENANCE">维护中</SelectItem>
          <SelectItem value="DISABLED">已停用</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={filters.typeId || 'all'}
        onValueChange={(value) =>
          setFilters({ ...filters, typeId: value === 'all' ? undefined : value })
        }
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="类型筛选" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部类型</SelectItem>
          {deviceTypes?.map((type: any) => (
            <SelectItem key={type.id} value={type.id}>
              {type.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="outline" onClick={clearFilters}>
        清除筛选
      </Button>
    </div>
  )
}
