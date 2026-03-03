/**
 * 模板管理补充集成测试
 *
 * 测试覆盖：
 * - 通用模板 CRUD
 * - 评审模板详情
 * - 类型种子数据
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { setupTestDatabase, testPrisma } from '../../helpers/test-db'
import { createTestUser, createTestReviewTypeConfig } from '../../helpers/test-data-factory'

// ============================================
// 测试套件
// ============================================

describe('模板管理补充集成测试', () => {
  setupTestDatabase()

  let testUser: { id: string }

  beforeEach(async () => {
    testUser = await createTestUser()
  })

  // ============================================
  // 评审模板测试
  // ============================================

  describe('评审模板管理', () => {
    it('应该能创建评审模板', async () => {
      const reviewType = await createTestReviewTypeConfig()

      const template = await testPrisma.reviewTemplate.create({
        data: {
          name: '代码评审模板',
          description: '标准代码评审检查项',
          typeId: reviewType.id,
          isActive: true,
        },
      })

      expect(template).toBeDefined()
      expect(template.name).toBe('代码评审模板')
    })

    it('应该能获取所有评审模板', async () => {
      const reviewType = await createTestReviewTypeConfig()

      await testPrisma.reviewTemplate.create({
        data: { name: '模板1', typeId: reviewType.id },
      })
      await testPrisma.reviewTemplate.create({
        data: { name: '模板2', typeId: reviewType.id },
      })

      const templates = await testPrisma.reviewTemplate.findMany()
      expect(templates.length).toBe(2)
    })

    it('应该能创建模板检查项', async () => {
      const reviewType = await createTestReviewTypeConfig()
      const template = await testPrisma.reviewTemplate.create({
        data: { name: '测试模板', typeId: reviewType.id },
      })

      const item = await testPrisma.reviewTemplateItem.create({
        data: {
          templateId: template.id,
          title: '代码规范检查',
          content: '检查代码是否符合规范',
          required: true,
          order: 1,
        },
      })

      expect(item).toBeDefined()
      expect(item.required).toBe(true)
    })

    it('应该能查询模板的所有检查项', async () => {
      const reviewType = await createTestReviewTypeConfig()
      const template = await testPrisma.reviewTemplate.create({
        data: { name: '测试模板', typeId: reviewType.id },
      })

      await testPrisma.reviewTemplateItem.create({
        data: { templateId: template.id, title: '检查项1', order: 1 },
      })
      await testPrisma.reviewTemplateItem.create({
        data: { templateId: template.id, title: '检查项2', order: 2 },
      })

      const items = await testPrisma.reviewTemplateItem.findMany({
        where: { templateId: template.id },
        orderBy: { order: 'asc' },
      })

      expect(items.length).toBe(2)
    })
  })

  // ============================================
  // 评审类型配置测试
  // ============================================

  describe('评审类型配置', () => {
    it('应该能创建评审类型', async () => {
      const type = await createTestReviewTypeConfig({ name: 'DESIGN' })
      expect(type.name).toContain('DESIGN')
    })

    it('应该能获取所有评审类型', async () => {
      await createTestReviewTypeConfig({ name: 'FEASIBILITY' })
      await createTestReviewTypeConfig({ name: 'MILESTONE' })

      const types = await testPrisma.reviewTypeConfig.findMany()
      expect(types.length).toBeGreaterThanOrEqual(2)
    })

    it('应该能更新评审类型', async () => {
      const type = await createTestReviewTypeConfig()

      const updated = await testPrisma.reviewTypeConfig.update({
        where: { id: type.id },
        data: { displayName: '更新后的名称' },
      })

      expect(updated.displayName).toBe('更新后的名称')
    })

    it('应该能禁用评审类型', async () => {
      const type = await createTestReviewTypeConfig()

      const updated = await testPrisma.reviewTypeConfig.update({
        where: { id: type.id },
        data: { isActive: false },
      })

      expect(updated.isActive).toBe(false)
    })
  })
})
