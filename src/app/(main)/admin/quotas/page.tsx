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
import { ArrowLeft, Plus, Pencil, Trash2, PieChart, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

interface Quota {
  id: string
  projectId: string
  totalHours: number
  period: string
  warningSent50: boolean
  warningSent80: boolean
  warningSent100: boolean
  subItems: QuotaSubItem[]
  createdAt: string
  updatedAt: string
  projectName: string
}

interface QuotaSubItem {
  id: string
  quotaId: string
  deviceTypeId: string
  subHours: number
  deviceTypeName: string
}

interface Project {
  id: string
  name: string
}

interface DeviceType {
  id: string
  name: string
}

export default function QuotasPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [editingQuota, setEditingQuota] = useState<Quota | null>(null)
  const [form, setForm] = useState({
    projectId: '',
    totalHours: 100,
    period: 'MONTHLY',
    subItems: [] as { deviceTypeId: string; subHours: number }[],
  })
  const [submitting, setSubmitting] = useState(false)

  const queryClient = useQueryClient()

  const { data: quotas, isLoading } = useQuery({
    queryKey: ['quotas'],
    queryFn: async () => {
      const res = await fetch('/api/v1/quotas')
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data as Quota[]
    },
  })

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch('/api/v1/projects?pageSize=100')
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return (json.data?.items || json.data?.data || json.data) as Project[]
    },
  })

  const { data: deviceTypes } = useQuery({
    queryKey: ['device-types'],
    queryFn: async () => {
      const res = await fetch('/api/v1/device-types?pageSize=100')
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return (json.data?.items || json.data?.data || json.data) as DeviceType[]
    },
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/v1/quotas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotas'] })
      setOpen(false)
      resetForm()
      toast({ title: '创建成功', description: '配额已创建' })
    },
    onError: (error: Error) => {
      toast({ title: '创建失败', description: error.message, variant: 'destructive' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingQuota) return
      const res = await fetch(`/api/v1/quotas/${editingQuota.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalHours: form.totalHours,
          period: form.period,
          subItems: form.subItems,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotas'] })
      setEditingQuota(null)
      resetForm()
      toast({ title: '更新成功', description: '配额已更新' })
    },
    onError: (error: Error) => {
      toast({ title: '更新失败', description: error.message, variant: 'destructive' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/quotas/${id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotas'] })
      toast({ title: '删除成功', description: '配额已删除' })
    },
    onError: (error: Error) => {
      toast({ title: '删除失败', description: error.message, variant: 'destructive' })
    },
  })

  const resetForm = () => {
    setForm({
      projectId: '',
      totalHours: 100,
      period: 'MONTHLY',
      subItems: [],
    })
  }

  const handleSubmit = async () => {
    if (!form.projectId) {
      toast({ title: '验证失败', description: '请选择项目', variant: 'destructive' })
      return
    }
    if (form.totalHours <= 0) {
      toast({ title: '验证失败', description: '总配额必须大于 0', variant: 'destructive' })
      return
    }
    // Validate subItems
    const subTotal = form.subItems.reduce((sum, item) => sum + item.subHours, 0)
    if (subTotal > form.totalHours) {
      toast({
        title: '验证失败',
        description: `子配额总和(${subTotal})不能超过总配额(${form.totalHours})`,
        variant: 'destructive',
      })
      return
    }
    setSubmitting(true)
    try {
      if (editingQuota) {
        await updateMutation.mutateAsync()
      } else {
        await createMutation.mutateAsync()
      }
    } finally {
      setSubmitting(false)
    }
  }

  const openEditDialog = (quota: Quota) => {
    setEditingQuota(quota)
    setForm({
      projectId: quota.projectId,
      totalHours: quota.totalHours,
      period: quota.period,
      subItems: quota.subItems.map((item) => ({
        deviceTypeId: item.deviceTypeId,
        subHours: item.subHours,
      })),
    })
  }

  const handleDelete = async (quota: Quota) => {
    if (confirm(`确定要删除项目「${quota.projectName}」的配额吗？`)) {
      await deleteMutation.mutateAsync(quota.id)
    }
  }

  const addSubItem = () => {
    setForm((prev) => ({
      ...prev,
      subItems: [...prev.subItems, { deviceTypeId: '', subHours: 0 }],
    }))
  }

  const removeSubItem = (index: number) => {
    setForm((prev) => ({
      ...prev,
      subItems: prev.subItems.filter((_, i) => i !== index),
    }))
  }

  const updateSubItem = (index: number, field: 'deviceTypeId' | 'subHours', value: string | number) => {
    setForm((prev) => {
      const newSubItems = [...prev.subItems]
      newSubItems[index] = { ...newSubItems[index], [field]: value }
      return { ...prev, subItems: newSubItems }
    })
  }

  const getSubItemsSummary = (subItems: QuotaSubItem[]) => {
    if (subItems.length === 0) return '-'
    return subItems.map((item) => `${item.deviceTypeName}: ${item.subHours}h`).join(', ')
  }

  const isDialogOpen = open || !!editingQuota
  const closeDialog = () => {
    setOpen(false)
    setEditingQuota(null)
    resetForm()
  }

  // 获取未被配置的项目（用于创建时）
  const availableProjects = projects?.filter(
    (p) => !quotas?.some((q) => q.projectId === p.id)
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
              <PieChart className="h-5 w-5" />
              配额管理
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={(v) => v ? setOpen(true) : closeDialog()}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  设置配额
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingQuota ? '编辑配额' : '设置项目配额'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">项目 *</label>
                    <Select
                      value={form.projectId}
                      onValueChange={(v) => setForm({ ...form, projectId: v })}
                      disabled={!!editingQuota} // 编辑时不允许更换项目
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择项目" />
                      </SelectTrigger>
                      <SelectContent>
                        {(editingQuota ? projects : availableProjects)?.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {editingQuota && (
                      <p className="text-muted-foreground text-xs mt-1">编辑时不可更改项目</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium">总配额（小时）*</label>
                    <Input
                      type="number"
                      min={0.1}
                      step={0.1}
                      value={form.totalHours}
                      onChange={(e) => setForm({ ...form, totalHours: parseFloat(e.target.value) || 0 })}
                    />
                    <p className="text-muted-foreground text-xs mt-1">项目每月可使用的总机时配额</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium">周期</label>
                    <Select
                      value={form.period}
                      onValueChange={(v) => setForm({ ...form, period: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MONTHLY">月度</SelectItem>
                        <SelectItem value="QUARTERLY">季度</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">子配额（按设备类型）</label>
                      <Button size="sm" variant="outline" onClick={addSubItem}>
                        添加子配额
                      </Button>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      可为不同设备类型分配独立配额，子配额总和不能超过总配额
                    </p>

                    {form.subItems.length > 0 && (
                      <div className="space-y-2">
                        {form.subItems.map((item, index) => (
                          <div key={index} className="flex items-center gap-2 border rounded-md p-2">
                            <Select
                              value={item.deviceTypeId}
                              onValueChange={(v) => updateSubItem(index, 'deviceTypeId', v)}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue placeholder="选择设备类型" />
                              </SelectTrigger>
                              <SelectContent>
                                {deviceTypes?.map((dt) => (
                                  <SelectItem key={dt.id} value={dt.id}>
                                    {dt.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              type="number"
                              min={0.1}
                              step={0.1}
                              placeholder="小时数"
                              value={item.subHours}
                              onChange={(e) => updateSubItem(index, 'subHours', parseFloat(e.target.value) || 0)}
                              className="w-20"
                            />
                            <span className="text-sm">小时</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeSubItem(index)}
                              className="text-destructive hover:text-destructive"
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                        <div className="text-sm text-muted-foreground">
                          子配额总和: {form.subItems.reduce((sum, item) => sum + item.subHours, 0)} 小时
                          {form.subItems.reduce((sum, item) => sum + item.subHours, 0) > form.totalHours && (
                            <span className="text-destructive ml-2">（超出总配额！）</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleSubmit}
                    disabled={!form.projectId || form.totalHours <= 0 || submitting}
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
                  <TableHead>项目</TableHead>
                  <TableHead>总配额</TableHead>
                  <TableHead>周期</TableHead>
                  <TableHead>子配额</TableHead>
                  <TableHead>预警状态</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="w-24">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotas?.map((quota) => (
                  <TableRow key={quota.id}>
                    <TableCell className="font-medium">{quota.projectName}</TableCell>
                    <TableCell>{quota.totalHours} 小时</TableCell>
                    <TableCell>{quota.period === 'MONTHLY' ? '月度' : '季度'}</TableCell>
                    <TableCell className="max-w-xs truncate">{getSubItemsSummary(quota.subItems)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {quota.warningSent50 && (
                          <span className="bg-yellow-100 text-yellow-800 rounded px-1 text-xs">50%</span>
                        )}
                        {quota.warningSent80 && (
                          <span className="bg-orange-100 text-orange-800 rounded px-1 text-xs">80%</span>
                        )}
                        {quota.warningSent100 && (
                          <span className="bg-red-100 text-red-800 rounded px-1 text-xs">100%</span>
                        )}
                        {!quota.warningSent50 && !quota.warningSent80 && !quota.warningSent100 && (
                          <span className="text-muted-foreground text-xs">正常</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(quota.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditDialog(quota)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(quota)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {quotas?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      暂无配额配置，点击上方按钮创建
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