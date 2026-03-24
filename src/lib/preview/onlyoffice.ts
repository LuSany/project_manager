import * as crypto from 'crypto'
import { SignJWT, jwtVerify } from 'jose'

export interface OnlyOfficeConfig {
  apiUrl: string
  apiKey?: string
  documentKey: string
  fileUrl: string
  fileName: string
  fileType: string
  mode: 'edit' | 'view'
  users: {
    id: string
    name: string
  }
}

export interface OnlyOfficeDocumentConfig {
  document: {
    fileType: string
    key: string
    title: string
    url: string
    permissions?: {
      comment?: boolean
      copy?: boolean
      download?: boolean
      edit?: boolean
      fillForms?: boolean
      modifyFilter?: boolean
      modifyContentControl?: boolean
      review?: boolean
    }
  }
  editorConfig: {
    mode: 'edit' | 'view'
    callbackUrl?: string
    serverUrl?: string // OnlyOffice服务器地址，解决跨域Service Worker问题
    users: {
      id: string
      name: string
    }
    lang: string
    region: string
    customization?: {
      autosave?: boolean
      comments?: boolean
      compactHeader?: boolean
      compactToolbar?: boolean
      compatibleFeatures?: boolean
      help?: boolean
      hideRightMenu?: boolean
      logo?: {
        image?: string
        imageEmbedded?: string
        url?: string
      }
      macros?: boolean
      macrosMode?: string
      mentionShare?: boolean
      plugins?: boolean
      review?: boolean
      showReviewChanges?: boolean
      spellcheck?: boolean
      toolbarNoTabs?: boolean
      toolbarHideFileName?: boolean
      zoom?: number
    }
  }
}

/**
 * 检查OnlyOffice服务是否可用（Mock模式）
 */
export function isOnlyOfficeAvailable(): boolean {
  const apiUrl = process.env.ONLYOFFICE_API_URL || process.env.NEXT_PUBLIC_ONLYOFFICE_API_URL
  const mockMode = process.env.ONLYOFFICE_MOCK_MODE === 'true'
  return !!apiUrl || mockMode
}

/**
 * 生成OnlyOffice编辑器URL
 */
export function generateOnlyOfficeUrl(config: OnlyOfficeConfig): string {
  const apiUrl = process.env.ONLYOFFICE_API_URL || process.env.NEXT_PUBLIC_ONLYOFFICE_API_URL

  if (!apiUrl) {
    throw new Error('ONLYOFFICE_API_URL is not configured')
  }

  // 构建文档配置
  const docConfig = buildDocumentConfig(config)

  // 如果有API密钥，需要对配置进行签名
  if (config.apiKey) {
    const signature = generateSignature(docConfig, config.apiKey)
    return `${apiUrl}?signature=${encodeURIComponent(signature)}`
  }

  return apiUrl
}

/**
 * 生成文档键（用于版本控制）
 */
export function generateDocumentKey(fileId: string, version: number = 1): string {
  const hash = crypto.createHash('sha256')
  hash.update(`${fileId}-${version}`)
  return hash.digest('hex')
}

/**
 * 验证文档键是否匹配指定的文件ID
 * 用于OnlyOffice服务访问文件时的认证
 */
export function verifyDocumentKey(key: string, fileId: string): boolean {
  const expectedKey = generateDocumentKey(fileId, 1)
  return key === expectedKey
}

export async function generateDocumentToken(
  fileId: string,
  userId: string,
  expiresIn: string = '1h'
): Promise<string> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET!)

  const token = await new SignJWT({
    fileId,
    userId,
    type: 'document-preview',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret)

  return token
}

export async function verifyDocumentToken(
  token: string,
  fileId: string
): Promise<{ valid: boolean; userId?: string }> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const { payload } = await jwtVerify(token, secret)

    if (payload.fileId !== fileId) {
      return { valid: false }
    }

    return { valid: true, userId: payload.userId as string }
  } catch {
    return { valid: false }
  }
}

/**
 * 构建OnlyOffice文档配置
 */
export function buildDocumentConfig(config: OnlyOfficeConfig): OnlyOfficeDocumentConfig {
  const isEditMode = config.mode === 'edit'
  const serverUrl = process.env.NEXT_PUBLIC_ONLYOFFICE_API_URL || 'http://localhost:8082'

  return {
    document: {
      fileType: config.fileType,
      key: config.documentKey,
      title: config.fileName,
      url: config.fileUrl,
      permissions: {
        comment: isEditMode,
        copy: true,
        download: true,
        edit: isEditMode,
        fillForms: isEditMode,
        modifyFilter: isEditMode,
        modifyContentControl: isEditMode,
        review: isEditMode,
      },
    },
    editorConfig: {
      mode: config.mode,
      callbackUrl: isEditMode ? generateCallbackUrl(config.documentKey) : undefined,
      serverUrl,
      users: config.users,
      lang: 'zh-CN',
      region: 'zh-CN',
      customization: {
        autosave: true,
        comments: true,
        compactHeader: false,
        compactToolbar: false,
        compatibleFeatures: true,
        help: true,
        hideRightMenu: false,
        plugins: true,
        review: isEditMode,
        showReviewChanges: true,
        spellcheck: true,
        toolbarNoTabs: false,
        toolbarHideFileName: false,
        zoom: 100,
        // 禁用宏功能，避免 jsaProject.bin 导致的文件打开错误
        macros: false,
      },
    },
  }
}

/**
 * 生成配置签名（用于OnlyOffice安全验证）
 */
export function generateSignature(config: OnlyOfficeDocumentConfig, apiKey: string): string {
  const configString = JSON.stringify(config)
  return crypto.createHmac('sha256', apiKey).update(configString).digest('base64')
}

/**
 * 生成 OnlyOffice 配置的 JWT Token
 * OnlyOffice Document Server 需要 JWT token 来验证配置的有效性
 */
export async function generateOnlyOfficeToken(payload: Record<string, unknown>): Promise<string> {
  const jwtSecret = process.env.ONLYOFFICE_JWT_SECRET

  if (!jwtSecret) {
    console.warn('ONLYOFFICE_JWT_SECRET is not configured, skipping JWT token generation')
    return ''
  }

  const secret = new TextEncoder().encode(jwtSecret)

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .sign(secret)

  return token
}

/**
 * 构建带 JWT Token 的 OnlyOffice 配置
 * 返回前端可以直接使用的配置对象
 */
export async function buildDocumentConfigWithToken(config: OnlyOfficeConfig): Promise<{
  config: OnlyOfficeDocumentConfig
  token: string
}> {
  const docConfig = buildDocumentConfig(config)

  // 生成 JWT token
  const payload = {
    document: docConfig.document,
    editorConfig: docConfig.editorConfig,
  }

  const token = await generateOnlyOfficeToken(payload)

  return {
    config: docConfig,
    token,
  }
}

/**
 * 生成回调URL（用于保存编辑后的文档）
 */
function generateCallbackUrl(documentKey: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${appUrl}/api/v1/files/onlyoffice-callback?key=${documentKey}`
}

/**
 * 从 MIME 类型获取 OnlyOffice 文件类型
 */
export function getFileTypeFromMime(mimeType: string): string {
  const mimeToType: Record<string, string> = {
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'application/pdf': 'pdf',
    'text/plain': 'txt',
    'text/csv': 'csv',
    'text/html': 'html',
    'application/wps-office.doc': 'doc',
    'application/wps-office.docx': 'docx',
    'application/wps-office.xls': 'xls',
    'application/wps-office.xlsx': 'xlsx',
    'application/wps-office.ppt': 'ppt',
    'application/wps-office.pptx': 'pptx',
    'application/wps-office.wps': 'doc',
    'application/wps-office.et': 'xls',
    'application/wps-office.dps': 'ppt',
    'application/vnd.wps-office.document': 'doc',
    'application/vnd.wps-office.spreadsheet': 'xls',
    'application/vnd.wps-office.presentation': 'ppt',
  }
  return mimeToType[mimeType] || ''
}

/**
 * 从文件内容检测真实的 OnlyOffice 文件类型
 * 用于处理扩展名与实际内容不匹配的情况
 *
 * 注意：WPS Office 有时会将文件保存为错误格式：
 * - 扩展名是 .docx 但实际内容是 OLE2 格式 (旧版 .doc)
 * - 扩展名是 .xlsx 但实际内容是 OLE2 格式 (旧版 .xls)
 * - 扩展名是 .pptx 但实际内容是 OLE2 格式 (旧版 .ppt)
 */
export async function detectRealFileType(
  filePath: string,
  declaredMimeType: string
): Promise<string> {
  const { open } = await import('fs/promises')

  // 从文件路径提取扩展名
  const ext = filePath.split('.').pop()?.toLowerCase() || ''

  // OLE2 格式对应的扩展名映射 (doc, wps, et, dps 等)
  const ole2ExtTypes: Record<string, string> = {
    doc: 'doc',
    wps: 'doc',
    xls: 'xls',
    et: 'xls',
    ppt: 'ppt',
    dps: 'ppt',
  }

  // ZIP 格式对应的扩展名映射
  const zipExtTypes: Record<string, string> = {
    docx: 'docx',
    xlsx: 'xlsx',
    pptx: 'pptx',
  }

  // 新格式扩展名到旧格式的映射 (用于处理 WPS Office 创建的格式不一致文件)
  const newToOldFormat: Record<string, string> = {
    docx: 'doc',
    xlsx: 'xls',
    pptx: 'ppt',
  }

  try {
    const handle = await open(filePath, 'r')
    const buffer = Buffer.alloc(8)
    await handle.read(buffer, 0, 8, 0)
    await handle.close()

    // OLE2 格式 (doc, xls, ppt) 的签名
    const ole2Signature = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]
    const isOle2 = ole2Signature.every((byte, i) => buffer[i] === byte)

    if (isOle2) {
      // 优先使用扩展名判断类型
      if (ole2ExtTypes[ext]) {
        return ole2ExtTypes[ext]
      }
      // 处理 WPS Office 创建的格式不一致文件：
      // 扩展名是 .docx/.xlsx/.pptx 但实际内容是 OLE2 格式
      if (newToOldFormat[ext]) {
        console.log(
          `[detectRealFileType] 检测到格式不一致: 扩展名 .${ext} 但实际内容是 OLE2 格式，将作为 .${newToOldFormat[ext]} 处理`
        )
        return newToOldFormat[ext]
      }
      // 回退到 MIME 类型推断
      if (declaredMimeType.includes('word') || declaredMimeType.includes('document')) {
        return 'doc'
      }
      if (declaredMimeType.includes('excel') || declaredMimeType.includes('spreadsheet')) {
        return 'xls'
      }
      if (declaredMimeType.includes('powerpoint') || declaredMimeType.includes('presentation')) {
        return 'ppt'
      }
      return 'doc'
    }

    // ZIP 格式 (docx, xlsx, pptx) 的签名
    const zipSignature = [0x50, 0x4b, 0x03, 0x04]
    const isZip = zipSignature.every((byte, i) => buffer[i] === byte)

    if (isZip) {
      // 优先使用扩展名判断类型
      if (zipExtTypes[ext]) {
        return zipExtTypes[ext]
      }
      // 回退到 MIME 类型推断
      return getFileTypeFromMime(declaredMimeType) || 'docx'
    }

    // 其他情况，尝试从 MIME 类型推断
    return getFileTypeFromMime(declaredMimeType)
  } catch {
    // 检测失败，尝试从扩展名推断
    if (ole2ExtTypes[ext]) return ole2ExtTypes[ext]
    if (zipExtTypes[ext]) return zipExtTypes[ext]
    // 处理格式不一致的情况
    if (newToOldFormat[ext]) return newToOldFormat[ext]
    return getFileTypeFromMime(declaredMimeType)
  }
}

/**
 * 从文件名获取文件类型
 * 注意：这是基于扩展名的简单检测，不保证准确性
 */
export function getFileType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''

  // OnlyOffice支持的文件类型
  const supportedTypes: Record<string, string> = {
    // 文本文档
    docx: 'docx',
    doc: 'doc',
    odt: 'odt',
    rtf: 'rtf',
    txt: 'txt',
    html: 'html',
    htm: 'htm',
    mht: 'mht',
    pdf: 'pdf',
    djvu: 'djvu',
    xps: 'xps',
    epub: 'epub',
    fb2: 'fb2',
    // 电子表格
    xlsx: 'xlsx',
    xls: 'xls',
    ods: 'ods',
    csv: 'csv',
    fods: 'fods',
    // 演示文稿
    pptx: 'pptx',
    ppt: 'ppt',
    odp: 'odp',
    fodp: 'fodp',
    ppsx: 'ppsx',
    pps: 'pps',
    // WPS格式 (WPS Office格式映射为标准Office格式)
    wps: 'doc', // WPS文字文档 → 映射为doc
    et: 'xls', // WPS表格 → 映射为xls
    dps: 'ppt', // WPS演示 → 映射为ppt
  }

  return supportedTypes[ext] || ''
}

/**
 * 检查文件类型是否被OnlyOffice支持
 */
export function isSupportedFileType(fileName: string): boolean {
  const fileType = getFileType(fileName)
  return fileType !== ''
}

/**
 * 生成Mock OnlyOffice响应（用于测试）
 */
export function generateMockOnlyOfficeResponse(config: OnlyOfficeConfig): {
  url: string
  config: OnlyOfficeDocumentConfig
} {
  return {
    url: '/mock/onlyoffice-editor',
    config: buildDocumentConfig(config),
  }
}
