'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus, Info, Wrench, MapPin, User } from 'lucide-react'
import Link from 'next/link'

export function DeviceCreateDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [typeId, setTypeId] = useState('')
  const [selectedType, setSelectedType] = useState<any>(null)
  const queryClient = useQueryClient()

  const { data: deviceTypes, isLoading: isLoadingTypes } = useQuery({
    queryKey: ['device-types'],
    queryFn: async () => {
      const res = await fetch('/api/v1/device-types?pageSize=100')
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data.items
    },
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/v1/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, typeId }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      setOpen(false)
      setName('')
      setTypeId('')
      setSelectedType(null)
    },
  })

  const handleTypeChange = (value: string) => {
    setTypeId(value)
    const type = deviceTypes?.find((t: any) => t.id === value)
    setSelectedType(type)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          添加设备
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>添加设备</DialogTitle>
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
            <Select value={typeId} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="选择设备类型" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingTypes ? (
                  <div className="p-4 text-center text-muted-foreground">加载中...</div>
                ) : deviceTypes?.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <p>暂无设备类型</p>
                    <p className="text-xs mt-1">请先创建设备类型</p>
                  </div>
                ) : (
                  deviceTypes?.map((type: any) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {/* 空状态提示 */}
            {!isLoadingTypes && deviceTypes?.length === 0 && (
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                <Info className="h-4 w-4" />
                <span>需要先创建设备类型才能添加设备。</span>
                <Link href="/admin/device-types" className="text-primary underline">
                  前往创建
                </Link>
              </div>
            )}

            {/* 选中后展示设备类型详情 */}
            {selectedType && (
              <div className="mt-3 p-3 bg-muted/50 rounded-md space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Wrench className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">型号:</span>
                  <span>{selectedType.modelName || '-'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">位置:</span>
                  <span>{selectedType.location || '-'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">负责人:</span>
                  <span>{selectedType.owner || '-'}</span>
                </div>
              </div>
            )}
          </div>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!name || !typeId || createMutation.isPending || isLoadingTypes}
          >
            {createMutation.isPending ? '创建中...' : '创建'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
