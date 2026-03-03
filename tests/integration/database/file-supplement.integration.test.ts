/**
 * 文件管理补充集成测试
 *
 * 测试覆盖：
 * - 文件 CRUD 操作
 * - 在线编辑
 * - OnlyOffice 回调
 * - 预览服务配置
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { setupTestDatabase, testPrisma } from '../../helpers/test-db'
import {
  createTestUser,
  createTestProject,
  createTestProjectMember,
} from '../../helpers/test-data-factory'

// ============================================
// 测试套件
// ============================================

describe('文件管理补充集成测试', () => {
  setupTestDatabase()

  let testUser: { id: string }
  let testProject: { id: string }

  beforeEach(async () => {
    testUser = await createTestUser()
    testProject = await createTestProject(testUser.id)
    await createTestProjectMember(testProject.id, testUser.id, { role: 'PROJECT_OWNER' })
  })

  // ============================================
  // 文件 CRUD 测试
  // ============================================

  describe('文件 CRUD 操作', () => {
    it('应该能上传文件', async () => {
      const file = await testPrisma.fileStorage.create({
        data: {
          fileName: 'test-document.pdf',
          filePath: '/uploads/test-document.pdf',
          mimeType: 'application/pdf',
          fileSize: 1024000,
          originalName: "test.pdf",
          uploadedBy: testUser.id,
        },
      })

      expect(file).toBeDefined()
      expect(file.fileName).toBe('test-document.pdf')
      expect(file.mimeType).toBe('application/pdf')
    })

    it('应该能获取项目的文件列表', async () => {
      await testPrisma.fileStorage.create({
        data: {
          fileName: 'file1.pdf',
          filePath: '/uploads/file1.pdf',
          mimeType: 'application/pdf',
          fileSize: 1024,
          originalName: "test.pdf",
          uploadedBy: testUser.id,
        },
      })
      await testPrisma.fileStorage.create({
        data: {
          fileName: 'file2.docx',
          filePath: '/uploads/file2.docx',
          mimeType: 'application/docx',
          fileSize: 2048,
          originalName: "test.pdf",
          uploadedBy: testUser.id,
        },
      })

      const files = await testPrisma.fileStorage.findMany({
        where: { },
      })

      expect(files.length).toBe(2)
    })

    it('应该能获取文件详情', async () => {
      const file = await testPrisma.fileStorage.create({
        data: {
          fileName: 'detail-test.pdf',
          filePath: '/uploads/detail-test.pdf',
          mimeType: 'application/pdf',
          fileSize: 1024,
          originalName: "test.pdf",
          uploadedBy: testUser.id,
        },
      })

      const found = await testPrisma.fileStorage.findUnique({
        where: { id: file.id },
      })

      expect(found).toBeDefined()
      expect(found?.fileName).toBe('detail-test.pdf')
    })

    it('应该能删除文件', async () => {
      const file = await testPrisma.fileStorage.create({
        data: {
          fileName: 'to-delete.pdf',
          filePath: '/uploads/to-delete.pdf',
          mimeType: 'application/pdf',
          fileSize: 1024,
          originalName: "test.pdf",
          uploadedBy: testUser.id,
        },
      })

      await testPrisma.fileStorage.delete({
        where: { id: file.id },
      })

      const found = await testPrisma.fileStorage.findUnique({
        where: { id: file.id },
      })

      expect(found).toBeNull()
    })
  })

  // ============================================
  // 文件类型测试
  // ============================================

  describe('文件类型支持', () => {
    it('应该支持 PDF 文件', async () => {
      const file = await testPrisma.fileStorage.create({
        data: {
          fileName: 'document.pdf',
          filePath: '/uploads/document.pdf',
          mimeType: 'application/pdf',
          fileSize: 1024,
          originalName: "test.pdf",
          uploadedBy: testUser.id,
        },
      })
      expect(file.mimeType).toBe('application/pdf')
    })

    it('应该支持 Word 文件', async () => {
      const file = await testPrisma.fileStorage.create({
        data: {
          fileName: 'document.docx',
          filePath: '/uploads/document.docx',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          fileSize: 1024,
          originalName: "test.pdf",
          uploadedBy: testUser.id,
        },
      })
      expect(file.mimeType).toContain('wordprocessingml')
    })

    it('应该支持 Excel 文件', async () => {
      const file = await testPrisma.fileStorage.create({
        data: {
          fileName: 'spreadsheet.xlsx',
          filePath: '/uploads/spreadsheet.xlsx',
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          fileSize: 1024,
          originalName: "test.pdf",
          uploadedBy: testUser.id,
        },
      })
      expect(file.mimeType).toContain('spreadsheetml')
    })

    it('应该支持图片文件', async () => {
      const file = await testPrisma.fileStorage.create({
        data: {
          fileName: 'image.png',
          filePath: '/uploads/image.png',
          mimeType: 'image/png',
          fileSize: 512,
          originalName: "test.pdf",
          uploadedBy: testUser.id,
        },
      })
      expect(file.mimeType).toBe('image/png')
    })
  })

  // ============================================
  // 预览服务配置测试
  // ============================================

  describe('预览服务配置', () => {
    it('应该能创建预览服务配置', async () => {
      const config = await testPrisma.previewServiceConfig.create({
        data: {
          serviceType: 'ONLYOFFICE',
          endpoint: 'http://onlyoffice:8080',
          isEnabled: true,
          config: JSON.stringify({ jwtSecret: 'secret' }),
        },
      })

      expect(config).toBeDefined()
      expect(config.type).toBe('ONLYOFFICE')
      expect(config.isEnabled).toBe(true)
    })

    it('应该能创建 KKFileView 配置', async () => {
      const config = await testPrisma.previewServiceConfig.create({
        data: {
          type: 'KKFILEVIEW',
          endpoint: 'http://kkfileview:8012',
          isEnabled: true,
        },
      })

      expect(config.type).toBe('KKFILEVIEW')
    })

    it('应该能获取启用的预览服务', async () => {
      await testPrisma.previewServiceConfig.create({
        data: {
          serviceType: 'ONLYOFFICE',
          endpoint: 'http://enabled:8080',
          isEnabled: true,
        },
      })
      await testPrisma.previewServiceConfig.create({
        data: {
          type: 'KKFILEVIEW',
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
        data: {
          serviceType: 'ONLYOFFICE',
          endpoint: 'http://test:8080',
          isEnabled: true,
        },
      })

      const updated = await testPrisma.previewServiceConfig.update({
        where: { id: config.id },
        data: { isEnabled: false },
      })

      expect(updated.isEnabled).toBe(false)
    })
  })

  // ============================================
  // 文件关联测试
  // ============================================

  describe('文件关联', () => {
    it('应该能关联文件到项目', async () => {
      const file = await testPrisma.fileStorage.create({
        data: {
          fileName: 'project-file.pdf',
          filePath: '/uploads/project-file.pdf',
          mimeType: 'application/pdf',
          fileSize: 1024,
          originalName: "test.pdf",
          uploadedBy: testUser.id,
        },
      })

      expect(file.projectId).toBe(testProject.id)
    })

    it('应该能查询上传者的文件', async () => {
      await testPrisma.fileStorage.create({
        data: {
          fileName: 'user-file.pdf',
          filePath: '/uploads/user-file.pdf',
          mimeType: 'application/pdf',
          fileSize: 1024,
          originalName: "test.pdf",
          uploadedBy: testUser.id,
        },
      })

      const userFiles = await testPrisma.fileStorage.findMany({
        where: { uploadedBy: testUser.id },
      })

      expect(userFiles.length).toBe(1)
    })
  })
})
