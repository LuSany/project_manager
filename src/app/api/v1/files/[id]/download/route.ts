import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { error } from '@/lib/api/response'
import { createReadStream } from 'fs'
import { generateDocumentKey, detectRealFileType } from '@/lib/preview/onlyoffice'
import { validateFilePath, validateFileExists } from '@/lib/file-security'

const CORRECT_MIME_TYPES: Record<string, string> = {
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
}

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

  // 先获取文件信息（需要版本号来验证文档密钥）
  const file = await prisma.file_storage.findUnique({
    where: { id: fileId },
  })

  if (!file) {
    return error('文件不存在_ERROR', '文件不存在', undefined, 404)
  }

  // 方式2：Document Key 认证（用于 OnlyOffice）- 使用实际的文件版本
  const expectedKey = generateDocumentKey(fileId, file.version || 1)
  const isValidKey = documentKey && documentKey === expectedKey

  if (!userId && !isValidKey) {
    return error('UNAUTHORIZED_ERROR', '未授权，请先登录或提供有效的文档密钥', undefined, 401)
  }

  try {
    const filePath = file.filePath

    const pathValidation = validateFilePath(filePath)
    if (!pathValidation.valid) {
      console.error('文件路径安全验证失败:', pathValidation.reason, filePath)
      return error('INVALID_FILE_PATH', pathValidation.reason || '无效的文件路径', undefined, 403)
    }

    const existsValidation = validateFileExists(filePath)
    if (!existsValidation.exists) {
      return error('FILE_NOT_FOUND_ERROR', '文件不存在', undefined, 404)
    }

    // 检测真实文件类型，确保返回正确的 Content-Type
    const detectedFileType = await detectRealFileType(filePath, file.mimeType)
    const correctMimeType = CORRECT_MIME_TYPES[detectedFileType] || file.mimeType

    // 修正文件名扩展名，确保与检测类型一致
    const expectedExts: Record<string, string> = {
      doc: 'doc',
      docx: 'docx',
      xls: 'xls',
      xlsx: 'xlsx',
      ppt: 'ppt',
      pptx: 'pptx',
    }
    const expectedExt = expectedExts[detectedFileType]
    const originalExt = (file.originalName || file.fileName).split('.').pop()?.toLowerCase()
    let correctedFileName = file.originalName || file.fileName
    if (expectedExt && originalExt && originalExt !== expectedExt) {
      correctedFileName = correctedFileName.replace(/\.[^.]+$/, `.${expectedExt}`)
      console.log('[Download] 扩展名修正:', file.originalName, '->', correctedFileName)
    }

    // 调试日志
    console.log('[Download] 文件信息:', {
      fileId: file.id,
      filePath,
      dbMimeType: file.mimeType,
      detectedFileType,
      correctMimeType,
      correctedFileName,
    })

    const stream = createReadStream(filePath)

    return new Response(stream as any, {
      headers: {
        'Content-Type': correctMimeType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(correctedFileName)}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (fsError: any) {
    console.error('文件读取失败:', fsError)
    if (fsError.code === 'ENOENT') {
      return error('FILE_NOT_FOUND_ERROR', '文件物理路径不存在', undefined, 404)
    }
    return error('INTERNAL_ERROR', '下载文件失败', undefined, 500)
  }
}
