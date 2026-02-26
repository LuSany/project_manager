// ============================================================================
// 文件管理模块单元测试
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'

describe('FileStorage 文件管理', () => {
  beforeEach(async () => {
    await prisma.fileStorage.deleteMany()
    await prisma.user.deleteMany()
  })

  describe('文件上传', () => {
    it('应该成功创建文件记录', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'file-user@test.com',
          passwordHash: 'hashed',
          name: 'User',
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      })

      const file = await prisma.fileStorage.create({
        data: {
          fileName: 'test-document.pdf',
          originalName: 'Original Document.pdf',
          filePath: '/uploads/test-document.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          uploadedBy: user.id,
        },
      })

      expect(file.id).toBeDefined()
      expect(file.fileName).toBe('test-document.pdf')
      expect(file.fileSize).toBe(1024)
      expect(file.mimeType).toBe('application/pdf')
    })

    it('应该记录文件大小（字节）', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'file-user2@test.com',
          passwordHash: 'hashed',
          name: 'User',
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      })

      const file = await prisma.fileStorage.create({
        data: {
          fileName: 'large-file.zip',
          originalName: 'Large File.zip',
          filePath: '/uploads/large-file.zip',
          fileSize: 10485760,
          mimeType: 'application/zip',
          uploadedBy: user.id,
        },
      })

      expect(file.fileSize).toBe(10485760)
    })

    it('应该记录 MIME 类型', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'file-user3@test.com',
          passwordHash: 'hashed',
          name: 'User',
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      })

      const mimeTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/png',
        'image/jpeg',
      ]

      for (const mimeType of mimeTypes) {
        const file = await prisma.fileStorage.create({
          data: {
            fileName: `test.${mimeType.split('/')[1]}`,
            originalName: 'Test File',
            filePath: `/uploads/test.${mimeType.split('/')[1]}`,
            fileSize: 1024,
            mimeType,
            uploadedBy: user.id,
          },
        })

        expect(file.mimeType).toBe(mimeType)
      }
    })

    it('应该记录上传者', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'file-user4@test.com',
          passwordHash: 'hashed',
          name: 'User',
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      })

      const file = await prisma.fileStorage.create({
        data: {
          fileName: 'test.pdf',
          originalName: 'Test.pdf',
          filePath: '/uploads/test.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          uploadedBy: user.id,
        },
      })

      expect(file.uploadedBy).toBe(user.id)
    })

    it('应该自动设置上传时间', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'file-user5@test.com',
          passwordHash: 'hashed',
          name: 'User',
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      })

      const beforeCreate = new Date()
      const file = await prisma.fileStorage.create({
        data: {
          fileName: 'test.pdf',
          originalName: 'Test.pdf',
          filePath: '/uploads/test.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          uploadedBy: user.id,
        },
      })
      const afterCreate = new Date()

      expect(file.createdAt).toBeGreaterThanOrEqual(beforeCreate)
      expect(file.createdAt).toBeLessThanOrEqual(afterCreate)
    })
  })

  describe('文件查询', () => {
    it('应该支持按上传者查询', async () => {
      const user1 = await prisma.user.create({
        data: {
          email: 'file-user6@test.com',
          passwordHash: 'hashed',
          name: 'User 1',
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      })
      const user2 = await prisma.user.create({
        data: {
          email: 'file-user7@test.com',
          passwordHash: 'hashed',
          name: 'User 2',
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      })

      await prisma.fileStorage.create({
        data: {
          fileName: 'user1-file.pdf',
          originalName: 'User1 File.pdf',
          filePath: '/uploads/user1-file.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          uploadedBy: user1.id,
        },
      })

      await prisma.fileStorage.create({
        data: {
          fileName: 'user2-file.pdf',
          originalName: 'User2 File.pdf',
          filePath: '/uploads/user2-file.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          uploadedBy: user2.id,
        },
      })

      const user1Files = await prisma.fileStorage.findMany({
        where: { uploadedBy: user1.id },
      })

      expect(user1Files.length).toBe(1)
      expect(user1Files[0].fileName).toBe('user1-file.pdf')
    })

    it('应该支持按 MIME 类型查询', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'file-user8@test.com',
          passwordHash: 'hashed',
          name: 'User',
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      })

      await prisma.fileStorage.create({
        data: {
          fileName: 'doc.pdf',
          originalName: 'Doc.pdf',
          filePath: '/uploads/doc.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          uploadedBy: user.id,
        },
      })

      await prisma.fileStorage.create({
        data: {
          fileName: 'image.png',
          originalName: 'Image.png',
          filePath: '/uploads/image.png',
          fileSize: 2048,
          mimeType: 'image/png',
          uploadedBy: user.id,
        },
      })

      const pdfFiles = await prisma.fileStorage.findMany({
        where: { mimeType: 'application/pdf' },
      })

      expect(pdfFiles.length).toBe(1)
      expect(pdfFiles[0].mimeType).toBe('application/pdf')
    })
  })

  describe('文件删除', () => {
    it('应该删除文件记录', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'file-user9@test.com',
          passwordHash: 'hashed',
          name: 'User',
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      })

      const file = await prisma.fileStorage.create({
        data: {
          fileName: 'to-delete.pdf',
          originalName: 'To Delete.pdf',
          filePath: '/uploads/to-delete.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          uploadedBy: user.id,
        },
      })

      await prisma.fileStorage.delete({
        where: { id: file.id },
      })

      const deleted = await prisma.fileStorage.findUnique({
        where: { id: file.id },
      })

      expect(deleted).toBeNull()
    })
  })
})
