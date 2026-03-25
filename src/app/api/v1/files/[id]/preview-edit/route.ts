import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { success, error, unauthorized, forbidden, notFound } from '@/lib/api/response'
import {
  generateOnlyOfficeUrl,
  generateDocumentKey,
  getFileType,
  isSupportedFileType,
  isOnlyOfficeAvailable,
  generateMockOnlyOfficeResponse,
  buildDocumentConfigWithToken,
  detectRealFileType,
} from '@/lib/preview/onlyoffice'
import { checkFilePreviewAccess } from '@/lib/file-permission'
import { acquireDocumentLock } from '@/lib/document-lock'

// GET /api/v1/files/:id/preview-edit - 获取OnlyOffice编辑URL
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = request.cookies.get('user-id')?.value

  if (!userId) {
    return unauthorized('未授权，请先登录')
  }

  const { id: fileId } = await params
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('mode') === 'view' ? 'view' : 'edit'

  try {
    // 使用新的权限检查函数
    const accessCheck = await checkFilePreviewAccess(fileId, userId)

    if (!accessCheck.hasAccess) {
      return forbidden(accessCheck.reason || '无权访问此文件')
    }

    // 获取文件信息
    const file = await prisma.file_storage.findUnique({
      where: { id: fileId },
    })

    if (!file) {
      return notFound('文件不存在')
    }

    // 检查文件类型是否支持
    if (!isSupportedFileType(file.fileName)) {
      return error(
        'UNSUPPORTED_FILE_TYPE',
        '此文件类型不支持OnlyOffice预览/编辑',
        { fileType: file.mimeType },
        400
      )
    }

    // 检查OnlyOffice服务是否可用
    const mockMode = process.env.ONLYOFFICE_MOCK_MODE === 'true'
    if (!isOnlyOfficeAvailable() && !mockMode) {
      return error('SERVICE_UNAVAILABLE', 'OnlyOffice服务未配置或不可用', undefined, 503)
    }

    if (mode === 'edit') {
      const lockResult = await acquireDocumentLock(fileId, userId)
      if (!lockResult.success && lockResult.lock) {
        const lockInfo = {
          locked: lockResult.lock.locked,
          lockedBy: lockResult.lock.lockedBy,
          lockedByName: lockResult.lock.lockedByName,
          expiresAt: lockResult.lock.expiresAt?.toISOString(),
        }
        return error(
          'FILE_LOCKED',
          `文件正在被 ${lockResult.lock.lockedByName} 编辑中`,
          lockInfo,
          423
        )
      }
    }

    const documentKey = generateDocumentKey(file.id, file.version || 1)

    // 构建文件下载URL（带文档密钥认证，供OnlyOffice访问）
    const appUrl =
      process.env.ONLYOFFICE_CALLBACK_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000'
    const fileUrl = `${appUrl}/api/v1/files/${file.id}/download?key=${documentKey}`

    // 检测真实的文件类型（基于文件内容，而非扩展名）
    const fileType = await detectRealFileType(file.filePath, file.mimeType)

    // 调试日志
    console.log('[Preview-Edit] 文件信息:', {
      fileId: file.id,
      originalName: file.originalName,
      fileName: file.fileName,
      filePath: file.filePath,
      dbMimeType: file.mimeType,
      detectedFileType: fileType,
    })

    // 修正文件名扩展名，确保与检测类型一致（避免OnlyOffice报"内容与扩展名不匹配"错误）
    const expectedExts: Record<string, string> = {
      doc: 'doc',
      docx: 'docx',
      xls: 'xls',
      xlsx: 'xlsx',
      ppt: 'ppt',
      pptx: 'pptx',
    }
    const expectedExt = expectedExts[fileType]
    const originalExt = (file.originalName || file.fileName).split('.').pop()?.toLowerCase()
    let correctedFileName = file.originalName || file.fileName
    if (expectedExt && originalExt && originalExt !== expectedExt) {
      const oldName = correctedFileName
      correctedFileName = correctedFileName.replace(/\.[^.]+$/, `.${expectedExt}`)
      console.log('[Preview-Edit] 扩展名修正:', oldName, '->', correctedFileName)
    }

    const config = {
      apiUrl: process.env.ONLYOFFICE_API_URL || process.env.NEXT_PUBLIC_ONLYOFFICE_API_URL || '',
      apiKey: process.env.ONLYOFFICE_API_KEY || '',
      documentKey,
      fileUrl,
      fileName: correctedFileName,
      fileType,
      mode: mode as 'edit' | 'view',
      users: {
        id: accessCheck.user!.id,
        name: accessCheck.user!.name,
      },
    }

    if (mockMode) {
      const mockResponse = generateMockOnlyOfficeResponse(config)
      return success({
        ...mockResponse,
        mockMode: true,
        fileName: file.originalName || file.fileName,
        fileType: file.mimeType,
      })
    }

    const editorUrl = generateOnlyOfficeUrl(config)
    const { config: docConfig, token } = await buildDocumentConfigWithToken(config)

    await prisma.file_storage.update({
      where: { id: file.id },
      data: { documentKey },
    })

    return success({
      url: editorUrl,
      config: docConfig,
      token,
      fileName: file.originalName || file.fileName,
      fileType: file.mimeType,
      documentKey,
    })
  } catch (err) {
    console.error('获取OnlyOffice编辑URL失败:', err)
    return error('INTERNAL_ERROR', '获取OnlyOffice编辑URL失败', undefined, 500)
  }
}
