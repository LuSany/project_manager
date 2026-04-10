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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Plus, Pencil, Trash2, ShieldCheck, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

interface ApprovalConfig {
  id: string
  deviceTypeId: string
  levels: number
  approverIds: string[][]
  device_types: {
    id: string
    name: string
  }
  createdAt: string
}

interface DeviceType {
  id: string
  name: string
}

interface User {
  id: string
  name: string
}

export default function ApprovalConfigsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<ApprovalConfig | null>(null)
  const [form, setForm] = useState({
    deviceTypeId: '',
    levels: 1,
    approverIds: [[]] as string[][],
  })
  const [submitting, setSubmitting] = useState(false)

  const queryClient = useQueryClient()

  const { data: configs, isLoading } = useQuery({
    queryKey: ['approval-configs'],
    queryFn: async () => {
      const res = await fetch('/api/v1/approval-configs?pageSize=100')
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data.items as ApprovalConfig[]
    },
  })

  const { data: deviceTypes } = useQuery({
    queryKey: ['device-types'],
    queryFn: async () => {
      const res = await fetch('/api/v1/device-types?pageSize=100')
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data.items as DeviceType[]
    },
  })

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch('/api/v1/users?pageSize=100')
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data.items as User[]
    },
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/v1/approval-configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceTypeId: form.deviceTypeId,
          levels: form.levels,
          approverIds: JSON.stringify(form.approverIds),
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-configs'] })
      setOpen(false)
      resetForm()
      toast({ title: '创建成功', description: '审批配置已创建' })
    },
    onError: (error: Error) => {
      toast({ title: '创建失败', description: error.message, variant: 'destructive' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingConfig) return
      const res = await fetch(`/api/v1/approval-configs/${editingConfig.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceTypeId: form.deviceTypeId,
          levels: form.levels,
          approverIds: JSON.stringify(form.approverIds),
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-configs'] })
      setEditingConfig(null)
      resetForm()
      toast({ title: '更新成功', description: '审批配置已更新' })
    },
    onError: (error: Error) => {
      toast({ title: '更新失败', description: error.message, variant: 'destructive' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/approval-configs/${id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-configs'] })
      toast({ title: '删除成功', description: '审批配置已删除' })
    },
    onError: (error: Error) => {
      toast({ title: '删除失败', description: error.message, variant: 'destructive' })
    },
  })

  const resetForm = () => {
    setForm({
      deviceTypeId: '',
      levels: 1,
      approverIds: [[]],
    })
  }

  const handleSubmit = async () => {
    if (!form.deviceTypeId) {
      toast({ title: '验证失败', description: '请选择设备类型', variant: 'destructive' })
      return
    }
    if (form.approverIds.flat().length === 0) {
      toast({ title: '验证失败', description: '请选择审批人', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      if (editingConfig) {
        await updateMutation.mutateAsync()
      } else {
        await createMutation.mutateAsync()
      }
    } finally {
      setSubmitting(false)
    }
  }

  const openEditDialog = (config: ApprovalConfig) => {
    setEditingConfig(config)
    setForm({
      deviceTypeId: config.deviceTypeId,
      levels: config.levels,
      approverIds: config.approverIds,
    })
  }

  const handleDelete = async (config: ApprovalConfig) => {
    if (confirm(`确定要删除设备类型「${config.device_types.name}」的审批配置吗？`)) {
      await deleteMutation.mutateAsync(config.id)
    }
  }

  const addApproverLevel = () => {
    setForm((prev) => ({
      ...prev,
      levels: prev.levels + 1,
      approverIds: [...prev.approverIds, []],
    }))
  }

  const removeApproverLevel = (levelIndex: number) => {
    if (levelIndex === 0) return // 不能删除第一级
    setForm((prev) => ({
      ...prev,
      levels: prev.levels - 1,
      approverIds: prev.approverIds.filter((_, i) => i !== levelIndex),
    }))
  }

  const addApproverToLevel = (levelIndex: number, userId: string) => {
    if (!userId) return
    setForm((prev) => {
      const newApproverIds = [...prev.approverIds]
      if (!newApproverIds[levelIndex].includes(userId)) {
        newApproverIds[levelIndex] = [...newApproverIds[levelIndex], userId]
      }
      return { ...prev, approverIds: newApproverIds }
    })
  }

  const removeApproverFromLevel = (levelIndex: number, userId: string) => {
    setForm((prev) => {
      const newApproverIds = [...prev.approverIds]
      newApproverIds[levelIndex] = newApproverIds[levelIndex].filter((id) => id !== userId)
      return { ...prev, approverIds: newApproverIds }
    })
  }

  const getApproverNames = (approverIds: string[][]) => {
    return approverIds.map((level, index) => {
      const names = level
        .map((id) => users?.find((u) => u.id === id)?.name || id)
        .join(', ')
      return `${index + 1}级: ${names || '未设置'}`
    }).join(' | ')
  }

  const isDialogOpen = open || !!editingConfig
  const closeDialog = () => {
    setOpen(false)
    setEditingConfig(null)
    resetForm()
  }

  // 获取未被配置的设备类型（用于创建时）
  const availableDeviceTypes = deviceTypes?.filter(
    (dt) => !configs?.some((c) => c.deviceTypeId === dt.id)
  )

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
              <ShieldCheck className="h-5 w-5" />
              审批配置管理
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={(v) => v ? setOpen(true) : closeDialog()}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  配置审批
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingConfig ? '编辑审批配置' : '配置审批流程'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">设备类型 *</label>
                    <Select
                      value={form.deviceTypeId}
                      onValueChange={(v) => setForm({ ...form, deviceTypeId: v })}
                      disabled={!!editingConfig} // 编辑时不允许更换设备类型
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择设备类型" />
                      </SelectTrigger>
                      <SelectContent>
                        {(editingConfig ? deviceTypes : availableDeviceTypes)?.map((dt) => (
                          <SelectItem key={dt.id} value={dt.id}>
                            {dt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {editingConfig && (
                      <p className="text-muted-foreground text-xs mt-1">编辑时不可更改设备类型</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium">审批级数</label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={form.levels}
                      onChange={(e) => {
                        const newLevels = parseInt(e.target.value) || 1
                        const newApproverIds = [...form.approverIds]
                        // 调整数组长度
                        while (newApproverIds.length < newLevels) {
                          newApproverIds.push([])
                        }
                        while (newApproverIds.length > newLevels) {
                          newApproverIds.pop()
                        }
                        setForm({ ...form, levels: newLevels, approverIds: newApproverIds })
                      }}
                    />
                    <p className="text-muted-foreground text-xs mt-1">设置审批需要经过多少级审批人</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">审批人配置</label>
                    {form.approverIds.map((level, levelIndex) => (
                      <div key={levelIndex} className="border rounded-md p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{levelIndex + 1}级审批人</span>
                          {levelIndex > 0 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeApproverLevel(levelIndex)}
                              className="text-destructive hover:text-destructive"
                            >
                              删除此级
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value=""
                            onValueChange={(v) => addApproverToLevel(levelIndex, v)}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="添加审批人" />
                            </SelectTrigger>
                            <SelectContent>
                              {users?.filter((u) => !level.includes(u.id)).map((u) => (
                                <SelectItem key={u.id} value={u.id}>
                                  {u.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {level.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {level.map((userId) => {
                              const user = users?.find((u) => u.id === userId)
                              return (
                                <div
                                  key={userId}
                                  className="bg-muted rounded-md px-2 py-1 text-sm flex items-center gap-1"
                                >
                                  {user?.name || userId}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-4 w-4 p-0"
                                    onClick={() => removeApproverFromLevel(levelIndex, userId)}
                                  >
                                    ×
                                  </Button>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                    <Button size="sm" variant="outline" onClick={addApproverLevel}>
                      添加审批级
                    </Button>
                  </div>

                  <Button
                    onClick={handleSubmit}
                    disabled={!form.deviceTypeId || submitting}
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
                  <TableHead>设备类型</TableHead>
                  <TableHead>审批级数</TableHead>
                  <TableHead>审批人</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="w-24">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configs?.map((config) => (
                  <TableRow key={config.id}>
                    <TableCell className="font-medium">{config.device_types.name}</TableCell>
                    <TableCell>{config.levels}级</TableCell>
                    <TableCell className="max-w-xs truncate">{getApproverNames(config.approverIds)}</TableCell>
                    <TableCell>{new Date(config.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditDialog(config)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(config)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {configs?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      暂无审批配置，点击上方按钮创建
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