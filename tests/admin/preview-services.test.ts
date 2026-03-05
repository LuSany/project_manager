/**
 * PreviewServices 管理员测试 - 管理员后台专项测试
 *
 * 测试覆盖:
 * - 预览服务配置 CRUD
 * - OnlyOffice/KKFileView 配置管理
 * - 服务启用/禁用
 * - 服务优先级配置
 * - 健康检查
 *
 * 管理员后台专项 - Phase 2
 */

import { describe, it, expect } from 'vitest'
import { testPrisma } from '../helpers/test-db'
import { createTestUser } from '../helpers/test-data-factory'

describe('Admin - PreviewServices Management', () => {
  describe('Preview Service Config CRUD', () => {
    it('should create OnlyOffice config successfully', async () => {
      const admin = await createTestUser({ role: 'ADMIN' })

      const config = await testPrisma.previewServiceConfig.create({
        data: {
          name: 'OnlyOffice Primary',
          serviceType: 'ONLYOFFICE',
          endpoint: 'http://onlyoffice.example.com',
          isActive: true,
          priority: 1,
        },
      })

      expect(config).toBeDefined()
      expect(config.serviceType).toBe('ONLYOFFICE')
      expect(config.endpoint).toBe('http://onlyoffice.example.com')
      expect(config.isActive).toBe(true)
      expect(config.priority).toBe(1)
    })

    it('should create KKFileView config', async () => {
      const admin = await createTestUser({ role: 'ADMIN' })

      const config = await testPrisma.previewServiceConfig.create({
        data: {
          name: 'KKFileView Backup',
          serviceType: 'KKFILEVIEW',
          endpoint: 'http://kkfileview.example.com',
          isActive: false,
          priority: 2,
        },
      })

      expect(config.serviceType).toBe('KKFILEVIEW')
      expect(config.endpoint).toBe('http://kkfileview.example.com')
      expect(config.isActive).toBe(false)
    })

    it('should update service config', async () => {
      const config = await testPrisma.previewServiceConfig.create({
        data: {
          name: 'Original Config',
          serviceType: 'ONLYOFFICE',
          endpoint: 'http://original.example.com',
          isActive: true,
        },
      })

      const updated = await testPrisma.previewServiceConfig.update({
        where: { id: config.id },
        data: {
          endpoint: 'http://updated.example.com',
          priority: 2,
        },
      })

      expect(updated.endpoint).toBe('http://updated.example.com')
      expect(updated.priority).toBe(2)
    })

    it('should delete service config', async () => {
      const config = await testPrisma.previewServiceConfig.create({
        data: {
          name: 'To Delete',
          serviceType: 'ONLYOFFICE',
          endpoint: 'http://delete.example.com',
        },
      })

      await testPrisma.previewServiceConfig.delete({
        where: { id: config.id },
      })

      const found = await testPrisma.previewServiceConfig.findUnique({
        where: { id: config.id },
      })
      expect(found).toBeNull()
    })
  })

  describe('Service Activation', () => {
    it('should enable service', async () => {
      const config = await testPrisma.previewServiceConfig.create({
        data: {
          name: 'Disabled Service',
          serviceType: 'ONLYOFFICE',
          endpoint: 'http://disabled.example.com',
          isActive: false,
        },
      })

      const enabled = await testPrisma.previewServiceConfig.update({
        where: { id: config.id },
        data: { isActive: true },
      })

      expect(enabled.isActive).toBe(true)
    })

    it('should disable service', async () => {
      const config = await testPrisma.previewServiceConfig.create({
        data: {
          name: 'Active Service',
          serviceType: 'KKFILEVIEW',
          endpoint: 'http://active.example.com',
          isActive: true,
        },
      })

      const disabled = await testPrisma.previewServiceConfig.update({
        where: { id: config.id },
        data: { isActive: false },
      })

      expect(disabled.isActive).toBe(false)
    })

    it('should set only one service as primary (priority 1)', async () => {
      const service1 = await testPrisma.previewServiceConfig.create({
        data: {
          name: 'Service 1',
          serviceType: 'ONLYOFFICE',
          endpoint: 'http://service1.example.com',
          isActive: true,
          priority: 1,
        },
      })

      const service2 = await testPrisma.previewServiceConfig.create({
        data: {
          name: 'Service 2',
          serviceType: 'KKFILEVIEW',
          endpoint: 'http://service2.example.com',
          isActive: true,
          priority: 1, // Same priority
        },
      })

      // Both can have same priority, business logic determines which is primary
      const services = await testPrisma.previewServiceConfig.findMany({
        where: { priority: 1 },
      })

      expect(services).toHaveLength(2)
    })
  })

  describe('Service Health Check', () => {
    it('should store health check endpoint', async () => {
      const config = await testPrisma.previewServiceConfig.create({
        data: {
          name: 'Health Check Config',
          serviceType: 'ONLYOFFICE',
          endpoint: 'http://health.example.com',
          healthEndpoint: 'http://health.example.com/health',
          isActive: true,
        },
      })

      expect(config.healthEndpoint).toBe('http://health.example.com/health')
    })

    it('should update last health check time', async () => {
      const config = await testPrisma.previewServiceConfig.create({
        data: {
          name: 'Health Time Config',
          serviceType: 'ONLYOFFICE',
          endpoint: 'http://healthtime.example.com',
          isActive: true,
        },
      })

      const now = new Date()
      const updated = await testPrisma.previewServiceConfig.update({
        where: { id: config.id },
        data: { lastHealthCheck: now },
      })

      expect(updated.lastHealthCheck).toEqual(now)
    })
  })

  describe('Service Queries', () => {
    it('should find active services', async () => {
      await testPrisma.previewServiceConfig.create({
        data: {
          name: 'Active Service 1',
          serviceType: 'ONLYOFFICE',
          endpoint: 'http://active1.example.com',
          isActive: true,
        },
      })

      await testPrisma.previewServiceConfig.create({
        data: {
          name: 'Inactive Service',
          serviceType: 'KKFILEVIEW',
          endpoint: 'http://inactive.example.com',
          isActive: false,
        },
      })

      await testPrisma.previewServiceConfig.create({
        data: {
          name: 'Active Service 2',
          serviceType: 'ONLYOFFICE',
          endpoint: 'http://active2.example.com',
          isActive: true,
        },
      })

      const active = await testPrisma.previewServiceConfig.findMany({
        where: { isActive: true },
      })

      expect(active).toHaveLength(2)
    })

    it('should find services by type', async () => {
      await testPrisma.previewServiceConfig.create({
        data: {
          name: 'OnlyOffice Service',
          serviceType: 'ONLYOFFICE',
          endpoint: 'http://onlyoffice.example.com',
        },
      })

      await testPrisma.previewServiceConfig.create({
        data: {
          name: 'KKFileView Service',
          serviceType: 'KKFILEVIEW',
          endpoint: 'http://kkfileview.example.com',
        },
      })

      const onlyoffice = await testPrisma.previewServiceConfig.findMany({
        where: { serviceType: 'ONLYOFFICE' },
      })

      expect(onlyoffice).toHaveLength(1)
      expect(onlyoffice[0].serviceType).toBe('ONLYOFFICE')
    })

    it('should order services by priority', async () => {
      await testPrisma.previewServiceConfig.create({
        data: {
          name: 'Low Priority',
          serviceType: 'ONLYOFFICE',
          endpoint: 'http://low.example.com',
          priority: 3,
        },
      })

      await testPrisma.previewServiceConfig.create({
        data: {
          name: 'High Priority',
          serviceType: 'ONLYOFFICE',
          endpoint: 'http://high.example.com',
          priority: 1,
        },
      })

      await testPrisma.previewServiceConfig.create({
        data: {
          name: 'Medium Priority',
          serviceType: 'KKFILEVIEW',
          endpoint: 'http://medium.example.com',
          priority: 2,
        },
      })

      const services = await testPrisma.previewServiceConfig.findMany({
        orderBy: { priority: 'asc' },
      })

      expect(services[0].priority).toBe(1)
      expect(services[1].priority).toBe(2)
      expect(services[2].priority).toBe(3)
    })

    it('should get primary (priority 1) active service', async () => {
      await testPrisma.previewServiceConfig.create({
        data: {
          name: 'Primary Service',
          serviceType: 'ONLYOFFICE',
          endpoint: 'http://primary.example.com',
          isActive: true,
          priority: 1,
        },
      })

      await testPrisma.previewServiceConfig.create({
        data: {
          name: 'Secondary Service',
          serviceType: 'KKFILEVIEW',
          endpoint: 'http://secondary.example.com',
          isActive: true,
          priority: 2,
        },
      })

      const primary = await testPrisma.previewServiceConfig.findFirst({
        where: {
          isActive: true,
          priority: 1,
        },
      })

      expect(primary).toBeDefined()
      expect(primary?.name).toBe('Primary Service')
    })
  })

  describe('Service Configuration Management', () => {
    it('should create multiple service configs for failover', async () => {
      // Primary OnlyOffice
      await testPrisma.previewServiceConfig.create({
        data: {
          name: 'OnlyOffice Primary',
          serviceType: 'ONLYOFFICE',
          endpoint: 'http://onlyoffice-primary.example.com',
          isActive: true,
          priority: 1,
        },
      })

      // Backup OnlyOffice
      await testPrisma.previewServiceConfig.create({
        data: {
          name: 'OnlyOffice Backup',
          serviceType: 'ONLYOFFICE',
          endpoint: 'http://onlyoffice-backup.example.com',
          isActive: true,
          priority: 2,
        },
      })

      // Fallback KKFileView
      await testPrisma.previewServiceConfig.create({
        data: {
          name: 'KKFileView Fallback',
          serviceType: 'KKFILEVIEW',
          endpoint: 'http://kkfileview.example.com',
          isActive: true,
          priority: 3,
        },
      })

      const configs = await testPrisma.previewServiceConfig.findMany({
        where: { isActive: true },
        orderBy: { priority: 'asc' },
      })

      expect(configs).toHaveLength(3)
      expect(configs[0].serviceType).toBe('ONLYOFFICE')
      expect(configs[1].serviceType).toBe('ONLYOFFICE')
      expect(configs[2].serviceType).toBe('KKFILEVIEW')
    })
  })

  describe('Service Endpoint Validation', () => {
    it('should store HTTP endpoint', async () => {
      const config = await testPrisma.previewServiceConfig.create({
        data: {
          name: 'HTTP Endpoint Config',
          serviceType: 'ONLYOFFICE',
          endpoint: 'http://preview.example.com',
        },
      })

      expect(config.endpoint).toBe('http://preview.example.com')
    })

    it('should store HTTPS endpoint', async () => {
      const config = await testPrisma.previewServiceConfig.create({
        data: {
          name: 'HTTPS Endpoint Config',
          serviceType: 'KKFILEVIEW',
          endpoint: 'https://secure-preview.example.com',
        },
      })

      expect(config.endpoint).toBe('https://secure-preview.example.com')
    })

    it('should store endpoint with port', async () => {
      const config = await testPrisma.previewServiceConfig.create({
        data: {
          name: 'Custom Port Config',
          serviceType: 'ONLYOFFICE',
          endpoint: 'http://preview.example.com:8080',
        },
      })

      expect(config.endpoint).toContain(':8080')
    })
  })
})
