import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { success, error } from '@/lib/api/response'
import { z } from 'zod'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { getAuthUser as getAuthUserIdentity } from '@/lib/auth/get-auth-user'
import { validateFilePath, getSafeFilePath } from '@/lib/file-security'

// 允许的文件类型
const ALLOWED_MIME_TYPES = [
  // PDF
  'application/pdf',
  // Word 文档
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // Excel 文档
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/excel',
  'application/x-excel',
  'application/x-msexcel',
  // PowerPoint 文档
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/powerpoint',
  'application/x-powerpoint',
  // WPS 文档
  'application/wps-office.doc',
  'application/wps-office.docx',
  'application/wps-office.xls',
  'application/wps-office.xlsx',
  'application/wps-office.ppt',
  'application/wps-office.pptx',
  'application/vnd.wps-office.document',
  'application/vnd.wps-office.spreadsheet',
  'application/vnd.wps-office.presentation',
  // 图片
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/svg+xml',
  'image/tiff',
  'image/x-icon',
  'image/ico',
  // 文本
  'text/plain',
  'text/csv',
  'text/html',
  'text/xml',
  'text/x-markdown',
  'text/markdown',
  // 压缩文件
  'application/zip',
  'application/x-zip-compressed',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'application/x-gzip',
  'application/gzip',
  // 其他常见类型
  'application/json',
  'application/xml',
  // 富文本
  'application/rtf',
  'text/rtf',
]

const ALLOWED_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.wps',
  '.et',
  '.dps',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.bmp',
  '.svg',
  '.tiff',
  '.ico',
  '.txt',
  '.csv',
  '.html',
  '.htm',
  '.xml',
  '.md',
  '.markdown',
  '.zip',
  '.rar',
  '.7z',
  '.gz',
  '.json',
  '.rtf',
]

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

// POST /api/v1/files/upload - 上传文件
const uploadFileSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().positive().max(MAX_FILE_SIZE),
  mimeType: z.string(),
})

// 从中间件获取用户信息
async function getAuthUser(request: NextRequest) {
  const { userId } = await getAuthUserIdentity(request)
  if (!userId) return null
  return prisma.users.findUnique({ where: { id: userId } })
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return error('未授权_ERROR', '未授权，请先登录', undefined, 401)
    }

    const contentType = request.headers.get('content-type') || ''

    // 处理 FormData (multipart/form-data) 格式
    if (contentType.includes('multipart/form-data')) {
      return await handleFormDataUpload(request, user.id)
    }

    // 处理 JSON 格式 (向后兼容)
    return await handleJsonUpload(request, user.id)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return error('VALIDATION_ERROR', '参数验证失败', { issues: err.issues }, 400)
    }
    console.error('上传文件失败:', err)
    return error('UPLOAD_FILE_FAILED', '上传文件失败', undefined, 500)
  }
}

// 处理 FormData 格式上传
async function handleFormDataUpload(request: NextRequest, userId: string) {
  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return error('VALIDATION_ERROR', '未提供文件', undefined, 400)
  }

  // 验证文件大小
  if (file.size > MAX_FILE_SIZE) {
    return error(
      'VALIDATION_ERROR',
      `文件大小超过限制 (最大 ${MAX_FILE_SIZE / 1024 / 1024}MB)`,
      undefined,
      400
    )
  }

  const fileExtension = '.' + (file.name.split('.').pop() || '').toLowerCase()
  const isMimeTypeAllowed = ALLOWED_MIME_TYPES.includes(file.type)
  const isExtensionAllowed = ALLOWED_EXTENSIONS.includes(fileExtension)

  // AND 逻辑：MIME 类型 AND 扩展名都必须合法
  if (!isMimeTypeAllowed || !isExtensionAllowed) {
    return error(
      'VALIDATION_ERROR',
      `不支持的文件类型: MIME ${file.type || '未知'}，扩展名 ${fileExtension}。两者都必须匹配允许的文件类型。`,
      undefined,
      400
    )
  }

  // 生成唯一文件名
  const fileId = crypto.randomUUID()
  const extension = file.name.split('.').pop() || 'bin'
  const fileName = `${fileId}.${extension}`

  // 使用安全的文件路径生成器防止路径遍历攻击
  const safeFilePath = getSafeFilePath(fileName)

  const pathValidation = validateFilePath(safeFilePath)
  if (!pathValidation.valid) {
    return error('VALIDATION_ERROR', pathValidation.reason || '文件路径验证失败', undefined, 400)
  }

  const uploadDir = join(process.cwd(), 'uploads')
  const filePath = join(uploadDir, fileName)

  // 二次验证最终路径是否安全
  const finalPathValidation = validateFilePath(filePath)
  if (!finalPathValidation.valid) {
    return error('VALIDATION_ERROR', finalPathValidation.reason || '文件路径验证失败', undefined, 400)
  }

  // 确保 uploads 目录存在
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true })
  }

  // 写入文件到磁盘
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  await writeFile(filePath, buffer)

  // 创建数据库记录
  const fileRecord = await prisma.file_storage.create({
    data: {
      id: crypto.randomUUID(),
      fileName,
      originalName: file.name,
      filePath,
      fileSize: file.size,
      mimeType: file.type,
      users_file_storage_uploadedByTousers: { connect: { id: userId } },
      updatedAt: new Date(),
    },
  })

  return success(fileRecord)
}

// 处理 JSON 格式上传 (向后兼容，仅记录元数据)
async function handleJsonUpload(request: NextRequest, userId: string) {
  const body = await request.json()
  const validated = uploadFileSchema.parse(body)

  // 生成唯一文件名
  const fileId = crypto.randomUUID()
  const extension = validated.fileName.split('.').pop()
  const fileName = `${fileId}.${extension}`

  const uploadDir = join(process.cwd(), 'uploads')
  const filePath = join(uploadDir, fileName)

  const pathValidation = validateFilePath(filePath)
  if (!pathValidation.valid) {
    return error('VALIDATION_ERROR', pathValidation.reason || '文件路径验证失败', undefined, 400)
  }

  // 确保 uploads 目录存在
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true })
  }

  const file = await prisma.file_storage.create({
    data: {
      id: crypto.randomUUID(),
      fileName,
      originalName: validated.fileName,
      filePath,
      fileSize: validated.fileSize,
      mimeType: validated.mimeType,
      users_file_storage_uploadedByTousers: { connect: { id: userId } },
      updatedAt: new Date(),
    },
  })

  return success(file)
}
