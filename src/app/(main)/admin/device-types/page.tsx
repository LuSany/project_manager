'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, Plus, Pencil, Trash2, Wrench, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

interface DeviceType {
  id: string
  name: string
  modelName?: string
  location?: string
  description?: string
  owner?: string
  createdAt: string
}

export default function DeviceTypesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [editingType, setEditingType] = useState<DeviceType | null>(null)
  const [form, setForm] = useState({
    name: '',
    modelName: '',
    location: '',
    description: '',
    owner: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const queryClient = useQueryClient()

  const { data: deviceTypes, isLoading } = useQuery({
    queryKey: ['device-types'],
    queryFn: async () => {
      const res = await fetch('/api/v1/device-types?pageSize=100')
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data.items as DeviceType[]
    },
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/v1/device-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device-types'] })
      setOpen(false)
      resetForm()
      toast({ title: '创建成功', description: '设备类型已创建' })
    },
    onError: (error: Error) => {
      toast({ title: '创建失败', description: error.message, variant: 'destructive' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingType) return
      const res = await fetch(`/api/v1/device-types/${editingType.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device-types'] })
      setEditingType(null)
      resetForm()
      toast({ title: '更新成功', description: '设备类型已更新' })
    },
    onError: (error: Error) => {
      toast({ title: '更新失败', description: error.message, variant: 'destructive' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/device-types/${id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device-types'] })
      toast({ title: '删除成功', description: '设备类型已删除' })
    },
    onError: (error: Error) => {
      toast({ title: '删除失败', description: error.message, variant: 'destructive' })
    },
  })

  const resetForm = () => {
    setForm({ name: '', modelName: '', location: '', description: '', owner: '' })
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast({ title: '验证失败', description: '类型名称不能为空', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      if (editingType) {
        await updateMutation.mutateAsync()
      } else {
        await createMutation.mutateAsync()
      }
    } finally {
      setSubmitting(false)
    }
  }

  const openEditDialog = (type: DeviceType) => {
    setEditingType(type)
    setForm({
      name: type.name,
      modelName: type.modelName || '',
      location: type.location || '',
      description: type.description || '',
      owner: type.owner || '',
    })
  }

  const handleDelete = async (type: DeviceType) => {
    if (confirm(`确定要删除设备类型「${type.name}」吗？`)) {
      await deleteMutation.mutateAsync(type.id)
    }
  }

  const isDialogOpen = open || !!editingType
  const closeDialog = () => {
    setOpen(false)
    setEditingType(null)
    resetForm()
  }

  return (
    <div className="space-y-6 p-6">
      <Button variant="ghost" onClick={() => router.back()} className="mb-2">
        <ArrowLeft className="mr-2 h-4 w-4" />
        返回
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              设备类型管理
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={(v) => v ? setOpen(true) : closeDialog()}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  添加设备类型
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingType ? '编辑设备类型' : '添加设备类型'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">类型名称 *</label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="如：高性能服务器"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">型号</label>
                    <Input
                      value={form.modelName}
                      onChange={(e) => setForm({ ...form, modelName: e.target.value })}
                      placeholder="如：Dell PowerEdge R740"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">位置</label>
                    <Input
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      placeholder="如：机房A-机柜01"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">负责人</label>
                    <Input
                      value={form.owner}
                      onChange={(e) => setForm({ ...form, owner: e.target.value })}
                      placeholder="如：张三"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">描述</label>
                    <Input
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="设备类型描述"
                    />
                  </div>
                  <Button
                    onClick={handleSubmit}
                    disabled={!form.name || submitting}
                    className="w-full"
                  >
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {submitting ? '保存中...' : '保存'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead>型号</TableHead>
                  <TableHead>位置</TableHead>
                  <TableHead>负责人</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead className="w-24">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deviceTypes?.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell className="font-medium">{type.name}</TableCell>
                    <TableCell>{type.modelName || '-'}</TableCell>
                    <TableCell>{type.location || '-'}</TableCell>
                    <TableCell>{type.owner || '-'}</TableCell>
                    <TableCell>{type.description || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditDialog(type)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(type)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {deviceTypes?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      暂无设备类型，点击上方按钮创建
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}