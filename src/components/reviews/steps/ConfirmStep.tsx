'use client'

import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Edit, FileText, Users, Info } from 'lucide-react'
import type { WizardData } from '../ReviewWizard'

interface ConfirmStepProps {
  data: WizardData
  onEditStep: (step: number) => void
}

export function ConfirmStep({ data, onEditStep }: ConfirmStepProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '未设置'
    try {
      return new Date(dateStr).toLocaleString('zh-CN')
    } catch {
      return dateStr
    }
  }

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return '🖼️'
    if (type.includes('pdf')) return '📄'
    if (type.includes('word') || type.includes('document')) return '📝'
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊'
    if (type.includes('powerpoint') || type.includes('presentation')) return '📽️'
    return '📁'
  }

  return (
    <div className="space-y-4">
      {/* 基本信息 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-4 w-4" />
              基本信息
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onEditStep(1)}>
              <Edit className="h-4 w-4 mr-1" />
              修改
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">评审标题:</span>
            <span className="font-medium">{data.title}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">计划时间:</span>
            <span>{formatDateTime(data.scheduledAt)}</span>
          </div>
          {data.description && (
            <div className="pt-2 border-t">
              <span className="text-muted-foreground">描述:</span>
              <p className="mt-1">{data.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 参与人员 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              参与人员
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onEditStep(2)}>
              <Edit className="h-4 w-4 mr-1" />
              修改
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.moderatorId && (
            <div className="flex items-center gap-2">
              <Badge variant="default">主持人</Badge>
              <span className="text-sm">{data.moderatorId}</span>
            </div>
          )}
          {data.reviewers.length > 0 && (
            <div>
              <div className="text-muted-foreground text-sm mb-1">评审人:</div>
              <div className="flex flex-wrap gap-1">
                {data.reviewers.map((id) => (
                  <Badge key={id} variant="secondary">{id}</Badge>
                ))}
              </div>
            </div>
          )}
          {data.observers.length > 0 && (
            <div>
              <div className="text-muted-foreground text-sm mb-1">观察者:</div>
              <div className="flex flex-wrap gap-1">
                {data.observers.map((id) => (
                  <Badge key={id} variant="outline">{id}</Badge>
                ))}
              </div>
            </div>
          )}
          {!data.moderatorId && data.reviewers.length === 0 && data.observers.length === 0 && (
            <div className="text-muted-foreground text-sm">未选择参与人员</div>
          )}
        </CardContent>
      </Card>

      {/* 评审材料 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              评审材料
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onEditStep(3)}>
              <Edit className="h-4 w-4 mr-1" />
              修改
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {data.materials.length === 0 ? (
            <div className="text-muted-foreground text-sm">未上传评审材料</div>
          ) : (
            <div className="space-y-2">
              {data.materials.map((material, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <span>{getFileIcon(material.fileType)}</span>
                  <span>{material.fileName}</span>
                  <span className="text-muted-foreground">({formatFileSize(material.fileSize)})</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}