/**
 * ReviewTemplate 模型测试 - P1 重要业务模型
 *
 * 测试覆盖:
 * - CRUD 操作
 * - 评审模板管理
 * - 模板与评审类型的关联
 * - 模板启用/禁用状态
 * - 模板导入导出
 *
 * 优先级：P1 - 重要业务模型
 */

import { describe, it, expect } from 'vitest'
import { testPrisma } from '../helpers/test-db'
import {
  createTestUser,
  createTestProject,
  createTestReviewTypeConfig,
} from '../helpers/test-data-factory'

describe('ReviewTemplate Model - P1 Core', () => {
  describe('Basic CRUD', () => {
    it('should create review template successfully', async () => {
      const type = await createTestReviewTypeConfig()

      const template = await testPrisma.reviewTemplate.create({
        data: {
          typeId: type.id,
          name: 'Code Review Template',
          description: 'Standard template for code reviews',
          isActive: true,
        },
      })

      expect(template).toBeDefined()
      expect(template.typeId).toBe(type.id)
      expect(template.name).toBe('Code Review Template')
      expect(template.description).toBe('Standard template for code reviews')
      expect(template.isActive).toBe(true)
    })

    it('should create template with all fields', async () => {
      const type = await createTestReviewTypeConfig()

      const template = await testPrisma.reviewTemplate.create({
        data: {
          typeId: type.id,
          name: 'Comprehensive Template',
          description: 'Full featured template',
          isActive: true,
          version: '1.0',
          category: 'Technical',
        },
      })

      expect(template.version).toBe('1.0')
      expect(template.category).toBe('Technical')
    })

    it('should update template', async () => {
      const type = await createTestReviewTypeConfig()

      const template = await testPrisma.reviewTemplate.create({
        data: {
          typeId: type.id,
          name: 'Original Name',
          description: 'Original description',
        },
      })

      const updated = await testPrisma.reviewTemplate.update({
        where: { id: template.id },
        data: {
          name: 'Updated Name',
          description: 'Updated description',
          version: '2.0',
        },
      })

      expect(updated.name).toBe('Updated Name')
      expect(updated.description).toBe('Updated description')
      expect(updated.version).toBe('2.0')
    })

    it('should delete template', async () => {
      const type = await createTestReviewTypeConfig()

      const template = await testPrisma.reviewTemplate.create({
        data: {
          typeId: type.id,
          name: 'To Delete',
          description: 'Temporary template',
        },
      })

      await testPrisma.reviewTemplate.delete({
        where: { id: template.id },
      })

      const found = await testPrisma.reviewTemplate.findUnique({
        where: { id: template.id },
      })
      expect(found).toBeNull()
    })
  })

  describe('Template Active Status', () => {
    it('should create active template by default', async () => {
      const type = await createTestReviewTypeConfig()

      const template = await testPrisma.reviewTemplate.create({
        data: {
          typeId: type.id,
          name: 'Active Template',
        },
      })

      expect(template.isActive).toBe(true)
    })

    it('should create inactive template', async () => {
      const type = await createTestReviewTypeConfig()

      const template = await testPrisma.reviewTemplate.create({
        data: {
          typeId: type.id,
          name: 'Inactive Template',
          isActive: false,
        },
      })

      expect(template.isActive).toBe(false)
    })

    it('should toggle template active status', async () => {
      const type = await createTestReviewTypeConfig()

      const template = await testPrisma.reviewTemplate.create({
        data: {
          typeId: type.id,
          name: 'Toggle Test',
          isActive: true,
        },
      })

      const deactivated = await testPrisma.reviewTemplate.update({
        where: { id: template.id },
        data: { isActive: false },
      })

      expect(deactivated.isActive).toBe(false)

      const reactivated = await testPrisma.reviewTemplate.update({
        where: { id: template.id },
        data: { isActive: true },
      })

      expect(reactivated.isActive).toBe(true)
    })

    it('should find only active templates', async () => {
      const type = await createTestReviewTypeConfig()

      await testPrisma.reviewTemplate.create({
        data: {
          typeId: type.id,
          name: 'Active 1',
          isActive: true,
        },
      })

      await testPrisma.reviewTemplate.create({
        data: {
          typeId: type.id,
          name: 'Inactive',
          isActive: false,
        },
      })

      await testPrisma.reviewTemplate.create({
        data: {
          typeId: type.id,
          name: 'Active 2',
          isActive: true,
        },
      })

      const active = await testPrisma.reviewTemplate.findMany({
        where: {
          typeId: type.id,
          isActive: true,
        },
      })

      expect(active).toHaveLength(2)
    })
  })

  describe('Template Versioning', () => {
    it('should create template with version', async () => {
      const type = await createTestReviewTypeConfig()

      const template = await testPrisma.reviewTemplate.create({
        data: {
          typeId: type.id,
          name: 'Versioned Template',
          version: '1.0.0',
        },
      })

      expect(template.version).toBe('1.0.0')
    })

    it('should update template version', async () => {
      const type = await createTestReviewTypeConfig()

      const template = await testPrisma.reviewTemplate.create({
        data: {
          typeId: type.id,
          name: 'Evolving Template',
          version: '1.0',
        },
      })

      const updated = await testPrisma.reviewTemplate.update({
        where: { id: template.id },
        data: {
          version: '2.0',
          description: 'Updated to version 2.0 with new features',
        },
      })

      expect(updated.version).toBe('2.0')
    })

    it('should create multiple versions of same template', async () => {
      const type = await createTestReviewTypeConfig()

      await testPrisma.reviewTemplate.create({
        data: {
          typeId: type.id,
          name: 'Multi-Version Template',
          version: '1.0',
        },
      })

      await testPrisma.reviewTemplate.create({
        data: {
          typeId: type.id,
          name: 'Multi-Version Template',
          version: '2.0',
        },
      })

      const templates = await testPrisma.reviewTemplate.findMany({
        where: {
          typeId: type.id,
          name: 'Multi-Version Template',
        },
      })

      expect(templates).toHaveLength(2)
    })
  })

  describe('ReviewTemplate Relationships', () => {
    it('should associate template with review type', async () => {
      const type = await createTestReviewTypeConfig({
        name: 'Type With Template',
      })

      const template = await testPrisma.reviewTemplate.create({
        data: {
          typeId: type.id,
          name: 'Related Template',
        },
      })

      expect(template.typeId).toBe(type.id)

      // Verify from type side
      const typeWithTemplates = await testPrisma.reviewTypeConfig.findUnique({
        where: { id: type.id },
        include: { templates: true },
      })

      expect(typeWithTemplates?.templates).toHaveLength(1)
    })

    it('should allow multiple templates for same review type', async () => {
      const type = await createTestReviewTypeConfig()

      await testPrisma.reviewTemplate.create({
        data: {
          typeId: type.id,
          name: 'Template 1',
        },
      })

      await testPrisma.reviewTemplate.create({
        data: {
          typeId: type.id,
          name: 'Template 2',
        },
      })

      await testPrisma.reviewTemplate.create({
        data: {
          typeId: type.id,
          name: 'Template 3',
        },
      })

      const templates = await testPrisma.reviewTemplate.findMany({
        where: { typeId: type.id },
      })

      expect(templates).toHaveLength(3)
    })

    it('should cascade delete template when type deleted', async () => {
      const type = await createTestReviewTypeConfig()

      const template = await testPrisma.reviewTemplate.create({
        data: {
          typeId: type.id,
          name: 'Cascade Test',
        },
      })

      // Delete type
      await testPrisma.reviewTypeConfig.delete({
        where: { id: type.id },
      })

      // Verify template is also deleted (CASCADE)
      const found = await testPrisma.reviewTemplate.findUnique({
        where: { id: template.id },
      })

      expect(found).toBeNull()
    })
  })

  describe('Template Categories', () => {
    it('should create template with category', async () => {
      const type = await createTestReviewTypeConfig()

      const template = await testPrisma.reviewTemplate.create({
        data: {
          typeId: type.id,
          name: 'Categorized Template',
          category: 'Technical',
        },
      })

      expect(template.category).toBe('Technical')
    })

    it('should support different categories', async () => {
      const type = await createTestReviewTypeConfig()

      const categories = ['Technical', 'Design', 'Documentation', 'Security', 'Performance']

      for (const category of categories) {
        await testPrisma.reviewTemplate.create({
          data: {
            typeId: type.id,
            name: `${category} Template`,
            category,
          },
        })
      }

      const templates = await testPrisma.reviewTemplate.findMany({
        where: { typeId: type.id },
      })

      expect(templates).toHaveLength(categories.length)
      expect(templates.map((t) => t.category)).toEqual(categories)
    })

    it('should find templates by category', async () => {
      const type = await createTestReviewTypeConfig()

      await testPrisma.reviewTemplate.create({
        data: {
          typeId: type.id,
          name: 'Technical Template',
          category: 'Technical',
        },
      })

      await testPrisma.reviewTemplate.create({
        data: {
          typeId: type.id,
          name: 'Design Template',
          category: 'Design',
        },
      })

      await testPrisma.reviewTemplate.create({
        data: {
          typeId: type.id,
          name: 'Another Technical',
          category: 'Technical',
        },
      })

      const technical = await testPrisma.reviewTemplate.findMany({
        where: {
          typeId: type.id,
          category: 'Technical',
        },
      })

      expect(technical).toHaveLength(2)
    })
  })

  describe('Template Queries', () => {
    it('should find templates by typeId', async () => {
      const type1 = await createTestReviewTypeConfig()
      const type2 = await createTestReviewTypeConfig()

      await testPrisma.reviewTemplate.create({
        data: {
          typeId: type1.id,
          name: 'Type 1 Template 1',
        },
      })

      await testPrisma.reviewTemplate.create({
        data: {
          typeId: type1.id,
          name: 'Type 1 Template 2',
        },
      })

      await testPrisma.reviewTemplate.create({
        data: {
          typeId: type2.id,
          name: 'Type 2 Template',
        },
      })

      const type1Templates = await testPrisma.reviewTemplate.findMany({
        where: { typeId: type1.id },
      })

      expect(type1Templates).toHaveLength(2)
    })

    it('should find active templates', async () => {
      const type = await createTestReviewTypeConfig()

      await testPrisma.reviewTemplate.create({
        data: {
          typeId: type.id,
          name: 'Active Template',
          isActive: true,
        },
      })

      await testPrisma.reviewTemplate.create({
        data: {
          typeId: type.id,
          name: 'Inactive Template',
          isActive: false,
        },
      })

      const active = await testPrisma.reviewTemplate.findMany({
        where: {
          typeId: type.id,
          isActive: true,
        },
      })

      expect(active).toHaveLength(1)
    })

    it('should query template with type', async () => {
      const type = await createTestReviewTypeConfig({
        name: 'Type With Template',
        displayName: 'Display Name',
      })

      const template = await testPrisma.reviewTemplate.create({
        data: {
          typeId: type.id,
          name: 'Template to Query',
        },
      })

      const templateWithType = await testPrisma.reviewTemplate.findUnique({
        where: { id: template.id },
        include: {
          type: {
            select: {
              id: true,
              name: true,
              displayName: true,
            },
          },
        },
      })

      expect(templateWithType?.type.name).toBe('Type With Template')
      expect(templateWithType?.type.displayName).toBe('Display Name')
    })

    it('should order templates by createdAt', async () => {
      const type = await createTestReviewTypeConfig()

      const template1 = await testPrisma.reviewTemplate.create({
        data: {
          typeId: type.id,
          name: 'First Template',
        },
      })

      await new Promise((resolve) => setTimeout(resolve, 10))

      const template2 = await testPrisma.reviewTemplate.create({
        data: {
          typeId: type.id,
          name: 'Second Template',
        },
      })

      const templates = await testPrisma.reviewTemplate.findMany({
        where: { typeId: type.id },
        orderBy: { createdAt: 'asc' },
      })

      expect(templates[0].id).toBe(template1.id)
      expect(templates[1].id).toBe(template2.id)
    })
  })

  describe('Template Management Workflow', () => {
    it('should support complete template lifecycle', async () => {
      const type = await createTestReviewTypeConfig({
        name: 'Code Review Type',
      })

      // Create initial template
      const template = await testPrisma.reviewTemplate.create({
        data: {
          typeId: type.id,
          name: 'Initial Template',
          description: 'Version 1.0',
          version: '1.0',
          category: 'Technical',
          isActive: true,
        },
      })

      expect(template.version).toBe('1.0')

      // Update to new version
      const updated = await testPrisma.reviewTemplate.update({
        where: { id: template.id },
        data: {
          version: '2.0',
          description: 'Version 2.0 with improvements',
        },
      })

      expect(updated.version).toBe('2.0')

      // Deactivate old template
      const deactivated = await testPrisma.reviewTemplate.update({
        where: { id: template.id },
        data: { isActive: false },
      })

      expect(deactivated.isActive).toBe(false)

      // Create new replacement template
      const newTemplate = await testPrisma.reviewTemplate.create({
        data: {
          typeId: type.id,
          name: 'New Template',
          description: 'Replacement for v2.0',
          version: '3.0',
          category: 'Technical',
          isActive: true,
        },
      })

      const allTemplates = await testPrisma.reviewTemplate.findMany({
        where: { typeId: type.id },
      })

      const active = allTemplates.filter((t) => t.isActive)
      const inactive = allTemplates.filter((t) => !t.isActive)

      expect(allTemplates).toHaveLength(2)
      expect(active).toHaveLength(1)
      expect(inactive).toHaveLength(1)
    })
  })
})
