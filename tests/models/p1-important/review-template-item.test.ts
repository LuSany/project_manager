/**
 * ReviewTemplateItem 模型测试 - P1 重要业务模型
 *
 * 测试覆盖:
 * - CRUD 操作
 * - 模板项管理
 * - 与模板的关联关系
 * - 模板项顺序和必填状态
 *
 * 优先级：P1 - 重要业务模型
 */

import { describe, it, expect } from 'vitest'
import { testPrisma } from '../helpers/test-db'
import {
  createTestUser,
  createTestProject,
  createTestReviewTypeConfig,
  createTestReviewTemplate,
} from '../helpers/test-data-factory'

describe('ReviewTemplateItem Model - P1 Core', () => {
  describe('Basic CRUD', () => {
    it('should create template item successfully', async () => {
      const type = await createTestReviewTypeConfig()
      const template = await createTestReviewTemplate(type.id)

      const item = await testPrisma.reviewTemplateItem.create({
        data: {
          templateId: template.id,
          name: 'Code Quality Check',
          description: 'Verify code quality standards',
          order: 1,
          isRequired: true,
        },
      })

      expect(item).toBeDefined()
      expect(item.templateId).toBe(template.id)
      expect(item.name).toBe('Code Quality Check')
      expect(item.order).toBe(1)
      expect(item.isRequired).toBe(true)
    })

    it('should create item with all fields', async () => {
      const type = await createTestReviewTypeConfig()
      const template = await createTestReviewTemplate(type.id)

      const item = await testPrisma.reviewTemplateItem.create({
        data: {
          templateId: template.id,
          name: 'Complete Item',
          description: 'Full featured template item',
          order: 1,
          isRequired: true,
          category: 'Technical',
        },
      })

      expect(item.category).toBe('Technical')
    })

    it('should update template item', async () => {
      const type = await createTestReviewTypeConfig()
      const template = await createTestReviewTemplate(type.id)

      const item = await testPrisma.reviewTemplateItem.create({
        data: {
          templateId: template.id,
          name: 'Original Name',
          order: 1,
        },
      })

      const updated = await testPrisma.reviewTemplateItem.update({
        where: { id: item.id },
        data: {
          name: 'Updated Name',
          isRequired: false,
        },
      })

      expect(updated.name).toBe('Updated Name')
      expect(updated.isRequired).toBe(false)
    })

    it('should delete template item', async () => {
      const type = await createTestReviewTypeConfig()
      const template = await createTestReviewTemplate(type.id)

      const item = await testPrisma.reviewTemplateItem.create({
        data: {
          templateId: template.id,
          name: 'To Delete',
          order: 1,
        },
      })

      await testPrisma.reviewTemplateItem.delete({
        where: { id: item.id },
      })

      const found = await testPrisma.reviewTemplateItem.findUnique({
        where: { id: item.id },
      })
      expect(found).toBeNull()
    })
  })

  describe('Required Status', () => {
    it('should create required item', async () => {
      const type = await createTestReviewTypeConfig()
      const template = await createTestReviewTemplate(type.id)

      const item = await testPrisma.reviewTemplateItem.create({
        data: {
          templateId: template.id,
          name: 'Required Item',
          isRequired: true,
        },
      })

      expect(item.isRequired).toBe(true)
    })

    it('should create optional item', async () => {
      const type = await createTestReviewTypeConfig()
      const template = await createTestReviewTemplate(type.id)

      const item = await testPrisma.reviewTemplateItem.create({
        data: {
          templateId: template.id,
          name: 'Optional Item',
          isRequired: false,
        },
      })

      expect(item.isRequired).toBe(false)
    })

    it('should toggle required status', async () => {
      const type = await createTestReviewTypeConfig()
      const template = await createTestReviewTemplate(type.id)

      const item = await testPrisma.reviewTemplateItem.create({
        data: {
          templateId: template.id,
          name: 'Toggle Test',
          isRequired: true,
        },
      })

      const updated = await testPrisma.reviewTemplateItem.update({
        where: { id: item.id },
        data: { isRequired: false },
      })

      expect(updated.isRequired).toBe(false)
    })
  })

  describe('Item Ordering', () => {
    it('should create items with specific order', async () => {
      const type = await createTestReviewTypeConfig()
      const template = await createTestReviewTemplate(type.id)

      await testPrisma.reviewTemplateItem.create({
        data: {
          templateId: template.id,
          name: 'First Item',
          order: 1,
        },
      })

      await testPrisma.reviewTemplateItem.create({
        data: {
          templateId: template.id,
          name: 'Second Item',
          order: 2,
        },
      })

      await testPrisma.reviewTemplateItem.create({
        data: {
          templateId: template.id,
          name: 'Third Item',
          order: 3,
        },
      })

      const items = await testPrisma.reviewTemplateItem.findMany({
        where: { templateId: template.id },
        orderBy: { order: 'asc' },
      })

      expect(items[0].order).toBe(1)
      expect(items[1].order).toBe(2)
      expect(items[2].order).toBe(3)
    })

    it('should reorder items', async () => {
      const type = await createTestReviewTypeConfig()
      const template = await createTestReviewTemplate(type.id)

      const item1 = await testPrisma.reviewTemplateItem.create({
        data: {
          templateId: template.id,
          name: 'Item 1',
          order: 1,
        },
      })

      const item2 = await testPrisma.reviewTemplateItem.create({
        data: {
          templateId: template.id,
          name: 'Item 2',
          order: 2,
        },
      })

      // Swap order
      await testPrisma.reviewTemplateItem.update({
        where: { id: item1.id },
        data: { order: 2 },
      })

      await testPrisma.reviewTemplateItem.update({
        where: { id: item2.id },
        data: { order: 1 },
      })

      const items = await testPrisma.reviewTemplateItem.findMany({
        where: { templateId: template.id },
        orderBy: { order: 'asc' },
      })

      expect(items[0].id).toBe(item2.id)
      expect(items[1].id).toBe(item1.id)
    })
  })

  describe('ReviewTemplateItem Relationships', () => {
    it('should associate item with template', async () => {
      const type = await createTestReviewTypeConfig()
      const template = await createTestReviewTemplate(type.id, {
        name: 'Template With Items',
      })

      const item = await testPrisma.reviewTemplateItem.create({
        data: {
          templateId: template.id,
          name: 'Related Item',
        },
      })

      expect(item.templateId).toBe(template.id)

      // Verify from template side
      const templateWithItems = await testPrisma.reviewTemplate.findUnique({
        where: { id: template.id },
        include: { items: true },
      })

      expect(templateWithItems?.items).toHaveLength(1)
    })

    it('should allow multiple items for same template', async () => {
      const type = await createTestReviewTypeConfig()
      const template = await createTestReviewTemplate(type.id)

      for (let i = 1; i <= 5; i++) {
        await testPrisma.reviewTemplateItem.create({
          data: {
            templateId: template.id,
            name: `Item ${i}`,
            order: i,
          },
        })
      }

      const items = await testPrisma.reviewTemplateItem.findMany({
        where: { templateId: template.id },
      })

      expect(items).toHaveLength(5)
    })

    it('should cascade delete item when template deleted', async () => {
      const type = await createTestReviewTypeConfig()
      const template = await createTestReviewTemplate(type.id)

      const item = await testPrisma.reviewTemplateItem.create({
        data: {
          templateId: template.id,
          name: 'Cascade Test',
        },
      })

      // Delete template
      await testPrisma.reviewTemplate.delete({
        where: { id: template.id },
      })

      // Verify item is also deleted (CASCADE)
      const found = await testPrisma.reviewTemplateItem.findUnique({
        where: { id: item.id },
      })

      expect(found).toBeNull()
    })
  })

  describe('Template Checklist', () => {
    it('should create complete checklist for template', async () => {
      const type = await createTestReviewTypeConfig()
      const template = await createTestReviewTemplate(type.id, {
        name: 'Code Review Template',
      })

      const checklist = [
        { name: 'Code Style', order: 1, required: true },
        { name: 'Unit Tests', order: 2, required: true },
        { name: 'Documentation', order: 3, required: false },
        { name: 'Performance', order: 4, required: false },
      ]

      for (const item of checklist) {
        await testPrisma.reviewTemplateItem.create({
          data: {
            templateId: template.id,
            name: item.name,
            order: item.order,
            isRequired: item.required,
          },
        })
      }

      const items = await testPrisma.reviewTemplateItem.findMany({
        where: { templateId: template.id },
        orderBy: { order: 'asc' },
      })

      const required = items.filter((i) => i.isRequired)
      const optional = items.filter((i) => !i.isRequired)

      expect(items).toHaveLength(4)
      expect(required).toHaveLength(2)
      expect(optional).toHaveLength(2)
    })

    it('should find required items', async () => {
      const type = await createTestReviewTypeConfig()
      const template = await createTestReviewTemplate(type.id)

      await testPrisma.reviewTemplateItem.create({
        data: {
          templateId: template.id,
          name: 'Required 1',
          isRequired: true,
          order: 1,
        },
      })

      await testPrisma.reviewTemplateItem.create({
        data: {
          templateId: template.id,
          name: 'Optional',
          isRequired: false,
          order: 2,
        },
      })

      await testPrisma.reviewTemplateItem.create({
        data: {
          templateId: template.id,
          name: 'Required 2',
          isRequired: true,
          order: 3,
        },
      })

      const required = await testPrisma.reviewTemplateItem.findMany({
        where: {
          templateId: template.id,
          isRequired: true,
        },
      })

      expect(required).toHaveLength(2)
    })
  })

  describe('Item Queries', () => {
    it('should find items by templateId', async () => {
      const type = await createTestReviewTypeConfig()
      const template1 = await createTestReviewTemplate(type.id)
      const template2 = await createTestReviewTemplate(type.id)

      await testPrisma.reviewTemplateItem.create({
        data: {
          templateId: template1.id,
          name: 'Template 1 Item 1',
        },
      })

      await testPrisma.reviewTemplateItem.create({
        data: {
          templateId: template1.id,
          name: 'Template 1 Item 2',
        },
      })

      await testPrisma.reviewTemplateItem.create({
        data: {
          templateId: template2.id,
          name: 'Template 2 Item',
        },
      })

      const template1Items = await testPrisma.reviewTemplateItem.findMany({
        where: { templateId: template1.id },
      })

      expect(template1Items).toHaveLength(2)
    })

    it('should query item with template', async () => {
      const type = await createTestReviewTypeConfig()
      const template = await createTestReviewTemplate(type.id, {
        name: 'Template With Items',
      })

      const item = await testPrisma.reviewTemplateItem.create({
        data: {
          templateId: template.id,
          name: 'Item to Query',
        },
      })

      const itemWithTemplate = await testPrisma.reviewTemplateItem.findUnique({
        where: { id: item.id },
        include: {
          template: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      expect(itemWithTemplate?.template.name).toBe('Template With Items')
    })

    it('should order items by order field', async () => {
      const type = await createTestReviewTypeConfig()
      const template = await createTestReviewTemplate(type.id)

      const item3 = await testPrisma.reviewTemplateItem.create({
        data: {
          templateId: template.id,
          name: 'Third',
          order: 3,
        },
      })

      const item1 = await testPrisma.reviewTemplateItem.create({
        data: {
          templateId: template.id,
          name: 'First',
          order: 1,
        },
      })

      const item2 = await testPrisma.reviewTemplateItem.create({
        data: {
          templateId: template.id,
          name: 'Second',
          order: 2,
        },
      })

      const items = await testPrisma.reviewTemplateItem.findMany({
        where: { templateId: template.id },
        orderBy: { order: 'asc' },
      })

      expect(items[0].id).toBe(item1.id)
      expect(items[1].id).toBe(item2.id)
      expect(items[2].id).toBe(item3.id)
    })
  })
})
