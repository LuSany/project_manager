// 安全工具函数
import crypto from 'crypto'

// 生成 CSRF token
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// 验证 CSRF token
export function validateCSRFToken(token: string): boolean {
  // 实际应用中应该从 session 或其他存储中验证
  return token && token.length === 64
}

// 输入清理 - 防止 XSS 攻击
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

// 敏感数据加密
export function encryptSensitiveData(data: string): string {
  const algorithm = 'aes-256-cbc'
  const key = process.env.ENCRYPTION_KEY

  if (!key || key.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters. Please set ENCRYPTION_KEY environment variable.')
  }

  const keyBuffer = Buffer.from(key.slice(0, 32))
  const iv = crypto.randomBytes(16)

  const cipher = crypto.createCipheriv(algorithm, keyBuffer, iv)
  const encrypted: Buffer = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()])

  return `${iv.toString('hex')}:${encrypted.toString('hex')}`
}

export function decryptSensitiveData(encryptedData: string): string {
  const [ivHex, encrypted] = encryptedData.split(':')
  const key = process.env.ENCRYPTION_KEY

  if (!key || key.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters. Please set ENCRYPTION_KEY environment variable.')
  }

  const keyBuffer = Buffer.from(key.slice(0, 32))

  const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, Buffer.from(ivHex, 'hex'))
  const decrypted = Buffer.concat([
    Buffer.from(decipher.update(encrypted, 'hex', 'utf8')),
    decipher.final(),
  ])

  return decrypted.toString('utf8')
}
