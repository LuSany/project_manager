import { describe, it, expect, vi, beforeEach } from 'vitest'
import crypto from 'crypto'

const mockJwtSecret = 'test-jwt-secret-32-chars-long-for-testing!'
const mockEncryptionKey = 'test-encryption-key-32-chars-long!'

beforeEach(() => {
  process.env.JWT_SECRET = mockJwtSecret
  process.env.ENCRYPTION_KEY = mockEncryptionKey
})

let generateCSRFToken: any
let validateCSRFToken: any
let sanitizeInput: any
let encryptSensitiveData: any
let decryptSensitiveData: any

beforeEach(async () => {
  const securityModule = await import('@/lib/security')
  generateCSRFToken = securityModule.generateCSRFToken
  validateCSRFToken = securityModule.validateCSRFToken
  sanitizeInput = securityModule.sanitizeInput
  encryptSensitiveData = securityModule.encryptSensitiveData
  decryptSensitiveData = securityModule.decryptSensitiveData
})

describe('Security Module', () => {
  describe('generateCSRFToken', () => {
    it('should generate a token with timestamp and signature', () => {
      const token = generateCSRFToken()
      expect(token).toBeDefined()
      expect(token).toContain('.')
      const parts = token.split('.')
      expect(parts).toHaveLength(2)

      const [timestampStr, signature] = parts
      const timestamp = parseInt(timestampStr, 10)
      expect(timestamp).toBeGreaterThan(0)
      expect(signature).toHaveLength(64)
    })

    it('should generate different tokens each time', async () => {
      const token1 = generateCSRFToken()
      // 等待超过 1 秒以确保不同的时间戳
      await new Promise((resolve) => setTimeout(resolve, 1100))
      const token2 = generateCSRFToken()
      expect(token1).not.toBe(token2)
    })
  })

  describe('validateCSRFToken', () => {
    it('should return falsy for empty token', () => {
      expect(validateCSRFToken('')).toBeFalsy()
    })

    it('should return falsy for null/undefined', () => {
      expect(validateCSRFToken(null as any)).toBeFalsy()
      expect(validateCSRFToken(undefined as any)).toBeFalsy()
    })

    it('should return false for invalid format token', () => {
      expect(validateCSRFToken('short')).toBe(false)
      expect(validateCSRFToken('invalid')).toBe(false)
      expect(validateCSRFToken('a.b.c')).toBe(false)
    })

    it('should return true for valid token', () => {
      const token = generateCSRFToken()
      expect(validateCSRFToken(token)).toBe(true)
    })

    it('should return false for tampered token', () => {
      const token = generateCSRFToken()
      const [timestamp, signature] = token.split('.')
      const tamperedToken = `${timestamp}.${signature.slice(0, 32)}a`
      expect(validateCSRFToken(tamperedToken)).toBe(false)
    })

    it('should return false for expired token', () => {
      const expiredTimestamp = Math.floor(Date.now() / 1000) - 4000 // > 1 hour ago
      const data = `csrf|${expiredTimestamp}`
      const secret = mockJwtSecret.slice(0, 32)
      const signature = crypto.createHmac('sha256', secret).update(data).digest('hex')
      const expiredToken = `${expiredTimestamp}.${signature}`
      expect(validateCSRFToken(expiredToken)).toBe(false)
    })
  })

  describe('sanitizeInput', () => {
    it('should escape HTML special characters', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      )
    })

    it('should escape ampersand', () => {
      expect(sanitizeInput('foo & bar')).toBe('foo &amp; bar')
    })

    it('should escape quotes', () => {
      expect(sanitizeInput("It's a test")).toBe('It&#x27;s a test')
      expect(sanitizeInput('Say "hello"')).toBe('Say &quot;hello&quot;')
    })

    it('should return empty string for empty input', () => {
      expect(sanitizeInput('')).toBe('')
    })

    it('should handle normal text without changes', () => {
      expect(sanitizeInput('Hello World')).toBe('Hello World')
      expect(sanitizeInput('no special chars')).toBe('no special chars')
    })
  })

  describe('encryptSensitiveData', () => {
    it('应该加密敏感数据', () => {
      const encrypted = encryptSensitiveData('secret data')
      expect(encrypted).toBeDefined()
      expect(encrypted).not.toBe('secret data')
      expect(encrypted).toContain(':')
    })

    it('应该返回 iv:encrypted 格式', () => {
      const encrypted = encryptSensitiveData('test')
      const [iv, data] = encrypted.split(':')
      expect(iv).toBeDefined()
      expect(data).toBeDefined()
      expect(iv.length).toBe(32)
    })
  })

  describe('decryptSensitiveData', () => {
    it('应该解密加密的数据', () => {
      const original = 'secret data'
      const encrypted = encryptSensitiveData(original)
      const decrypted = decryptSensitiveData(encrypted)
      expect(decrypted).toBe(original)
    })

    it('应该解密不同类型的数据', () => {
      const original = '{"key": "value"}'
      const encrypted = encryptSensitiveData(original)
      const decrypted = decryptSensitiveData(encrypted)
      expect(decrypted).toBe(original)
    })
  })
})
