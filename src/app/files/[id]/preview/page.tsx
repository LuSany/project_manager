'use client'

import { useState, useEffect, use } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function FilePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [config, setConfig] = useState<any>(null)

  useEffect(() => {
    const loadPreview = async () => {
      try {
        const response = await fetch(`/api/v1/files/${id}/preview-edit?mode=view`, {
          credentials: 'include',
        })
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
      const initEditor = async () => {
        const onlyOfficeUrl = process.env.NEXT_PUBLIC_ONLYOFFICE_API_URL || 'http://localhost:8082'

        const existingScript = document.querySelector(
          `script[src="${onlyOfficeUrl}/web-apps/apps/api/documents/api.js"]`
        )

        const editorConfig = config.config
        if (config.token) {
          editorConfig.token = config.token
        }

        // 注销所有 Service Worker，避免 OnlyOffice 缓存问题
        // Service Worker 跨域会导致 403 错误，必须彻底清除
        if ('serviceWorker' in navigator) {
          try {
            const registrations = await navigator.serviceWorker.getRegistrations()
            for (const registration of registrations) {
              console.log('[OnlyOffice] 注销 Service Worker:', registration.scope)
              await registration.unregister()
            }
            // 清除所有缓存
            if ('caches' in window) {
              const cacheNames = await caches.keys()
              for (const cacheName of cacheNames) {
                if (cacheName.includes('onlyoffice') || cacheName.includes('8082')) {
                  console.log('[OnlyOffice] 清除缓存:', cacheName)
                  await caches.delete(cacheName)
                }
              }
            }
          } catch (e) {
            console.warn('[OnlyOffice] Service Worker 清理失败:', e)
          }
        }

        if (existingScript) {
          if ((window as any).DocsAPI) {
            new (window as any).DocsAPI.DocEditor('onlyoffice-editor', editorConfig)
          }
          return
        }

        const script = document.createElement('script')
        script.src = `${onlyOfficeUrl}/web-apps/apps/api/documents/api.js`
        script.onload = () => {
          if ((window as any).DocsAPI) {
            new (window as any).DocsAPI.DocEditor('onlyoffice-editor', editorConfig)
          }
        }
        script.onerror = () => {
          setError('OnlyOffice服务不可用，请检查服务是否已启动')
        }
        document.head.appendChild(script)
      }

      initEditor()
    }
  }, [config, loading])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-red-500">{error}</p>
        <Link href="/">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen">
      <div id="onlyoffice-editor" className="h-full w-full"></div>
    </div>
  )
}
