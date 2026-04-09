'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { DeviceStatus } from '@/stores/deviceStore'

const statusOptions: { value: DeviceStatus; label: string }[] = [
  { value: 'AVAILABLE', label: '可用' },
  { value: 'RESERVED', label: '已预约' },
  { value: 'IN_USE', label: '使用中' },
  { value: 'MAINTENANCE', label: '维护中' },
  { value: 'DISABLED', label: '已停用' },
]

interface DeviceEditDialogProps {
  device: {
    id: string
    name: string
    status: DeviceStatus
    typeId: string
    device_types: {
      id: string
      name: string
      modelName: string | null
      location: string | null
      owner: string | null
    }
  }
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeviceEditDialog({ device, open, onOpenChange }: DeviceEditDialogProps) {
  const [name, setName] = useState(device.name)
  const [typeId, setTypeId] = useState(device.typeId)
  const [status, setStatus] = useState<DeviceStatus>(device.status)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: deviceTypes } = useQuery({
    queryKey: ['device-types'],
    queryFn: async () => {
      const res = await fetch('/api/v1/device-types?pageSize=100')
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data.items
    },
  })

  useEffect(() => {
    setName(device.name)
    setTypeId(device.typeId)
    setStatus(device.status)
  }, [device])

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/devices/${device.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, typeId, status }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device', device.id] })
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      toast({ title: '更新成功', description: '设备信息已更新', variant: 'success' })
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast({ title: '更新失败', description: error.message, variant: 'destructive' })
    },
  })

  const handleSave = () => {
    if (!name.trim()) {
      toast({ title: '验证失败', description: '设备名称不能为空', variant: 'destructive' })
      return
    }
    updateMutation.mutate()
  }

  const selectedType = deviceTypes?.find((t: any) => t.id === typeId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>编辑设备</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">设备名称</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入设备名称"
            />
          </div>
          <div>
            <label className="text-sm font-medium">设备类型</label>
            <Select value={typeId} onValueChange={setTypeId}>
              <SelectTrigger>
                <SelectValue placeholder="选择设备类型" />
              </SelectTrigger>
              <SelectContent>
                {deviceTypes?.map((type: any) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedType && (
              <div className="mt-2 text-sm text-muted-foreground">
                型号: {selectedType.modelName || '-'} | 位置: {selectedType.location || '-'}
              </div>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">状态</label>
            <Select value={status} onValueChange={(v) => setStatus(v as DeviceStatus)}>
              <SelectTrigger>
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? '保存中...' : '保存'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}