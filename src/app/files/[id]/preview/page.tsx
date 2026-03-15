'use client'

import { useState, useEffect, use } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function FilePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [config, setConfig] = useState<any>(null)

  useEffect(() => {
    const loadPreview = async () => {
      try {
        const response = await fetch(`/api/v1/files/${id}/preview-edit?mode=view`)
        const data = await response.json()

        if (data.success) {
          setConfig(data.data)
        } else {
          setError(data.error?.message || '获取预览配置失败')
        }
      } catch (err) {
        setError('获取预览配置失败')
        console.error('获取预览配置失败:', err)
      } finally {
        setLoading(false)
      }
    }

    loadPreview()
  }, [id])

  useEffect(() => {
    if (config && !loading) {
      // 加载OnlyOffice编辑器API
      const loadOnlyOffice = () => {
        const onlyOfficeUrl = process.env.NEXT_PUBLIC_ONLYOFFICE_API_URL || 'http://localhost:8080'
        const script = document.createElement('script')
        script.src = `${onlyOfficeUrl}/web-apps/apps/api/documents/api.js`
        script.onload = () => {
          // 初始化编辑器
          if ((window as any).DocsAPI) {
            new (window as any).DocsAPI.DocEditor('onlyoffice-editor', config.config)
          }
        }
        script.onerror = () => {
          setError('OnlyOffice服务不可用，请检查服务是否已启动')
        }
        document.head.appendChild(script)
      }

      loadOnlyOffice()
    }
  }, [config, loading])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-red-500">{error}</p>
        <Link href="/">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen">
      <div id="onlyoffice-editor" className="w-full h-full"></div>
    </div>
  )
}