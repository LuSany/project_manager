import { join, resolve, relative, isAbsolute } from 'path'
import { existsSync } from 'fs'

const ALLOWED_DIRS = [
  resolve(join(process.cwd(), 'uploads')),
  resolve(join(process.cwd(), 'public/uploads')),
]

export function validateFilePath(filePath: string): { valid: boolean; reason?: string } {
  if (!filePath) {
    return { valid: false, reason: '文件路径不能为空' }
  }

  if (!isAbsolute(filePath)) {
    return { valid: false, reason: '文件路径必须是绝对路径' }
  }

  const resolvedPath = resolve(filePath)

  const isAllowed = ALLOWED_DIRS.some((allowedDir) => {
    const relativePath = relative(allowedDir, resolvedPath)
    return !relativePath.startsWith('..') && !relativePath.startsWith('/')
  })

  if (!isAllowed) {
    return { valid: false, reason: '文件路径不在允许的目录内' }
  }

  const suspiciousPatterns = ['..', '~', '\0']
  if (suspiciousPatterns.some((p) => filePath.includes(p))) {
    return { valid: false, reason: '文件路径包含非法字符' }
  }

  return { valid: true }
}

export function validateFileExists(filePath: string): { exists: boolean; reason?: string } {
  if (!existsSync(filePath)) {
    return { exists: false, reason: '文件不存在' }
  }
  return { exists: true }
}

export function getSafeFilePath(filename: string, subDir?: string): string {
  const baseDir = ALLOWED_DIRS[0]
  const safeName = filename.replace(/\.\./g, '').replace(/[<>:"|?*]/g, '_')

  if (subDir) {
    return join(baseDir, subDir, safeName)
  }

  return join(baseDir, safeName)
}
