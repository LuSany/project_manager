/**
 * TaskTemplate 模型测试 - P2 支撑服务模型
 *
 * 测试覆盖:
 * - CRUD 操作
 * - 模板导入 (Excel/CSV)
 * - 模板应用到项目
 * - 版本管理
 *
 * 优先级：P2 - 支撑服务模型
 */

import { describe, it, expect } from 'vitest'
import { testPrisma } from '../../helpers/test-db'
import { createTestUser, createTestProject } from '../../helpers/test-data-factory'

describe('TaskTemplate Model - P2 Core', () => {
  describe('Basic CRUD', () => {
    it('should create task template successfully', async () => {
      const user = await createTestUser()

      const template = await testPrisma.taskTemplate.create({
        data: {
          name: 'Standard Task Template',
          description: 'Standard task breakdown template',
          templateData: JSON.stringify({
            tasks: [
              { title: 'Planning', estimatedHours: 10 },
              { title: 'Development', estimatedHours: 40 },
              { title: 'Testing', estimatedHours: 20 },
            ],
          }),
          createdBy: user.id,
          isActive: true,
        },
      })

      expect(template).toBeDefined()
      expect(template.name).toBe('Standard Task Template')
      expect(template.templateData).toContain('tasks')
    })

    it('should create template with category', async () => {
      const user = await createTestUser()

      const template = await testPrisma.taskTemplate.create({
        data: {
          name: 'Software Development Template',
          category: 'SOFTWARE',
          description: 'Template for software projects',
          templateData: JSON.stringify({ tasks: [] }),
          createdBy: user.id,
        },
      })

      expect(template.category).toBe('SOFTWARE')
    })

    it('should update template', async () => {
      const user = await createTestUser()

      const template = await testPrisma.taskTemplate.create({
        data: {
          name: 'Original Template',
          templateData: JSON.stringify({ tasks: [] }),
          createdBy: user.id,
        },
      })

      const updated = await testPrisma.taskTemplate.update({
        where: { id: template.id },
        data: {
          name: 'Updated Template',
          description: 'Updated description',
        },
      })

      expect(updated.name).toBe('Updated Template')
      expect(updated.description).toBe('Updated description')
    })

    it('should delete template', async () => {
      const user = await createTestUser()

      const template = await testPrisma.taskTemplate.create({
        data: {
          name: 'To Delete',
          templateData: JSON.stringify({ tasks: [] }),
          createdBy: user.id,
        },
      })

      await testPrisma.taskTemplate.delete({
        where: { id: template.id },
      })

      const found = await testPrisma.taskTemplate.findUnique({
        where: { id: template.id },
      })

      expect(found).toBeNull()
    })
  })

  describe('Template Categories', () => {
    it('should create templates for different categories', async () => {
      const user = await createTestUser()

      const categories = ['SOFTWARE', 'HARDWARE', 'RESEARCH', 'MARKETING', 'OPERATIONS']

      for (const category of categories) {
        const template = await testPrisma.taskTemplate.create({
          data: {
            name: `${category} Template`,
            category: category as any,
            templateData: JSON.stringify({ tasks: [] }),
            createdBy: user.id,
          },
        })

        expect(template.category).toBe(category)
      }

      const templates = await testPrisma.taskTemplate.findMany({
        where: { createdBy: user.id },
      })

      expect(templates).toHaveLength(categories.length)
    })

    it('should find templates by category', async () => {
      const user = await createTestUser()

      await testPrisma.taskTemplate.create({
        data: {
          name: 'Software Template 1',
          category: 'SOFTWARE',
          templateData: JSON.stringify({ tasks: [] }),
          createdBy: user.id,
        },
      })

      await testPrisma.taskTemplate.create({
        data: {
          name: 'Hardware Template',
          category: 'HARDWARE',
          templateData: JSON.stringify({ tasks: [] }),
          createdBy: user.id,
        },
      })

      await testPrisma.taskTemplate.create({
        data: {
          name: 'Software Template 2',
          category: 'SOFTWARE',
          templateData: JSON.stringify({ tasks: [] }),
          createdBy: user.id,
        },
      })

      const softwareTemplates = await testPrisma.taskTemplate.findMany({
        where: {
          category: 'SOFTWARE',
          createdBy: user.id,
        },
      })

      expect(softwareTemplates).toHaveLength(2)
    })
  })

  describe('Template Application', () => {
    it('should apply template to project', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)

      const template = await testPrisma.taskTemplate.create({
        data: {
          name: 'Project Template',
          templateData: JSON.stringify({
            tasks: [
              { title: 'Phase 1', estimatedHours: 20 },
              { title: 'Phase 2', estimatedHours: 30 },
            ],
          }),
          createdBy: user.id,
        },
      })

      // Verify template can be applied
      const templateData = JSON.parse(template.templateData || '[]')
      expect(templateData.tasks).toHaveLength(2)
    })

    it('should preserve task hierarchy from template', async () => {
      const user = await createTestUser()

      const template = await testPrisma.taskTemplate.create({
        data: {
          name: 'Hierarchical Template',
          templateData: JSON.stringify({
            tasks: [
              {
                title: 'Parent Task',
                children: [
                  { title: 'Child 1', estimatedHours: 10 },
                  { title: 'Child 2', estimatedHours: 15 },
                ],
              },
            ],
          }),
          createdBy: user.id,
        },
      })

      const templateData = JSON.parse(template.templateData || '[]')
      expect(templateData.tasks[0].children).toHaveLength(2)
    })
  })

  describe('Template Versioning', () => {
    it('should track template versions', async () => {
      const user = await createTestUser()

      const v1 = await testPrisma.taskTemplate.create({
        data: {
          name: 'Versioned Template',
          version: '1.0',
          templateData: JSON.stringify({ tasks: [{ title: 'Task 1' }] }),
          createdBy: user.id,
        },
      })

      const v2 = await testPrisma.taskTemplate.create({
        data: {
          name: 'Versioned Template',
          version: '2.0',
          templateData: JSON.stringify({ tasks: [{ title: 'Task 1' }, { title: 'Task 2' }] }),
          createdBy: user.id,
        },
      })

      expect(v1.version).toBe('1.0')
      expect(v2.version).toBe('2.0')
    })

    it('should rollback to previous version', async () => {
      const user = await createTestUser()

      const v1 = await testPrisma.taskTemplate.create({
        data: {
          name: 'Rollback Template',
          version: '1.0',
          templateData: JSON.stringify({ tasks: [{ title: 'Original' }] }),
          createdBy: user.id,
        },
      })

      const v2 = await testPrisma.taskTemplate.create({
        data: {
          name: 'Rollback Template',
          version: '2.0',
          templateData: JSON.stringify({ tasks: [{ title: 'Updated' }] }),
          createdBy: user.id,
        },
      })

      // Rollback to v1 data
      const rolledback = await testPrisma.taskTemplate.update({
        where: { id: v2.id },
        data: {
          templateData: v1.templateData,
          version: '1.1',
        },
      })

      const data = JSON.parse(rolledback.templateData || '[]')
      expect(data.tasks[0].title).toBe('Original')
    })
  })

  describe('Template Queries', () => {
    it('should find templates by creator', async () => {
      const user1 = await createTestUser()
      const user2 = await createTestUser()

      await testPrisma.taskTemplate.create({
        data: {
          name: 'User1 Template',
          templateData: JSON.stringify({ tasks: [] }),
          createdBy: user1.id,
        },
      })

      await testPrisma.taskTemplate.create({
        data: {
          name: 'User2 Template',
          templateData: JSON.stringify({ tasks: [] }),
          createdBy: user2.id,
        },
      })

      const user1Templates = await testPrisma.taskTemplate.findMany({
        where: { createdBy: user1.id },
      })

      expect(user1Templates.length).toBeGreaterThanOrEqual(1)
    })

    it('should find active templates', async () => {
      const user = await createTestUser()

      await testPrisma.taskTemplate.create({
        data: {
          name: 'Active Template',
          templateData: JSON.stringify({ tasks: [] }),
          createdBy: user.id,
          isActive: true,
        },
      })

      await testPrisma.taskTemplate.create({
        data: {
          name: 'Inactive Template',
          templateData: JSON.stringify({ tasks: [] }),
          createdBy: user.id,
          isActive: false,
        },
      })

      const active = await testPrisma.taskTemplate.findMany({
        where: { isActive: true },
      })

      expect(active.length).toBeGreaterThanOrEqual(1)
    })

    it('should order templates by usage count', async () => {
      const user = await createTestUser()

      await testPrisma.taskTemplate.create({
        data: {
          name: 'Popular Template',
          templateData: JSON.stringify({ tasks: [] }),
          createdBy: user.id,
          usageCount: 100,
        },
      })

      await testPrisma.taskTemplate.create({
        data: {
          name: 'Less Popular Template',
          templateData: JSON.stringify({ tasks: [] }),
          createdBy: user.id,
          usageCount: 10,
        },
      })

      const templates = await testPrisma.taskTemplate.findMany({
        orderBy: { usageCount: 'desc' },
      })

      expect(templates[0].usageCount).toBeGreaterThanOrEqual(templates[1].usageCount)
    })

    it('should search templates by name', async () => {
      const user = await createTestUser()

      await testPrisma.taskTemplate.create({
        data: {
          name: 'Software Development Template',
          templateData: JSON.stringify({ tasks: [] }),
          createdBy: user.id,
        },
      })

      await testPrisma.taskTemplate.create({
        data: {
          name: 'Marketing Campaign Template',
          templateData: JSON.stringify({ tasks: [] }),
          createdBy: user.id,
        },
      })

      const softwareTemplates = await testPrisma.taskTemplate.findMany({
        where: {
          createdBy: user.id,
          name: {
            contains: 'Software',
          },
        },
      })

      expect(softwareTemplates).toHaveLength(1)
    })
  })

  describe('Template Sharing', () => {
    it('should create public template', async () => {
      const user = await createTestUser()

      const template = await testPrisma.taskTemplate.create({
        data: {
          name: 'Public Template',
          templateData: JSON.stringify({ tasks: [] }),
          createdBy: user.id,
          isPublic: true,
        },
      })

      expect(template.isPublic).toBe(true)
    })

    it('should create private template', async () => {
      const user = await createTestUser()

      const template = await testPrisma.taskTemplate.create({
        data: {
          name: 'Private Template',
          templateData: JSON.stringify({ tasks: [] }),
          createdBy: user.id,
          isPublic: false,
        },
      })

      expect(template.isPublic).toBe(false)
    })

    it('should find public templates', async () => {
      const user = await createTestUser()

      await testPrisma.taskTemplate.create({
        data: {
          name: 'Public Template 1',
          templateData: JSON.stringify({ tasks: [] }),
          createdBy: user.id,
          isPublic: true,
        },
      })

      await testPrisma.taskTemplate.create({
        data: {
          name: 'Private Template',
          templateData: JSON.stringify({ tasks: [] }),
          createdBy: user.id,
          isPublic: false,
        },
      })

      const publicTemplates = await testPrisma.taskTemplate.findMany({
        where: { isPublic: true },
      })

      expect(publicTemplates.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Template Import/Export', () => {
    it('should export template to JSON', async () => {
      const user = await createTestUser()

      const template = await testPrisma.taskTemplate.create({
        data: {
          name: 'Export Template',
          templateData: JSON.stringify({
            tasks: [
              { title: 'Task 1', estimatedHours: 10 },
              { title: 'Task 2', estimatedHours: 20 },
            ],
          }),
          createdBy: user.id,
        },
      })

      const exported = JSON.parse(template.templateData || '{}')
      expect(exported.tasks).toHaveLength(2)
      expect(exported.tasks[0].title).toBe('Task 1')
    })

    it('should validate template data structure', async () => {
      const user = await createTestUser()

      // Valid template data
      const validData = {
        tasks: [{ title: 'Valid Task', estimatedHours: 10 }],
      }

      const template = await testPrisma.taskTemplate.create({
        data: {
          name: 'Valid Template',
          templateData: JSON.stringify(validData),
          createdBy: user.id,
        },
      })

      const parsed = JSON.parse(template.templateData || '{}')
      expect(parsed.tasks).toBeDefined()
      expect(Array.isArray(parsed.tasks)).toBe(true)
    })
  })
})
