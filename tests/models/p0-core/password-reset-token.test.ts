/**
 * PasswordResetToken 模型测试 - P0 核心业务模型
 *
 * 测试覆盖:
 * - Token CRUD
 * - Token 唯一性约束
 * - 有效期验证
 * - Token 使用状态
 * - 级联删除
 *
 * 优先级：P0 - 核心业务模型
 */

import { describe, it, expect } from 'vitest'
import { testPrisma } from '../helpers/test-db'
import { createTestUser } from '../helpers/test-data-factory'

describe('PasswordResetToken Model - P0 Core', () => {
  describe('Basic CRUD', () => {
    it('should create password reset token successfully', async () => {
      const user = await createTestUser()
      const token = await testPrisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: 'test-reset-token-123456',
          expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
        },
      })

      expect(token).toBeDefined()
      expect(token.userId).toBe(user.id)
      expect(token.token).toBe('test-reset-token-123456')
      expect(token.expiresAt).toBeDefined()
      expect(token.used).toBe(false)
    })

    it('should create token with custom expiration', async () => {
      const user = await createTestUser()
      const expiresAt = new Date(Date.now() + 7200000) // 2 hours

      const token = await testPrisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: 'custom-expiry-token',
          expiresAt,
        },
      })

      expect(token.expiresAt).toEqual(expiresAt)
    })

    it('should update token to used', async () => {
      const user = await createTestUser()
      const token = await testPrisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: 'use-once-token',
          expiresAt: new Date(Date.now() + 3600000),
        },
      })

      const updated = await testPrisma.passwordResetToken.update({
        where: { id: token.id },
        data: {
          used: true,
        },
      })

      expect(updated.used).toBe(true)
    })

    it('should delete password reset token', async () => {
      const user = await createTestUser()
      const token = await testPrisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: 'delete-me-token',
          expiresAt: new Date(Date.now() + 3600000),
        },
      })

      await testPrisma.passwordResetToken.delete({
        where: { id: token.id },
      })

      const found = await testPrisma.passwordResetToken.findUnique({
        where: { id: token.id },
      })
      expect(found).toBeNull()
    })
  })

  describe('Token Uniqueness', () => {
    it('should enforce unique token', async () => {
      const user1 = await createTestUser()
      const user2 = await createTestUser()

      await testPrisma.passwordResetToken.create({
        data: {
          userId: user1.id,
          token: 'unique-token-123',
          expiresAt: new Date(Date.now() + 3600000),
        },
      })

      await expect(
        testPrisma.passwordResetToken.create({
          data: {
            userId: user2.id,
            token: 'unique-token-123', // Same token
            expiresAt: new Date(Date.now() + 3600000),
          },
        })
      ).rejects.toThrow()
    })

    it('should allow different tokens for same user', async () => {
      const user = await createTestUser()

      const token1 = await testPrisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: 'token-1',
          expiresAt: new Date(Date.now() + 3600000),
        },
      })

      const token2 = await testPrisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: 'token-2',
          expiresAt: new Date(Date.now() + 3600000),
        },
      })

      expect(token1.token).toBe('token-1')
      expect(token2.token).toBe('token-2')
    })
  })

  describe('Token Expiration', () => {
    it('should create token with future expiration', async () => {
      const user = await createTestUser()
      const expiresAt = new Date(Date.now() + 3600000) // 1 hour

      const token = await testPrisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: 'future-expiry',
          expiresAt,
        },
      })

      expect(token.expiresAt.getTime()).toBeGreaterThan(Date.now())
    })

    it('should allow creating expired token (for testing)', async () => {
      const user = await createTestUser()
      const expiredAt = new Date(Date.now() - 3600000) // 1 hour ago

      const token = await testPrisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: 'already-expired',
          expiresAt: expiredAt,
        },
      })

      expect(token.expiresAt.getTime()).toBeLessThan(Date.now())
    })

    it('should find valid (non-expired) tokens', async () => {
      const user = await createTestUser()
      const now = new Date()

      await testPrisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: 'valid-token',
          expiresAt: new Date(now.getTime() + 3600000),
        },
      })

      const validTokens = await testPrisma.passwordResetToken.findMany({
        where: {
          userId: user.id,
          expiresAt: {
            gt: now,
          },
          used: false,
        },
      })

      expect(validTokens.length).toBeGreaterThanOrEqual(1)
    })

    it('should find expired tokens', async () => {
      const user = await createTestUser()
      const now = new Date()

      await testPrisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: 'expired-token',
          expiresAt: new Date(now.getTime() - 3600000),
        },
      })

      const expiredTokens = await testPrisma.passwordResetToken.findMany({
        where: {
          userId: user.id,
          expiresAt: {
            lt: now,
          },
        },
      })

      expect(expiredTokens.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Token Usage', () => {
    it('should create token as unused (default)', async () => {
      const user = await createTestUser()

      const token = await testPrisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: 'fresh-token',
          expiresAt: new Date(Date.now() + 3600000),
        },
      })

      expect(token.used).toBe(false)
    })

    it('should mark token as used', async () => {
      const user = await createTestUser()

      const token = await testPrisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: 'to-be-used',
          expiresAt: new Date(Date.now() + 3600000),
        },
      })

      const used = await testPrisma.passwordResetToken.update({
        where: { id: token.id },
        data: { used: true },
      })

      expect(used.used).toBe(true)
    })

    it('should find unused tokens', async () => {
      const user = await createTestUser()

      await testPrisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: 'unused-1',
          expiresAt: new Date(Date.now() + 3600000),
        },
      })

      await testPrisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: 'unused-2',
          expiresAt: new Date(Date.now() + 3600000),
          used: false,
        },
      })

      const unusedTokens = await testPrisma.passwordResetToken.findMany({
        where: {
          userId: user.id,
          used: false,
        },
      })

      expect(unusedTokens.length).toBeGreaterThanOrEqual(2)
    })

    it('should find used tokens', async () => {
      const user = await createTestUser()

      const token = await testPrisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: 'used-token',
          expiresAt: new Date(Date.now() + 3600000),
          used: true,
        },
      })

      const usedTokens = await testPrisma.passwordResetToken.findMany({
        where: {
          userId: user.id,
          used: true,
        },
      })

      expect(usedTokens.length).toBeGreaterThanOrEqual(1)
      expect(usedTokens[0].token).toBe('used-token')
    })
  })

  describe('User Relationship', () => {
    it('should associate token with user', async () => {
      const user = await createTestUser()

      const token = await testPrisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: 'user-token',
          expiresAt: new Date(Date.now() + 3600000),
        },
      })

      expect(token.userId).toBe(user.id)

      // Verify from user side
      const userWithTokens = await testPrisma.user.findUnique({
        where: { id: user.id },
        include: {
          passwordResetTokens: true,
        },
      })

      expect(userWithTokens?.passwordResetTokens).toHaveLength(1)
    })

    it('should query tokens with user info', async () => {
      const user = await createTestUser({
        email: 'token-test@example.com',
        name: 'Token Test User',
      })

      const token = await testPrisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: 'with-user-info',
          expiresAt: new Date(Date.now() + 3600000),
        },
      })

      const tokenWithUser = await testPrisma.passwordResetToken.findUnique({
        where: { id: token.id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      expect(tokenWithUser?.user.email).toBe('token-test@example.com')
    })
  })

  describe('Cascade Delete', () => {
    it('should delete token when user deleted', async () => {
      const user = await createTestUser()

      const token = await testPrisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: 'cascade-delete-token',
          expiresAt: new Date(Date.now() + 3600000),
        },
      })

      await testPrisma.user.delete({
        where: { id: user.id },
      })

      const found = await testPrisma.passwordResetToken.findUnique({
        where: { id: token.id },
      })

      expect(found).toBeNull()
    })
  })

  describe('Query Operations', () => {
    it('should find token by token string', async () => {
      const user = await createTestUser()

      const token = await testPrisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: 'find-by-string',
          expiresAt: new Date(Date.now() + 3600000),
        },
      })

      const found = await testPrisma.passwordResetToken.findFirst({
        where: {
          token: 'find-by-string',
        },
      })

      expect(found).toBeDefined()
      expect(found?.id).toBe(token.id)
    })

    it('should find tokens by userId', async () => {
      const user = await createTestUser()

      await testPrisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: 'token-1',
          expiresAt: new Date(Date.now() + 3600000),
        },
      })

      await testPrisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: 'token-2',
          expiresAt: new Date(Date.now() + 3600000),
        },
      })

      const tokens = await testPrisma.passwordResetToken.findMany({
        where: {
          userId: user.id,
        },
      })

      expect(tokens).toHaveLength(2)
    })

    it('should find valid reset tokens for user', async () => {
      const user = await createTestUser()
      const now = new Date()

      // Create valid token
      await testPrisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: 'valid-reset-token',
          expiresAt: new Date(now.getTime() + 3600000),
          used: false,
        },
      })

      // Create expired token
      await testPrisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: 'expired-reset-token',
          expiresAt: new Date(now.getTime() - 3600000),
          used: false,
        },
      })

      const validTokens = await testPrisma.passwordResetToken.findMany({
        where: {
          userId: user.id,
          expiresAt: { gt: now },
          used: false,
        },
      })

      expect(validTokens).toHaveLength(1)
      expect(validTokens[0].token).toBe('valid-reset-token')
    })

    it('should order tokens by createdAt', async () => {
      const user = await createTestUser()

      const token1 = await testPrisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: 'first-token',
          expiresAt: new Date(Date.now() + 3600000),
        },
      })

      const tokens = await testPrisma.passwordResetToken.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' },
      })

      expect(tokens.length).toBeGreaterThanOrEqual(1)
      expect(tokens[0].token).toBe('first-token')
    })
  })
})
