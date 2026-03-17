import { describe, it, expect } from 'vitest'
import { validateFilePath } from '@/lib/file-security'

describe('file-security', () => {
  it('should reject empty path', () => {
    const result = validateFilePath('')
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('空')
  })

  it('should reject relative path', () => {
    const result = validateFilePath('uploads/file.txt')
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('绝对路径')
  })

  it('should reject path traversal attack', () => {
    const result = validateFilePath('/etc/passwd')
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('允许的目录')
  })

  it('should reject path with ..', () => {
    const result = validateFilePath('/home/user/uploads/../../../etc/passwd')
    expect(result.valid).toBe(false)
  })

  it('should accept valid path in uploads directory', () => {
    const result = validateFilePath(`${process.cwd()}/uploads/test.txt`)
    expect(result.valid).toBe(true)
  })
})
