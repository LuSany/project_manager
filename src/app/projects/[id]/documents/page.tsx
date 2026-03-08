'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { api } from '@/lib/api/client'
import { Loader2, Upload, Download, FileText, Image, File, ArrowLeft, Home } from 'lucide-react'

interface Document {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  uploadedBy: {
    name: string
  }
  uploadedAt: string
}

const fileTypeIcons: Record<string, React.ReactNode> = {
  'application/pdf': <FileText className="h-5 w-5 text-red-500" />,
  'image/': <Image className="h-5 w-5 text-blue-500" />,
  'default': <File className="h-5 w-5 text-gray-500" />,
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return fileTypeIcons['image/']
  return fileTypeIcons[mimeType] || fileTypeIcons['default']
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export default function ProjectDocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [projectId, setProjectId] = useState<string>('')

  useEffect(() => {
    params.then((p) => {
      setProjectId(p.id)
      fetchDocuments(p.id)
    })
  }, [params])

  const fetchDocuments = async (projectId: string) => {
    try {
      const response = await api.get(`/files?projectId=${projectId}`)
      setDocuments((response as { data?: Document[] }).data || [])
    } catch (error) {
      console.error('获取文档列表失败:', error)
    } finally {
      setLoading(false)
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
    <div className="space-y-6">
      {/* 返回导航 */}
      <div className="flex items-center gap-2">
        <Link href={`/projects/${projectId}`}>
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            返回项目
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="gap-1">
            <Home className="h-4 w-4" />
            工作台
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">文档管理</h1>
          <p className="text-muted-foreground">管理项目相关文档和文件</p>
        </div>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          上传文档
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>文档列表</CardTitle>
          <CardDescription>项目相关的所有文档和文件</CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              暂无文档
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>文件名</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>大小</TableHead>
                    <TableHead>上传者</TableHead>
                    <TableHead>上传时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getFileIcon(doc.fileType)}
                          <span className="font-medium">{doc.fileName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{doc.fileType}</Badge>
                      </TableCell>
                      <TableCell>{formatFileSize(doc.fileSize)}</TableCell>
                      <TableCell>{doc.uploadedBy?.name || '-'}</TableCell>
                      <TableCell>
                        {new Date(doc.uploadedAt).toLocaleDateString('zh-CN')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}