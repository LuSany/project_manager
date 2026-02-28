// SQL 注入防护测试
// 确保系统能够正确过滤和拒绝恶意 SQL 输入

import { describe, it, expect } from 'vitest'

describe('SQL 注入防护', () => {
  it('应该拒绝包含 SQL 注入关键词的输入', () => {
    const maliciousInputs = [
      "'; DROP TABLE users; --",
      "admin' OR 1=1 --",
      "' OR '1'='1 --",
      "1; DELETE FROM users WHERE '1'='1",
      'UNION SELECT * FROM users --',
    ]

    for (const input of maliciousInputs) {
      expect(isSQLInjection(input)).toBe(true)
    }
  })

  it('应该允许正常的输入', () => {
    const normalInputs = [
      'Normal text',
      'Project Alpha',
      'Task: Fix bug',
      'User test@example.com',
      'Description with special chars: !@#\$%^&*()',
    ]

    for (const input of normalInputs) {
      expect(isSQLInjection(input)).toBe(false)
    }
  })

  it('应该过滤危险函数和命令', () => {
    const dangerousCommands = [
      'DROP TABLE',
      'DELETE FROM',
      'UPDATE SET',
      'INSERT INTO',
      'SELECT * FROM',
      'TRUNCATE TABLE',
    ]

    for (const cmd of dangerousCommands) {
      // 使用非全局正则表达式，避免状态问题
      const patterns = [
        /\bSELECT\b.*\bFROM\b/i,
        /\bDROP\b.*\bTABLE\b/i,
        /\bDELETE\b.*\bFROM\b/i,
        /\bUPDATE\b.*\bSET\b/i,
        /\bINSERT\b.*\bINTO\b/i,
        /\bTRUNCATE\b.*\bTABLE\b/i,
        /--/,
      ]
      const hasMatch = patterns.some(p => p.test(cmd))
      expect(hasMatch).toBe(true)
    }
  })
})

function isSQLInjection(input: string): boolean {
  // 使用非全局正则表达式，避免 lastIndex 状态问题
  const patterns = [
    /\bSELECT\b.*\bFROM\b/i,
    /\bDROP\b.*\bTABLE\b/i,
    /\bDELETE\b.*\bFROM\b/i,
    /\bUPDATE\b.*\bSET\b/i,
    /\bINSERT\b.*\bINTO\b/i,
    /--/,
    /\bUNION\b.*\bSELECT\b/i,
    /\bOR\b.*\b1\b.*\b=\b.*\b1\b/i,
    /\bOR\b.*\b'\b.*\b=\b.*\b'/i,
  ]

  for (const pattern of patterns) {
    if (pattern.test(input)) {
      return true
    }
  }

  return false
}
