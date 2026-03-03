/**
 * 预览服务补充集成测试
 *
 * 测试覆盖：
 * - 预览服务列表
 * - 预览服务详情
 * - 服务配置管理
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { setupTestDatabase, testPrisma } from '../../helpers/test-db'
import { createTestUser, createTestAdminUser } from '../../helpers/test-data-factory'

// ============================================
// 测试套件
// ============================================

describe('预览服务补充集成测试', () => {
  setupTestDatabase()

  let adminUser: { id: string }

  beforeEach(async () => {
    adminUser = await createTestAdminUser()
  })

  // ============================================
  // 预览服务配置测试
  // ============================================

  describe('预览服务配置', () => {
    it('应该能创建 OnlyOffice 配置', async () => {
      const config = await testPrisma.previewServiceConfig.create({
        data: {
          
          serviceType: 'ONLYOFFICE',
          endpoint: 'http://onlyoffice:8080',
          isEnabled: true,
          config: JSON.stringify({ jwtSecret: 'secret-key' }),
        },
      })

      expect(config).toBeDefined()
      expect(config.serviceType).toBe('ONLYOFFICE')
      expect(config.isEnabled).toBe(true)
    })

    it('应该能创建 KKFileView 配置', async () => {
      const config = await testPrisma.previewServiceConfig.create({
        data: {
          name: 'KKFileView 服务',
          serviceType: 'KKFILEVIEW',
          endpoint: 'http://kkfileview:8012', config: '{}'$,
          isEnabled: true,
        },
      })

      expect(config.serviceType).toBe('KKFILEVIEW')
    })

    it('应该能获取所有预览服务', async () => {
      await testPrisma.previewServiceConfig.create({
        data: { name: '服务1', serviceType: 'ONLYOFFICE', endpoint: 'http://svc1:8080', isEnabled: true },
      })
      await testPrisma.previewServiceConfig.create({
        data: { name: '服务2', serviceType: 'KKFILEVIEW', endpoint: 'http://svc2:8012', isEnabled: true },
      })

      const services = await testPrisma.previewServiceConfig.findMany()
      expect(services.length).toBe(2)
    })

    it('应该能获取启用的预览服务', async () => {
      await testPrisma.previewServiceConfig.create({
        data: { name: '启用服务', serviceType: 'ONLYOFFICE', endpoint: 'http://enabled:8080', isEnabled: true },
      })
      await testPrisma.previewServiceConfig.create({
        data: {
          name: '禁用服务',
          serviceType: 'KKFILEVIEW',
          endpoint: 'http://disabled:8012',
          isEnabled: false,
        },
      })

      const enabledServices = await testPrisma.previewServiceConfig.findMany({
        where: { isEnabled: true },
      })

      expect(enabledServices.length).toBe(1)
    })

    it('应该能更新预览服务配置', async () => {
      const config = await testPrisma.previewServiceConfig.create({
        data: { name: '待更新', serviceType: 'ONLYOFFICE', endpoint: 'http://old:8080', isEnabled: true },
      })

      const updated = await testPrisma.previewServiceConfig.update({
        where: { id: config.id },
        data: { endpoint: 'http://new:8080' },
      })

      expect(updated.url).toBe('http://new:8080')
    })

    it('应该能删除预览服务配置', async () => {
      const config = await testPrisma.previewServiceConfig.create({
        data: { name: '待删除', serviceType: 'ONLYOFFICE', endpoint: 'http://delete:8080', isEnabled: true },
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

  // ============================================
  // 服务类型测试
  // ============================================

  describe('服务类型', () => {
    it('应该支持 ONLYOFFICE 类型', async () => {
      const config = await testPrisma.previewServiceConfig.create({
        data: { name: 'OnlyOffice', serviceType: 'ONLYOFFICE', endpoint: 'http://oo:8080', isEnabled: true },
      })
      expect(config.serviceType).toBe('ONLYOFFICE')
    })

    it('应该支持 KKFILEVIEW 类型', async () => {
      const config = await testPrisma.previewServiceConfig.create({
        data: { name: 'KKFileView', serviceType: 'KKFILEVIEW', endpoint: 'http://kk:8012', isEnabled: true },
      })
      expect(config.serviceType).toBe('KKFILEVIEW')
    })

    it('应该能按类型筛选服务', async () => {
      await testPrisma.previewServiceConfig.create({
        data: { name: 'OO', serviceType: 'ONLYOFFICE', endpoint: 'http://oo:8080', isEnabled: true },
      })
      await testPrisma.previewServiceConfig.create({
        data: { name: 'KK', serviceType: 'KKFILEVIEW', endpoint: 'http://kk:8012', isEnabled: true },
      })

      const onlyofficeServices = await testPrisma.previewServiceConfig.findMany({
        where: { serviceType: 'ONLYOFFICE' },
      })

      expect(onlyofficeServices.length).toBe(1)
    })
  })
})
