import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { error } from '@/lib/api/response'
import { createReadStream } from 'fs'
import { verifyDocumentKey } from '@/lib/preview/onlyoffice'

/**
 * GET /api/v1/files/:id/download
 * 文件下载端点，支持两种认证方式：
 * 1. Cookie 认证（用户登录状态）
 * 2. Document Key 认证（OnlyOffice 服务访问）
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: fileId } = await params
  const { searchParams } = new URL(request.url)
  const documentKey = searchParams.get('key')

  // 方式1：Cookie 认证
  const userId = request.cookies.get('user-id')?.value

  // 方式2：Document Key 认证（用于 OnlyOffice）
  const isValidKey = documentKey && verifyDocumentKey(documentKey, fileId)

  if (!userId && !isValidKey) {
    return error('UNAUTHORIZED_ERROR', '未授权，请先登录或提供有效的文档密钥', undefined, 401)
  }

  try {
    const file = await prisma.fileStorage.findUnique({
      where: { id: fileId },
    })

    if (!file) {
      return error('文件不存在_ERROR', '文件不存在', undefined, 404)
    }

    const filePath = file.filePath

    // 检查文件是否存在
    try {
      const stream = createReadStream(filePath)

      return new Response(stream as any, {
        headers: {
          'Content-Type': file.mimeType,
          'Content-Disposition': `inline; filename="${encodeURIComponent(file.fileName)}"`,
          'Cache-Control': 'private, max-age=3600',
        },
      })
    } catch (fsError: any) {
      console.error('文件读取失败:', fsError)
      if (fsError.code === 'ENOENT') {
        return error('FILE_NOT_FOUND_ERROR', '文件物理路径不存在', undefined, 404)
      }
      throw fsError
    }
  } catch (err) {
    console.error('下载文件失败:', err)
    return error('INTERNAL_ERROR', '下载文件失败', undefined, 500)
  }
}
