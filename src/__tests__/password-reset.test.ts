import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sendPasswordResetEmail } from '@/lib/email'

// Create mock function for sendSMTPEmail
const mockSendSMTPEmail = vi.fn()

// Mock the smtp module
vi.mock('@/lib/email-providers/smtp', () => ({
  sendSMTPEmail: (...args: any[]) => mockSendSMTPEmail(...args),
}))

describe('sendPasswordResetEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Test 1: Verify SMTP config exists, email sends successfully
  it('应该配置SMTP后成功发送密码重置邮件', async () => {
    mockSendSMTPEmail.mockResolvedValue({
      success: true,
      messageId: 'test-message-id',
    })

    const result = await sendPasswordResetEmail('user@example.com', 'reset-token-123', new Date())

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(mockSendSMTPEmail).toHaveBeenCalledWith(
      'user@example.com',
      expect.stringContaining('密码重置'),
      expect.stringContaining('reset-password'),
      expect.any(String)
    )
  })

  // Test 2: Verify friendly error when SMTP config missing
  it('应该在SMTP配置缺失时返回友好错误', async () => {
    mockSendSMTPEmail.mockResolvedValue({
      success: false,
      error: 'No email configuration found',
    })

    const result = await sendPasswordResetEmail('user@example.com', 'reset-token-123', new Date())

    expect(result.success).toBe(false)
    expect(result.error).toBe('No email configuration found')
  })

  // Test 3: Verify correct error returned when SMTP send fails
  it('应该在SMTP发送失败时返回错误信息', async () => {
    mockSendSMTPEmail.mockResolvedValue({
      success: false,
      error: 'SMTP connection timeout',
    })

    const result = await sendPasswordResetEmail('user@example.com', 'reset-token-123', new Date())

    expect(result.success).toBe(false)
    expect(result.error).toBe('SMTP connection timeout')
  })

  // Test 4: Verify generated reset URL format is correct
  it('应该生成正确格式的密码重置URL', async () => {
    mockSendSMTPEmail.mockResolvedValue({
      success: true,
      messageId: 'test-message-id',
    })

    const testToken = 'test-reset-token-xyz'
    await sendPasswordResetEmail('user@example.com', testToken, new Date())

    // Verify the HTML content contains correct URL format
    expect(mockSendSMTPEmail).toHaveBeenCalledWith(
      'user@example.com',
      expect.any(String),
      expect.stringContaining(`/reset-password?token=${testToken}`),
      expect.any(String)
    )
  })

  // Test 5: Verify default APP_URL is used when env variable not set
  it('应该在未设置环境变量时使用默认APP_URL', async () => {
    mockSendSMTPEmail.mockResolvedValue({
      success: true,
      messageId: 'test-message-id',
    })

    // Save original env value
    const originalEnv = process.env.NEXT_PUBLIC_APP_URL
    // Delete the env variable
    delete process.env.NEXT_PUBLIC_APP_URL

    await sendPasswordResetEmail('user@example.com', 'reset-token', new Date())

    // Verify default localhost URL is used
    expect(mockSendSMTPEmail).toHaveBeenCalledWith(
      'user@example.com',
      expect.any(String),
      expect.stringContaining('http://localhost:3000/reset-password'),
      expect.any(String)
    )

    // Restore original env value
    process.env.NEXT_PUBLIC_APP_URL = originalEnv
  })

  it('应该在设置环境变量时使用自定义APP_URL', async () => {
    mockSendSMTPEmail.mockResolvedValue({
      success: true,
      messageId: 'test-message-id',
    })

    // Set custom APP_URL
    process.env.NEXT_PUBLIC_APP_URL = 'https://custom-domain.com'

    await sendPasswordResetEmail('user@example.com', 'reset-token', new Date())

    // Verify custom URL is used
    expect(mockSendSMTPEmail).toHaveBeenCalledWith(
      'user@example.com',
      expect.any(String),
      expect.stringContaining('https://custom-domain.com/reset-password'),
      expect.any(String)
    )

    // Clean up
    delete process.env.NEXT_PUBLIC_APP_URL
  })
})
