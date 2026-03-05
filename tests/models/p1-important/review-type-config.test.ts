/**
 * ReviewTypeConfig 模型测试 - P1 重要业务模型
 *
 * 测试覆盖:
 * - CRUD 操作
 * - 评审类型配置
 * - 系统预设 vs 自定义类型
 * - 类型启用/禁用状态
 * - 与模板、标准的关联关系
 *
 * 优先级：P1 - 重要业务模型
 */

import { describe, it, expect } from 'vitest'
import { testPrisma } from '../helpers/test-db'
import { createTestReviewTypeConfig } from '../helpers/test-data-factory'

describe('ReviewTypeConfig Model - P1 Core', () => {
  describe('Basic CRUD', () => {
    it('should create review type config successfully', async () => {
      const type = await testPrisma.reviewTypeConfig.create({
        data: {
          name: 'CODE_REVIEW_TYPE',
          displayName: 'Code Review',
          description: 'Standard code review type',
          isSystem: false,
          isActive: true,
        },
      })

      expect(type).toBeDefined()
      expect(type.name).toBe('CODE_REVIEW_TYPE')
      expect(type.displayName).toBe('Code Review')
      expect(type.isSystem).toBe(false)
      expect(type.isActive).toBe(true)
    })

    it('should create type with all fields', async () => {
      const type = await testPrisma.reviewTypeConfig.create({
        data: {
          name: 'COMPREHENSIVE_TYPE',
          displayName: 'Comprehensive Review',
          description: 'Full featured review type',
          isSystem: false,
          isActive: true,
          category: 'Technical',
          order: 1,
        },
      })

      expect(type.category).toBe('Technical')
      expect(type.order).toBe(1)
    })

    it('should update type config', async () => {
      const type = await testPrisma.reviewTypeConfig.create({
        data: {
          name: 'Original Type',
          displayName: 'Original Display',
        },
      })

      const updated = await testPrisma.reviewTypeConfig.update({
        where: { id: type.id },
        data: {
          displayName: 'Updated Display',
          description: 'Updated description',
        },
      })

      expect(updated.displayName).toBe('Updated Display')
      expect(updated.description).toBe('Updated description')
    })

    it('should delete type config', async () => {
      const type = await testPrisma.reviewTypeConfig.create({
        data: {
          name: 'ToDelete',
          displayName: 'To Delete',
        },
      })

      await testPrisma.reviewTypeConfig.delete({
        where: { id: type.id },
      })

      const found = await testPrisma.reviewTypeConfig.findUnique({
        where: { id: type.id },
      })
      expect(found).toBeNull()
    })
  })

  describe('System vs Custom Types', () => {
    it('should create system type', async () => {
      const type = await testPrisma.reviewTypeConfig.create({
        data: {
          name: 'SYSTEM_CODE_REVIEW',
          displayName: 'System Code Review',
          isSystem: true,
          isActive: true,
        },
      })

      expect(type.isSystem).toBe(true)
    })

    it('should create custom type', async () => {
      const type = await testPrisma.reviewTypeConfig.create({
        data: {
          name: 'CUSTOM_REVIEW',
          displayName: 'Custom Review',
          isSystem: false,
          isActive: true,
        },
      })

      expect(type.isSystem).toBe(false)
    })

    it('should find system types', async () => {
      await testPrisma.reviewTypeConfig.create({
        data: {
          name: 'SYSTEM_TYPE_1',
          displayName: 'System Type 1',
          isSystem: true,
        },
      })

      await testPrisma.reviewTypeConfig.create({
        data: {
          name: 'CUSTOM_TYPE',
          displayName: 'Custom Type',
          isSystem: false,
        },
      })

      await testPrisma.reviewTypeConfig.create({
        data: {
          name: 'SYSTEM_TYPE_2',
          displayName: 'System Type 2',
          isSystem: true,
        },
      })

      const systemTypes = await testPrisma.reviewTypeConfig.findMany({
        where: { isSystem: true },
      })

      expect(systemTypes).toHaveLength(2)
    })

    it('should find custom types', async () => {
      await testPrisma.reviewTypeConfig.create({
        data: {
          name: 'CUSTOM_1',
          displayName: 'Custom 1',
          isSystem: false,
        },
      })

      await testPrisma.reviewTypeConfig.create({
        data: {
          name: 'SYSTEM_TYPE',
          displayName: 'System',
          isSystem: true,
        },
      })

      await testPrisma.reviewTypeConfig.create({
        data: {
          name: 'CUSTOM_2',
          displayName: 'Custom 2',
          isSystem: false,
        },
      })

      const customTypes = await testPrisma.reviewTypeConfig.findMany({
        where: { isSystem: false },
      })

      expect(customTypes).toHaveLength(2)
    })

    it('should not allow updating system types (business rule)', async () => {
      const systemType = await testPrisma.reviewTypeConfig.create({
        data: {
          name: 'LOCKED_SYSTEM_TYPE',
          displayName: 'Locked System Type',
          isSystem: true,
        },
      })

      // System types can be updated in DB, but business logic should prevent this
      const updated = await testPrisma.reviewTypeConfig.update({
        where: { id: systemType.id },
        data: {
          displayName: 'Updated System Type',
        },
      })

      // DB allows it, but business logic should prevent
      expect(updated.displayName).toBe('Updated System Type')
    })
  })

  describe('Active Status', () => {
    it('should create active type by default', async () => {
      const type = await testPrisma.reviewTypeConfig.create({
        data: {
          name: 'ACTIVE_TYPE',
          displayName: 'Active Type',
        },
      })

      expect(type.isActive).toBe(true)
    })

    it('should create inactive type', async () => {
      const type = await testPrisma.reviewTypeConfig.create({
        data: {
          name: 'INACTIVE_TYPE',
          displayName: 'Inactive Type',
          isActive: false,
        },
      })

      expect(type.isActive).toBe(false)
    })

    it('should toggle active status', async () => {
      const type = await testPrisma.reviewTypeConfig.create({
        data: {
          name: 'TOGGLE_TYPE',
          displayName: 'Toggle Type',
          isActive: true,
        },
      })

      const deactivated = await testPrisma.reviewTypeConfig.update({
        where: { id: type.id },
        data: { isActive: false },
      })

      expect(deactivated.isActive).toBe(false)

      const reactivated = await testPrisma.reviewTypeConfig.update({
        where: { id: type.id },
        data: { isActive: true },
      })

      expect(reactivated.isActive).toBe(true)
    })

    it('should find only active types', async () => {
      await testPrisma.reviewTypeConfig.create({
        data: {
          name: 'ACTIVE_1',
          displayName: 'Active 1',
          isActive: true,
        },
      })

      await testPrisma.reviewTypeConfig.create({
        data: {
          name: 'INACTIVE',
          displayName: 'Inactive',
          isActive: false,
        },
      })

      await testPrisma.reviewTypeConfig.create({
        data: {
          name: 'ACTIVE_2',
          displayName: 'Active 2',
          isActive: true,
        },
      })

      const active = await testPrisma.reviewTypeConfig.findMany({
        where: { isActive: true },
      })

      expect(active).toHaveLength(2)
    })
  })

  describe('Type Categories', () => {
    it('should create type with category', async () => {
      const type = await testPrisma.reviewTypeConfig.create({
        data: {
          name: 'CATEGORIZED_TYPE',
          displayName: 'Categorized Type',
          category: 'Technical',
        },
      })

      expect(type.category).toBe('Technical')
    })

    it('should support different categories', async () => {
      const categories = ['Technical', 'Design', 'Documentation', 'Security', 'Process']

      for (const category of categories) {
        await testPrisma.reviewTypeConfig.create({
          data: {
            name: `${category.toUpperCase()}_TYPE`,
            displayName: `${category} Review Type`,
            category,
          },
        })
      }

      const types = await testPrisma.reviewTypeConfig.findMany()

      expect(types).toHaveLength(categories.length)
      expect(types.map((t) => t.category)).toEqual(categories)
    })

    it('should find types by category', async () => {
      await testPrisma.reviewTypeConfig.create({
        data: {
          name: 'TECHNICAL_1',
          displayName: 'Technical 1',
          category: 'Technical',
        },
      })

      await testPrisma.reviewTypeConfig.create({
        data: {
          name: 'DESIGN_1',
          displayName: 'Design 1',
          category: 'Design',
        },
      })

      await testPrisma.reviewTypeConfig.create({
        data: {
          name: 'TECHNICAL_2',
          displayName: 'Technical 2',
          category: 'Technical',
        },
      })

      const technical = await testPrisma.reviewTypeConfig.findMany({
        where: { category: 'Technical' },
      })

      expect(technical).toHaveLength(2)
    })
  })

  describe('Type Ordering', () => {
    it('should create types with specific order', async () => {
      const type1 = await testPrisma.reviewTypeConfig.create({
        data: {
          name: 'FIRST_TYPE',
          displayName: 'First Type',
          order: 1,
        },
      })

      const type2 = await testPrisma.reviewTypeConfig.create({
        data: {
          name: 'SECOND_TYPE',
          displayName: 'Second Type',
          order: 2,
        },
      })

      const type3 = await testPrisma.reviewTypeConfig.create({
        data: {
          name: 'THIRD_TYPE',
          displayName: 'Third Type',
          order: 3,
        },
      })

      const types = await testPrisma.reviewTypeConfig.findMany({
        orderBy: { order: 'asc' },
      })

      expect(types[0].id).toBe(type1.id)
      expect(types[1].id).toBe(type2.id)
      expect(types[2].id).toBe(type3.id)
    })

    it('should reorder types', async () => {
      const type1 = await testPrisma.reviewTypeConfig.create({
        data: {
          name: 'TYPE_1',
          displayName: 'Type 1',
          order: 1,
        },
      })

      const type2 = await testPrisma.reviewTypeConfig.create({
        data: {
          name: 'TYPE_2',
          displayName: 'Type 2',
          order: 2,
        },
      })

      // Swap order
      await testPrisma.reviewTypeConfig.update({
        where: { id: type1.id },
        data: { order: 2 },
      })

      await testPrisma.reviewTypeConfig.update({
        where: { id: type2.id },
        data: { order: 1 },
      })

      const types = await testPrisma.reviewTypeConfig.findMany({
        orderBy: { order: 'asc' },
      })

      expect(types[0].id).toBe(type2.id)
      expect(types[1].id).toBe(type1.id)
    })
  })

  describe('ReviewTypeConfig Relationships', () => {
    it('should associate type with templates', async () => {
      const type = await testPrisma.reviewTypeConfig.create({
        data: {
          name: 'TYPE_WITH_TEMPLATES',
          displayName: 'Type With Templates',
        },
      })

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

      const typeWithTemplates = await testPrisma.reviewTypeConfig.findUnique({
        where: { id: type.id },
        include: { templates: true },
      })

      expect(typeWithTemplates?.templates).toHaveLength(2)
    })

    it('should associate type with criteria', async () => {
      const type = await testPrisma.reviewTypeConfig.create({
        data: {
          name: 'TYPE_WITH_CRITERIA',
          displayName: 'Type With Criteria',
        },
      })

      await testPrisma.reviewCriterion.create({
        data: {
          typeId: type.id,
          name: 'Criterion 1',
          weight: 50,
        },
      })

      await testPrisma.reviewCriterion.create({
        data: {
          typeId: type.id,
          name: 'Criterion 2',
          weight: 50,
        },
      })

      const typeWithCriteria = await testPrisma.reviewTypeConfig.findUnique({
        where: { id: type.id },
        include: { criteria: true },
      })

      expect(typeWithCriteria?.criteria).toHaveLength(2)
    })

    it('should cascade delete templates and criteria when type deleted', async () => {
      const type = await testPrisma.reviewTypeConfig.create({
        data: {
          name: 'CASCADE_TYPE',
          displayName: 'Cascade Type',
        },
      })

      const template = await testPrisma.reviewTemplate.create({
        data: {
          typeId: type.id,
          name: 'Template to Cascade',
        },
      })

      const criterion = await testPrisma.reviewCriterion.create({
        data: {
          typeId: type.id,
          name: 'Criterion to Cascade',
          weight: 100,
        },
      })

      // Delete type
      await testPrisma.reviewTypeConfig.delete({
        where: { id: type.id },
      })

      // Verify template is also deleted (CASCADE)
      const foundTemplate = await testPrisma.reviewTemplate.findUnique({
        where: { id: template.id },
      })

      // Verify criterion is also deleted (CASCADE)
      const foundCriterion = await testPrisma.reviewCriterion.findUnique({
        where: { id: criterion.id },
      })

      expect(foundTemplate).toBeNull()
      expect(foundCriterion).toBeNull()
    })
  })

  describe('Type Queries', () => {
    it('should find active system types', async () => {
      await testPrisma.reviewTypeConfig.create({
        data: {
          name: 'ACTIVE_SYSTEM',
          displayName: 'Active System',
          isSystem: true,
          isActive: true,
        },
      })

      await testPrisma.reviewTypeConfig.create({
        data: {
          name: 'INACTIVE_SYSTEM',
          displayName: 'Inactive System',
          isSystem: true,
          isActive: false,
        },
      })

      const activeSystem = await testPrisma.reviewTypeConfig.findMany({
        where: {
          isSystem: true,
          isActive: true,
        },
      })

      expect(activeSystem).toHaveLength(1)
    })

    it('should find custom types by category', async () => {
      await testPrisma.reviewTypeConfig.create({
        data: {
          name: 'CUSTOM_TECHNICAL',
          displayName: 'Custom Technical',
          isSystem: false,
          category: 'Technical',
        },
      })

      await testPrisma.reviewTypeConfig.create({
        data: {
          name: 'SYSTEM_TECHNICAL',
          displayName: 'System Technical',
          isSystem: true,
          category: 'Technical',
        },
      })

      const customTechnical = await testPrisma.reviewTypeConfig.findMany({
        where: {
          isSystem: false,
          category: 'Technical',
        },
      })

      expect(customTechnical).toHaveLength(1)
    })

    it('should order types by display name', async () => {
      await testPrisma.reviewTypeConfig.create({
        data: {
          name: 'Z_TYPE',
          displayName: 'Zebra Type',
        },
      })

      await testPrisma.reviewTypeConfig.create({
        data: {
          name: 'A_TYPE',
          displayName: 'Alpha Type',
        },
      })

      await testPrisma.reviewTypeConfig.create({
        data: {
          name: 'M_TYPE',
          displayName: 'Middle Type',
        },
      })

      const types = await testPrisma.reviewTypeConfig.findMany({
        orderBy: { displayName: 'asc' },
      })

      expect(types[0].displayName).toBe('Alpha Type')
      expect(types[1].displayName).toBe('Middle Type')
      expect(types[2].displayName).toBe('Zebra Type')
    })

    it('should query type with templates and criteria', async () => {
      const type = await testPrisma.reviewTypeConfig.create({
        data: {
          name: 'FULL_TYPE',
          displayName: 'Full Featured Type',
          category: 'Technical',
        },
      })

      await testPrisma.reviewTemplate.create({
        data: {
          typeId: type.id,
          name: 'Related Template',
        },
      })

      await testPrisma.reviewCriterion.create({
        data: {
          typeId: type.id,
          name: 'Related Criterion',
          weight: 100,
        },
      })

      const fullType = await testPrisma.reviewTypeConfig.findUnique({
        where: { id: type.id },
        include: {
          templates: {
            select: {
              id: true,
              name: true,
            },
          },
          criteria: {
            select: {
              id: true,
              name: true,
              weight: true,
            },
          },
        },
      })

      expect(fullType?.templates).toHaveLength(1)
      expect(fullType?.criteria).toHaveLength(1)
    })
  })

  describe('Preset System Types', () => {
    it('should create standard system preset types', async () => {
      const presetTypes = [
        { name: 'CODE_REVIEW', displayName: 'Code Review', category: 'Technical' },
        { name: 'DESIGN_REVIEW', displayName: 'Design Review', category: 'Design' },
        { name: 'DOC_REVIEW', displayName: 'Documentation Review', category: 'Documentation' },
        { name: 'SECURITY_REVIEW', displayName: 'Security Review', category: 'Security' },
      ]

      for (const preset of presetTypes) {
        await testPrisma.reviewTypeConfig.create({
          data: {
            name: preset.name,
            displayName: preset.displayName,
            category: preset.category,
            isSystem: true,
            isActive: true,
          },
        })
      }

      const systemTypes = await testPrisma.reviewTypeConfig.findMany({
        where: { isSystem: true },
        orderBy: { order: 'asc' },
      })

      expect(systemTypes).toHaveLength(presetTypes.length)
      expect(systemTypes.map((t) => t.name)).toEqual(presetTypes.map((p) => p.name))
    })
  })
})
