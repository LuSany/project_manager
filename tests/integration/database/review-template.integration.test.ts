// ============================================================================
// 评审模板模块单元测试
// ============================================================================

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { prisma } from '@/lib/prisma'

describe('ReviewTemplate 评审模板管理', () => {
  let testUser: any
  let testType: any

  beforeEach(async () => {
    // 创建测试用户
    testUser = await prisma.user.create({
      data: {
        email: 'template-test@test.com',
        passwordHash: 'hashed',
        name: 'Template Tester',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    })

    // 创建测试评审类型
    testType = await prisma.reviewTypeConfig.create({
      data: {
        name: 'test_review_type_' + Date.now(),
        displayName: '测试评审类型',
        isSystem: false,
        isActive: true,
      },
    })
  })

  afterEach(async () => {
    // 清理测试数据
    await prisma.reviewTemplateItem.deleteMany({
      where: {
        template: {
          typeId: testType.id,
        },
      },
    })
    await prisma.reviewTemplate.deleteMany({
      where: {
        typeId: testType.id,
      },
    })
    await prisma.reviewTypeConfig.delete({
      where: { id: testType.id },
    })
    await prisma.user.delete({
      where: { id: testUser.id },
    })
  })

  describe('评审模板创建', () => {
    it('应该成功创建评审模板', async () => {
      const template = await prisma.reviewTemplate.create({
        data: {
          typeId: testType.id,
          name: 'Test Template',
          description: 'Test Description',
          isActive: true,
        },
      })

      expect(template.id).toBeDefined()
      expect(template.name).toBe('Test Template')
      expect(template.typeId).toBe(testType.id)
      expect(template.isActive).toBe(true)
    })

    it('应该设置默认isActive为true', async () => {
      const template = await prisma.reviewTemplate.create({
        data: {
          typeId: testType.id,
          name: 'Test Template',
        },
      })

      expect(template.isActive).toBe(true)
    })
  })

  describe('评审模板查询', () => {
    it('应该能够查询所有模板', async () => {
      await prisma.reviewTemplate.create({
        data: {
          typeId: testType.id,
          name: 'Template 1',
        },
      })
      await prisma.reviewTemplate.create({
        data: {
          typeId: testType.id,
          name: 'Template 2',
        },
      })

      const templates = await prisma.reviewTemplate.findMany({
        where: { typeId: testType.id },
      })

      expect(templates.length).toBe(2)
    })

    it('应该能够按typeId筛选', async () => {
      const otherType = await prisma.reviewTypeConfig.create({
        data: {
          name: 'other_review_type_' + Date.now(),
          displayName: '其他评审类型',
          isSystem: false,
          isActive: true,
        },
      })

      await prisma.reviewTemplate.create({
        data: {
          typeId: testType.id,
          name: 'Template for Type 1',
        },
      })
      await prisma.reviewTemplate.create({
        data: {
          typeId: otherType.id,
          name: 'Template for Type 2',
        },
      })

      const templatesForType1 = await prisma.reviewTemplate.findMany({
        where: { typeId: testType.id },
      })

      expect(templatesForType1.length).toBe(1)
      expect(templatesForType1[0].name).toBe('Template for Type 1')

      // 清理
      await prisma.reviewTemplate.deleteMany({
        where: { typeId: otherType.id },
      })
      await prisma.reviewTypeConfig.delete({
        where: { id: otherType.id },
      })
    })

    it('应该能够按isActive筛选', async () => {
      await prisma.reviewTemplate.create({
        data: {
          typeId: testType.id,
          name: 'Active Template',
          isActive: true,
        },
      })
      await prisma.reviewTemplate.create({
        data: {
          typeId: testType.id,
          name: 'Inactive Template',
          isActive: false,
        },
      })

      const activeTemplates = await prisma.reviewTemplate.findMany({
        where: { typeId: testType.id, isActive: true },
      })

      expect(activeTemplates.length).toBe(1)
      expect(activeTemplates[0].name).toBe('Active Template')
    })
  })

  describe('评审模板更新', () => {
    it('应该能够更新模板名称', async () => {
      const template = await prisma.reviewTemplate.create({
        data: {
          typeId: testType.id,
          name: 'Original Name',
        },
      })

      const updated = await prisma.reviewTemplate.update({
        where: { id: template.id },
        data: { name: 'Updated Name' },
      })

      expect(updated.name).toBe('Updated Name')
    })

    it('应该能够更新isActive状态', async () => {
      const template = await prisma.reviewTemplate.create({
        data: {
          typeId: testType.id,
          name: 'Test Template',
          isActive: true,
        },
      })

      const updated = await prisma.reviewTemplate.update({
        where: { id: template.id },
        data: { isActive: false },
      })

      expect(updated.isActive).toBe(false)
    })
  })

  describe('评审模板项管理', () => {
    it('应该能够创建带模板项的模板', async () => {
      const template = await prisma.reviewTemplate.create({
        data: {
          typeId: testType.id,
          name: 'Template with Items',
          items: {
            create: [
              { title: 'Item 1', order: 0, required: true },
              { title: 'Item 2', order: 1, required: false },
            ],
          },
        },
        include: {
          items: true,
        },
      })

      expect(template.items.length).toBe(2)
      expect(template.items[0].title).toBe('Item 1')
      expect(template.items[0].required).toBe(true)
      expect(template.items[1].title).toBe('Item 2')
    })

    it('应该能够更新模板项', async () => {
      const template = await prisma.reviewTemplate.create({
        data: {
          typeId: testType.id,
          name: 'Template with Items',
          items: {
            create: [{ title: 'Original Item', order: 0 }],
          },
        },
        include: {
          items: true,
        },
      })

      const itemId = template.items[0].id
      const updated = await prisma.reviewTemplateItem.update({
        where: { id: itemId },
        data: { title: 'Updated Item', required: true },
      })

      expect(updated.title).toBe('Updated Item')
      expect(updated.required).toBe(true)
    })

    it('应该能够删除模板项', async () => {
      const template = await prisma.reviewTemplate.create({
        data: {
          typeId: testType.id,
          name: 'Template with Items',
          items: {
            create: [{ title: 'Item to Delete', order: 0 }],
          },
        },
        include: {
          items: true,
        },
      })

      const itemId = template.items[0].id
      await prisma.reviewTemplateItem.delete({
        where: { id: itemId },
      })

      const items = await prisma.reviewTemplateItem.findMany({
        where: { templateId: template.id },
      })

      expect(items.length).toBe(0)
    })

    it('删除模板时应该级联删除模板项', async () => {
      const template = await prisma.reviewTemplate.create({
        data: {
          typeId: testType.id,
          name: 'Template with Items',
          items: {
            create: [
              { title: 'Item 1', order: 0 },
              { title: 'Item 2', order: 1 },
            ],
          },
        },
      })

      const templateId = template.id

      await prisma.reviewTemplate.delete({
        where: { id: templateId },
      })

      const items = await prisma.reviewTemplateItem.findMany({
        where: { templateId },
      })

      expect(items.length).toBe(0)
    })
  })

  describe('评审模板删除', () => {
    it('应该能够删除模板', async () => {
      const template = await prisma.reviewTemplate.create({
        data: {
          typeId: testType.id,
          name: 'Template to Delete',
        },
      })

      await prisma.reviewTemplate.delete({
        where: { id: template.id },
      })

      const found = await prisma.reviewTemplate.findUnique({
        where: { id: template.id },
      })

      expect(found).toBeNull()
    })
  })
})
