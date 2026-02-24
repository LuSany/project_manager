import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockEncryptionKey = 'test-encryption-key-32-chars-long!'

vi.stubEnv('ENCRYPTION_KEY', mockEncryptionKey)

const {
  generateCSRFToken,
  validateCSRFToken,
  sanitizeInput,
  encryptSensitiveData,
  decryptSensitiveData,
} = await import('@/lib/security')

describe('Security Module', () => {
  describe('generateCSRFToken', () => {
    it('should generate a 64-character hex string', () => {
      const token = generateCSRFToken()
      expect(token).toHaveLength(64)
      expect(/^[a-f0-9]+$/.test(token)).toBe(true)
    })

    it('should generate different tokens each time', () => {
      const token1 = generateCSRFToken()
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

    it('should return false for invalid length token', () => {
      expect(validateCSRFToken('short')).toBe(false)
      expect(validateCSRFToken('a'.repeat(63))).toBe(false)
      expect(validateCSRFToken('a'.repeat(65))).toBe(false)
    })

    it('should return true for valid 64-character token', () => {
      const token = 'a'.repeat(64)
      expect(validateCSRFToken(token)).toBe(true)
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
