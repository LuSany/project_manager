'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { api } from '@/lib/api/client'
import { Loader2, Search, Download } from 'lucide-react'

interface AuditLog {
  id: string
  userId: string
  action: string
  entityType: string
  entityId?: string
  description?: string
  ipAddress?: string
  createdAt: string
  user: {
    name: string
    email: string
  }
}

const actionColors: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
  VIEW: 'bg-gray-100 text-gray-800',
  LOGIN: 'bg-purple-100 text-purple-800',
  LOGOUT: 'bg-gray-100 text-gray-800',
  LOGIN_FAILED: 'bg-red-100 text-red-800',
  EXPORT: 'bg-yellow-100 text-yellow-800',
  IMPORT: 'bg-yellow-100 text-yellow-800',
  PERMISSION_CHANGE: 'bg-orange-100 text-orange-800',
  ROLE_CHANGE: 'bg-orange-100 text-orange-800',
  PASSWORD_CHANGE: 'bg-purple-100 text-purple-800',
  SETTINGS_CHANGE: 'bg-blue-100 text-blue-800',
  BULK_DELETE: 'bg-red-100 text-red-800',
}

const actionLabels: Record<string, string> = {
  CREATE: '创建',
  UPDATE: '更新',
  DELETE: '删除',
  VIEW: '查看',
  LOGIN: '登录',
  LOGOUT: '登出',
  LOGIN_FAILED: '登录失败',
  EXPORT: '导出',
  IMPORT: '导入',
  PERMISSION_CHANGE: '权限变更',
  ROLE_CHANGE: '角色变更',
  PASSWORD_CHANGE: '密码修改',
  SETTINGS_CHANGE: '设置修改',
  BULK_DELETE: '批量删除',
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    fetchLogs()
  }, [actionFilter])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (actionFilter !== 'all') {
        params.append('action', actionFilter)
      }

      const response = await api.get(`/admin/audit-logs?${params.toString()}`)
      const data = (response as { data?: { logs?: AuditLog[]; total?: number } }).data
      setLogs(data?.logs || [])
      setTotalCount(data?.total || 0)
    } catch (error) {
      console.error('获取审计日志失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = logs.filter((log) => {
    if (!search) return true
    return (
      log.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      log.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
      log.description?.toLowerCase().includes(search.toLowerCase()) ||
      log.entityType?.toLowerCase().includes(search.toLowerCase())
    )
  })

  const handleExport = async () => {
    try {
      const response = await api.get('/admin/audit-logs/export')
      // 创建 CSV 下载
      const csvContent = (response as { data?: string }).data || ''
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
      link.click()
    } catch (error) {
      console.error('导出失败:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>审计日志</CardTitle>
            <CardDescription>共 {totalCount} 条操作记录</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            导出
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* 筛选栏 */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索用户或操作..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="操作类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部操作</SelectItem>
              <SelectItem value="CREATE">创建</SelectItem>
              <SelectItem value="UPDATE">更新</SelectItem>
              <SelectItem value="DELETE">删除</SelectItem>
              <SelectItem value="LOGIN">登录</SelectItem>
              <SelectItem value="LOGOUT">登出</SelectItem>
              <SelectItem value="ROLE_CHANGE">角色变更</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 日志表格 */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>时间</TableHead>
                <TableHead>用户</TableHead>
                <TableHead>操作</TableHead>
                <TableHead>对象</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>IP地址</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('zh-CN')}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{log.user?.name || '-'}</p>
                      <p className="text-xs text-muted-foreground">{log.user?.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={actionColors[log.action] || 'bg-gray-100'}>
                      {actionLabels[log.action] || log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{log.entityType}</p>
                      {log.entityId && (
                        <p className="text-xs text-muted-foreground font-mono">
                          {log.entityId.substring(0, 8)}...
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm max-w-xs truncate">{log.description || '-'}</p>
                  </TableCell>
                  <TableCell className="text-sm font-mono">
                    {log.ipAddress || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}