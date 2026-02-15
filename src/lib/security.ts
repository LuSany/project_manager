// 安全工具函数
import crypto from 'crypto';

// 生成 CSRF token
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// 验证 CSRF token
export function validateCSRFToken(token: string): boolean {
  // 实际应用中应该从 session 或其他存储中验证
  return token && token.length === 64;
}

// 输入清理 - 防止 XSS 攻击
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// 敏感数据加密
export function encryptSensitiveData(data: string): string {
  const algorithm = 'aes-256-cbc';
  const key = process.env.ENCRYPTION_KEY || 'default-key-32-characters-long!';
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted = Buffer.concat([encrypted, cipher.final()]).toString('hex');
  
  return `${iv.toString('hex')}:${encrypted}`;
}

export function decryptSensitiveData(encryptedData: string): string {
  const [ivHex, encrypted] = encryptedData.split(':');
  const key = process.env.ENCRYPTION_KEY || 'default-key-32-characters-long!';
  
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(ivHex, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted = Buffer.concat([decrypted, decipher.final()]).toString('utf8');
  
  return decrypted;
}
