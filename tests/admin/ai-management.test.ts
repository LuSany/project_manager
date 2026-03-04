/**
 * AI Management 管理员测试 - 管理员后台专项测试
 *
 * 测试覆盖:
 * - AI Provider 配置（OpenAI/Anthropic/自定义）
 * - AI 日志记录与查询
 * - AI 响应缓存管理
 * - Provider 切换与故障转移
 *
 * 管理员后台专项 - Phase 2
 */

import { describe, it, expect } from 'vitest'
import { testPrisma } from '../../helpers/test-db'
import { createTestUser } from '../../helpers/test-data-factory'

describe('Admin - AI Management', () => {
  describe('AI Provider Config CRUD', () => {
    it('should create OpenAI config successfully', async () => {
      const admin = await createTestUser({ role: 'ADMIN' })

      const config = await testPrisma.aIConfig.create({
        data: {
          name: 'OpenAI Production',
          provider: 'OPENAI',
          apiKey: 'sk-openai-key-xxxxx',
          model: 'gpt-4o',
          baseUrl: 'https://api.openai.com/v1',
          isActive: true,
          isDefault: true,
        },
      })

      expect(config).toBeDefined()
      expect(config.provider).toBe('OPENAI')
      expect(config.model).toBe('gpt-4o')
      expect(config.isActive).toBe(true)
    })

    it('should create Anthropic config', async () => {
      const admin = await createTestUser({ role: 'ADMIN' })

      const config = await testPrisma.aIConfig.create({
        data: {
          name: 'Anthropic Claude',
          provider: 'ANTHROPIC',
          apiKey: 'sk-ant-key-xxxxx',
          model: 'claude-3-opus-20240229',
          baseUrl: 'https://api.anthropic.com',
          isActive: true,
        },
      })

      expect(config.provider).toBe('ANTHROPIC')
      expect(config.model).toBe('claude-3-opus-20240229')
    })

    it('should create custom provider config', async () => {
      const admin = await createTestUser({ role: 'ADMIN' })

      const config = await testPrisma.aIConfig.create({
        data: {
          name: 'Internal LLM',
          provider: 'CUSTOM',
          apiKey: 'internal-key',
          model: 'custom-model-v1',
          baseUrl: 'https://llm.internal.company.com',
          isActive: true,
        },
      })

      expect(config.provider).toBe('CUSTOM')
      expect(config.baseUrl).toBe('https://llm.internal.company.com')
    })

    it('should update AI config', async () => {
      const config = await testPrisma.aIConfig.create({
        data: {
          name: 'Original Config',
          provider: 'OPENAI',
          apiKey: 'old-key',
          model: 'gpt-3.5-turbo',
        },
      })

      const updated = await testPrisma.aIConfig.update({
        where: { id: config.id },
        data: {
          model: 'gpt-4o',
          apiKey: 'new-key',
        },
      })

      expect(updated.model).toBe('gpt-4o')
    })

    it('should delete AI config', async () => {
      const config = await testPrisma.aIConfig.create({
        data: {
          name: 'To Delete',
          provider: 'OPENAI',
          apiKey: 'delete-key',
        },
      })

      await testPrisma.aIConfig.delete({
        where: { id: config.id },
      })

      const found = await testPrisma.aIConfig.findUnique({
        where: { id: config.id },
      })
      expect(found).toBeNull()
    })
  })

  describe('Provider Activation', () => {
    it('should activate AI provider', async () => {
      const config = await testPrisma.aIConfig.create({
        data: {
          name: 'Inactive Provider',
          provider: 'OPENAI',
          apiKey: 'key',
          isActive: false,
        },
      })

      const activated = await testPrisma.aIConfig.update({
        where: { id: config.id },
        data: { isActive: true },
      })

      expect(activated.isActive).toBe(true)
    })

    it('should deactivate AI provider', async () => {
      const config = await testPrisma.aIConfig.create({
        data: {
          name: 'Active Provider',
          provider: 'ANTHROPIC',
          apiKey: 'key',
          isActive: true,
        },
      })

      const deactivated = await testPrisma.aIConfig.update({
        where: { id: config.id },
        data: { isActive: false },
      })

      expect(deactivated.isActive).toBe(false)
    })

    it('should set default provider', async () => {
      const config = await testPrisma.aIConfig.create({
        data: {
          name: 'Default Provider',
          provider: 'OPENAI',
          apiKey: 'key',
          isDefault: true,
          isActive: true,
        },
      })

      expect(config.isDefault).toBe(true)
    })

    it('should switch default provider', async () => {
      const provider1 = await testPrisma.aIConfig.create({
        data: {
          name: 'Old Default',
          provider: 'OPENAI',
          apiKey: 'key1',
          isDefault: true,
          isActive: true,
        },
      })

      const provider2 = await testPrisma.aIConfig.create({
        data: {
          name: 'New Default',
          provider: 'ANTHROPIC',
          apiKey: 'key2',
          isDefault: false,
          isActive: true,
        },
      })

      await testPrisma.aIConfig.update({
        where: { id: provider1.id },
        data: { isDefault: false },
      })

      await testPrisma.aIConfig.update({
        where: { id: provider2.id },
        data: { isDefault: true },
      })

      const newDefault = await testPrisma.aIConfig.findFirst({
        where: { isDefault: true },
      })

      expect(newDefault?.id).toBe(provider2.id)
      expect(newDefault?.provider).toBe('ANTHROPIC')
    })
  })

  describe('AI Service Types', () => {
    it('should configure provider for specific service type', async () => {
      const config = await testPrisma.aIConfig.create({
        data: {
          name: 'Risk Analysis Provider',
          provider: 'OPENAI',
          apiKey: 'key',
          serviceType: 'RISK_ANALYSIS',
          isActive: true,
        },
      })

      expect(config.serviceType).toBe('RISK_ANALYSIS')
    })

    it('should configure provider for review audit', async () => {
      const config = await testPrisma.aIConfig.create({
        data: {
          name: 'Review Audit Provider',
          provider: 'ANTHROPIC',
          apiKey: 'key',
          serviceType: 'REVIEW_AUDIT',
          isActive: true,
        },
      })

      expect(config.serviceType).toBe('REVIEW_AUDIT')
    })

    it('should find providers by service type', async () => {
      await testPrisma.aIConfig.create({
        data: {
          name: 'Risk Provider 1',
          provider: 'OPENAI',
          apiKey: 'key1',
          serviceType: 'RISK_ANALYSIS',
          isActive: true,
        },
      })

      await testPrisma.aIConfig.create({
        data: {
          name: 'Review Provider',
          provider: 'ANTHROPIC',
          apiKey: 'key2',
          serviceType: 'REVIEW_AUDIT',
          isActive: true,
        },
      })

      await testPrisma.aIConfig.create({
        data: {
          name: 'Risk Provider 2',
          provider: 'CUSTOM',
          apiKey: 'key3',
          serviceType: 'RISK_ANALYSIS',
          isActive: true,
        },
      })

      const riskProviders = await testPrisma.aIConfig.findMany({
        where: {
          serviceType: 'RISK_ANALYSIS',
          isActive: true,
        },
      })

      expect(riskProviders).toHaveLength(2)
    })
  })

  describe('AI Provider Failover', () => {
    it('should configure multiple providers for failover', async () => {
      const primary = await testPrisma.aIConfig.create({
        data: {
          name: 'Primary OpenAI',
          provider: 'OPENAI',
          apiKey: 'primary-key',
          model: 'gpt-4o',
          priority: 1,
          isActive: true,
          isDefault: true,
        },
      })

      const backup = await testPrisma.aIConfig.create({
        data: {
          name: 'Backup Anthropic',
          provider: 'ANTHROPIC',
          apiKey: 'backup-key',
          model: 'claude-3-opus',
          priority: 2,
          isActive: true,
        },
      })

      const fallback = await testPrisma.aIConfig.create({
        data: {
          name: 'Fallback Internal',
          provider: 'CUSTOM',
          apiKey: 'fallback-key',
          model: 'internal-model',
          priority: 3,
          isActive: true,
        },
      })

      const providers = await testPrisma.aIConfig.findMany({
        where: { isActive: true },
        orderBy: { priority: 'asc' },
      })

      expect(providers).toHaveLength(3)
      expect(providers[0].priority).toBe(1)
      expect(providers[1].priority).toBe(2)
      expect(providers[2].priority).toBe(3)
    })
  })

  describe('AI Query & Filter', () => {
    it('should find active providers', async () => {
      await testPrisma.aIConfig.create({
        data: {
          name: 'Active Provider 1',
          provider: 'OPENAI',
          apiKey: 'key1',
          isActive: true,
        },
      })

      await testPrisma.aIConfig.create({
        data: {
          name: 'Inactive Provider',
          provider: 'ANTHROPIC',
          apiKey: 'key2',
          isActive: false,
        },
      })

      await testPrisma.aIConfig.create({
        data: {
          name: 'Active Provider 2',
          provider: 'CUSTOM',
          apiKey: 'key3',
          isActive: true,
        },
      })

      const active = await testPrisma.aIConfig.findMany({
        where: { isActive: true },
      })

      expect(active).toHaveLength(2)
    })

    it('should find providers by provider type', async () => {
      await testPrisma.aIConfig.create({
        data: {
          name: 'OpenAI Provider',
          provider: 'OPENAI',
          apiKey: 'key',
        },
      })

      await testPrisma.aIConfig.create({
        data: {
          name: 'Anthropic Provider',
          provider: 'ANTHROPIC',
          apiKey: 'key',
        },
      })

      const openai = await testPrisma.aIConfig.findMany({
        where: { provider: 'OPENAI' },
      })

      expect(openai).toHaveLength(1)
      expect(openai[0].provider).toBe('OPENAI')
    })

    it('should get default provider', async () => {
      await testPrisma.aIConfig.create({
        data: {
          name: 'Non-Default',
          provider: 'OPENAI',
          apiKey: 'key1',
          isDefault: false,
        },
      })

      await testPrisma.aIConfig.create({
        data: {
          name: 'Default Provider',
          provider: 'ANTHROPIC',
          apiKey: 'key2',
          isDefault: true,
          isActive: true,
        },
      })

      const defaultProvider = await testPrisma.aIConfig.findFirst({
        where: {
          isDefault: true,
          isActive: true,
        },
      })

      expect(defaultProvider).toBeDefined()
      expect(defaultProvider?.name).toBe('Default Provider')
    })
  })

  describe('Provider Model Configuration', () => {
    it('should configure model parameters', async () => {
      const config = await testPrisma.aIConfig.create({
        data: {
          name: 'Configured Model',
          provider: 'OPENAI',
          apiKey: 'key',
          model: 'gpt-4o',
          maxTokens: 4096,
          temperature: 0.7,
          isActive: true,
        },
      })

      expect(config.model).toBe('gpt-4o')
      expect(config.maxTokens).toBe(4096)
      expect(config.temperature).toBe(0.7)
    })

    it('should update model parameters', async () => {
      const config = await testPrisma.aIConfig.create({
        data: {
          name: 'Updatable Model',
          provider: 'OPENAI',
          apiKey: 'key',
          model: 'gpt-3.5-turbo',
          maxTokens: 2048,
        },
      })

      const updated = await testPrisma.aIConfig.update({
        where: { id: config.id },
        data: {
          model: 'gpt-4o',
          maxTokens: 8192,
          temperature: 0.5,
        },
      })

      expect(updated.model).toBe('gpt-4o')
      expect(updated.maxTokens).toBe(8192)
      expect(updated.temperature).toBe(0.5)
    })
  })
})
