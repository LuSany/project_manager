'use client'

import { useState, useRef } from 'react'
import Papa from 'papaparse'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Loader2, Download, Upload, FileText, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const importUserSchema = z.object({
  name: z.string().min(1, '姓名不能为空'),
  email: z.string().email('邮箱格式不正确'),
  role: z
    .enum(['ADMIN', 'PROJECT_ADMIN', 'PROJECT_OWNER', 'PROJECT_MEMBER', 'EMPLOYEE'])
    .optional(),
  department: z.string().optional(),
})

const roleLabels: Record<string, string> = {
  ADMIN: '系统管理员',
  PROJECT_ADMIN: '项目管理员',
  PROJECT_OWNER: '项目所有者',
  PROJECT_MEMBER: '项目成员',
  EMPLOYEE: '普通员工',
}

interface CSVImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface ParsedUser {
  name: string
  email: string
  role?: string
  department?: string
}

export function CSVImportDialog({ open, onOpenChange, onSuccess }: CSVImportDialogProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [parsedUsers, setParsedUsers] = useState<ParsedUser[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [importing, setImporting] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // 验证文件大小（5MB）
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast({
        title: '文件过大',
        description: '文件大小不能超过5MB',
        variant: 'destructive',
      })
      return
    }

    // 验证文件类型
    if (!selectedFile.name.endsWith('.csv')) {
      toast({
        title: '文件格式错误',
        description: '请上传CSV格式的文件',
        variant: 'destructive',
      })
      return
    }

    setFile(selectedFile)

    // 解析CSV文件
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as ParsedUser[]

        // 验证数据
        const errors: string[] = []
        const validUsers: ParsedUser[] = []

        data.forEach((row, index) => {
          const result = importUserSchema.safeParse(row)

          if (result.success) {
            validUsers.push(row)
          } else {
            errors.push(`第${index + 2}行: ${result.error.issues.map((e) => e.message).join(', ')}`)
          }
        })

        if (validUsers.length === 0) {
          toast({
            title: '数据验证失败',
            description: '没有有效的用户数据',
            variant: 'destructive',
          })
          setFile(null)
          setParsedUsers([])
        }

        setParsedUsers(validUsers)
        setValidationErrors(errors)

        if (errors.length > 0) {
          toast({
            title: '数据验证',
            description: `发现 ${errors.length} 个错误`,
            variant: 'destructive',
          })
        }
      },
      error: (error) => {
        toast({
          title: '解析失败',
          description: error.message,
          variant: 'destructive',
        })
        setFile(null)
      },
    })
  }

  const handleDownloadTemplate = () => {
    const template =
      'name,email,role,department\n张三,zhangsan@example.com,EMPLOYEE,技术部\n李四,lisi@example.com,PROJECT_MEMBER,产品部'

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = '用户导入模板.csv'
    link.click()
  }

  const handleImport = async () => {
    if (parsedUsers.length === 0) {
      toast({
        title: '没有可导入的数据',
        description: '请选择有效的CSV文件',
        variant: 'destructive',
      })
      return
    }

    setImporting(true)

    try {
      const response = await fetch('/api/v1/admin/users/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: parsedUsers }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: '导入成功',
          description: `成功导入 ${data.data.imported} 个用户，跳过 ${data.data.skipped} 个`,
          variant: 'success',
        })
        onSuccess()
        handleClose()
      } else {
        toast({
          title: '导入失败',
          description: data.error?.message || '导入用户失败',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: '导入失败',
        description: '网络错误，请重试',
        variant: 'destructive',
      })
    } finally {
      setImporting(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setParsedUsers([])
    setValidationErrors([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex max-h-[80vh] flex-col overflow-hidden sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>批量导入用户</DialogTitle>
          <DialogDescription>上传CSV文件批量导入用户，可导入最多100个用户</DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto py-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              下载模板
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1"
            >
              <Upload className="mr-2 h-4 w-4" />
              上传CSV文件
            </Button>
          </div>

          <Input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />

          {file && (
            <div className="bg-muted flex items-center gap-2 rounded-lg p-3">
              <FileText className="text-muted-foreground h-4 w-4" />
              <span className="flex-1 truncate text-sm">{file.name}</span>
              <Badge variant="outline">{parsedUsers.length} 条数据</Badge>
            </div>
          )}

          {validationErrors.length > 0 && (
            <div className="bg-destructive/10 border-destructive/20 rounded-lg border p-3">
              <div className="flex items-start gap-2 text-sm">
                <AlertCircle className="text-destructive mt-0.5 h-4 w-4 flex-shrink-0" />
                <div className="flex-1 space-y-1">
                  <p className="text-destructive font-medium">数据验证错误</p>
                  {validationErrors.slice(0, 5).map((error, index) => (
                    <p key={index} className="text-destructive/80">
                      {error}
                    </p>
                  ))}
                  {validationErrors.length > 5 && (
                    <p className="text-destructive/60">
                      还有 {validationErrors.length - 5} 个错误...
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {parsedUsers.length > 0 && (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>姓名</TableHead>
                    <TableHead>邮箱</TableHead>
                    <TableHead>角色</TableHead>
                    <TableHead>部门</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedUsers.slice(0, 5).map((user, index) => (
                    <TableRow key={index}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role ? roleLabels[user.role] || user.role : '-'}</TableCell>
                      <TableCell>{user.department || '-'}</TableCell>
                    </TableRow>
                  ))}
                  {parsedUsers.length > 5 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-muted-foreground text-center">
                        还有 {parsedUsers.length - 5} 条数据...
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={importing}>
            取消
          </Button>
          <Button onClick={handleImport} disabled={parsedUsers.length === 0 || importing}>
            {importing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                导入中...
              </>
            ) : (
              `导入 ${parsedUsers.length} 个用户`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
