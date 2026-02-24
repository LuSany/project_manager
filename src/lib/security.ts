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

// ============================================================================
// URL 签名机制
// ============================================================================

/**
 * 生成文件访问签名 URL
 * @param fileId 文件 ID
 * @param userId 用户 ID
 * @param action 操作类型 (view/download)
 * @param expiresIn 有效期（秒），默认 3600 秒（1 小时）
 * @returns 签名 URL
 */
export function generateSignedUrl(
  fileId: string,
  userId: string,
  action: 'view' | 'download' = 'view',
  expiresIn: number = 3600
): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const expires = timestamp + expiresIn;

  // 参与签名的参数
  const signContent = `${fileId}|${userId}|${action}|${expires}`;

  // 生成签名
  const signature = crypto
    .createHmac('sha256', process.env.FILE_SIGN_SECRET!)
    .update(signContent)
    .digest('hex');

  // 返回带签名的 URL
  return `/api/v1/files/${fileId}?userId=${userId}&action=${action}&expires=${expires}&sig=${signature}`;
}

/**
 * 验证签名 URL
 * @param fileId 文件 ID
 * @param userId 用户 ID
 * @param action 操作类型
 * @param expires 过期时间戳
 * @param signature 签名
 * @returns 验证结果
 */
export function verifySignedUrl(
  fileId: string,
  userId: string,
  action: string,
  expires: number,
  signature: string
): { valid: boolean; error?: string } {
  // 检查是否过期
  if (Date.now() / 1000 > expires) {
    return { valid: false, error: '签名已过期' };
  }

  // 验证签名
  const signContent = `${fileId}|${userId}|${action}|${expires}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.FILE_SIGN_SECRET!)
    .update(signContent)
    .digest('hex');

  if (signature !== expectedSignature) {
    return { valid: false, error: '签名无效' };
  }

  return { valid: true };
}

/**
 * 生成下载签名 URL
 * @param fileId 文件 ID
 * @param userId 用户 ID
 * @param expiresIn 有效期（秒）
 * @returns 签名下载 URL
 */
export function generateDownloadUrl(
  fileId: string,
  userId: string,
  expiresIn: number = 3600
): string {
  return generateSignedUrl(fileId, userId, 'download', expiresIn);
}

/**
 * 生成预览签名 URL
 * @param fileId 文件 ID
 * @param userId 用户 ID
 * @param expiresIn 有效期（秒）
 * @returns 签名预览 URL
 */
export function generatePreviewUrl(
  fileId: string,
  userId: string,
  expiresIn: number = 3600
): string {
  return generateSignedUrl(fileId, userId, 'view', expiresIn);
}
