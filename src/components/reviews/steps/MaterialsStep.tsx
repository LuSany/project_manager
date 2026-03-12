'use client'

import { useState, useRef } from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Upload, X, FileText, Loader2 } from 'lucide-react'
import type { WizardData, MaterialFile } from '../ReviewWizard'

interface MaterialsStepProps {
  materials: MaterialFile[]
  onChange: (data: Partial<WizardData>) => void
}

export function MaterialsStep({ materials, onChange }: MaterialsStepProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const uploadedMaterials: MaterialFile[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // 创建FormData上传文件
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/v1/files/upload', {
          method: 'POST',
          body: formData,
        })

        const result = await response.json()

        if (result.success && result.data) {
          uploadedMaterials.push({
            fileId: result.data.id,
            fileName: result.data.originalName || file.name,
            fileType: file.type,
            fileSize: file.size,
          })
        }
      }

      onChange({ materials: [...materials, ...uploadedMaterials] })
    } catch (err) {
      console.error('文件上传失败:', err)
      alert('文件上传失败，请重试')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveMaterial = (index: number) => {
    const newMaterials = materials.filter((_, i) => i !== index)
    onChange({ materials: newMaterials })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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
      <Label>评审材料</Label>

      {/* 拖拽上传区域 */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
        }`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          handleFileSelect(e.dataTransfer.files)
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
          accept=".doc,.docx,.xls,.xlsx,.ppt,.pptx,.pdf,.png,.jpg,.jpeg,.gif"
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">上传中...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              拖拽文件到此处，或
              <Button
                variant="link"
                className="px-1"
                onClick={() => fileInputRef.current?.click()}
              >
                点击选择文件
              </Button>
            </p>
            <p className="text-xs text-muted-foreground">
              支持: Word, Excel, PPT, PDF, 图片等格式 (单文件最大 100MB)
            </p>
          </div>
        )}
      </div>

      {/* 已上传材料列表 */}
      {materials.length > 0 && (
        <div className="space-y-2">
          <Label>已上传材料 ({materials.length})</Label>
          <div className="space-y-2">
            {materials.map((material, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getFileIcon(material.fileType)}</span>
                  <div>
                    <div className="text-sm font-medium">{material.fileName}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatFileSize(material.fileSize)}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveMaterial(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}