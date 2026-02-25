// SQL 注入防护测试
// 确保系统能够正确过滤和拒绝恶意 SQL 输入

import { describe, it, expect } from 'vitest'
import { Plugin } from 'vite'

describe('SQL 注入防护', () => {
  it('应该拒绝包含 SQL 注入关键词的输入', () => {
    // 这是一个 SQL 注入检测示例
    const maliciousInputs = [
      "'; DROP TABLE users; --",
      "admin' OR 1=1 --",
      "' OR '1'='1 --",
      "1; DELETE FROM users WHERE '1'='1",
      'UNION SELECT * FROM users --',
    ]

    // 验证每个恶意输入
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
      'Description with special chars: !@#$%^&*()',
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
      expect(isSQLInjection(cmd)).toBe(true)
    }
  })
})

/**
 * 简单的 SQL 注入检测函数
 * @param input - 待检测的输入
 * @returns 是否为 SQL 注入
 */
function isSQLInjection(input: string): boolean {
  const sqlKeywords = [
    /(\bSELECT\b.*\bFROM\b)/gi,
    /(\bDROP\b.*\bTABLE\b)/gi,
    /(\bDELETE\b.*\bFROM\b)/gi,
    /(\bUPDATE\b.*\bSET\b)/gi,
    /(\bINSERT\b.*\bINTO\b)/gi,
    /(--)/g,
    /(\bUNION\b.*\bSELECT\b)/gi,
    /(\bOR\b.*\b1\b.*\b=\b.*\b1\b)/gi,
    /(\bOR\b.*\b'\b.*\b=\b.*\b')/gi,
  ]

  for (const pattern of sqlKeywords) {
    if (pattern.test(input)) {
      return true
    }
  }

  return false
}
