/**
 * ReviewMaterial 模型测试 - P1 重要业务模型
 *
 * 测试覆盖:
 * - CRUD 操作
 * - 评审材料管理
 * - 材料版本控制
 * - 与评审的关联关系
 * - 材料类型和 URL
 *
 * 优先级：P1 - 重要业务模型
 */

import { describe, it, expect } from 'vitest'
import { testPrisma } from '../helpers/test-db'
import {
  createTestUser,
  createTestProject,
  createTestReview,
  createTestReviewTypeConfig,
} from '../helpers/test-data-factory'

describe('ReviewMaterial Model - P1 Core', () => {
  describe('Basic CRUD', () => {
    it('should create review material successfully', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      const material = await testPrisma.reviewMaterial.create({
        data: {
          reviewId: review.id,
          name: 'Design Document',
          url: 'https://example.com/materials/design.pdf',
          materialType: 'DESIGN',
        },
      })

      expect(material).toBeDefined()
      expect(material.reviewId).toBe(review.id)
      expect(material.name).toBe('Design Document')
      expect(material.url).toBe('https://example.com/materials/design.pdf')
      expect(material.materialType).toBe('DESIGN')
    })

    it('should create material with all types', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      const types = ['DESIGN', 'CODE', 'DOCUMENTATION', 'TEST_PLAN', 'OTHER']

      for (const type of types) {
        await testPrisma.reviewMaterial.create({
          data: {
            reviewId: review.id,
            name: `${type} Material`,
            url: `https://example.com/${type.toLowerCase()}`,
            materialType: type as any,
          },
        })
      }

      const materials = await testPrisma.reviewMaterial.findMany({
        where: { reviewId: review.id },
      })

      expect(materials).toHaveLength(types.length)
    })

    it('should update material name and URL', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      const material = await testPrisma.reviewMaterial.create({
        data: {
          reviewId: review.id,
          name: 'Old Name',
          url: 'https://example.com/old',
          materialType: 'DESIGN',
        },
      })

      const updated = await testPrisma.reviewMaterial.update({
        where: { id: material.id },
        data: {
          name: 'Updated Name',
          url: 'https://example.com/updated',
        },
      })

      expect(updated.name).toBe('Updated Name')
      expect(updated.url).toBe('https://example.com/updated')
    })

    it('should delete material', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      const material = await testPrisma.reviewMaterial.create({
        data: {
          reviewId: review.id,
          name: 'To Delete',
          url: 'https://example.com/delete',
          materialType: 'DESIGN',
        },
      })

      await testPrisma.reviewMaterial.delete({
        where: { id: material.id },
      })

      const found = await testPrisma.reviewMaterial.findUnique({
        where: { id: material.id },
      })
      expect(found).toBeNull()
    })
  })

  describe('Material Types', () => {
    it('should create DESIGN type material', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      const material = await testPrisma.reviewMaterial.create({
        data: {
          reviewId: review.id,
          name: 'Architecture Design',
          url: 'https://example.com/design.pdf',
          materialType: 'DESIGN',
        },
      })

      expect(material.materialType).toBe('DESIGN')
    })

    it('should create CODE type material', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      const material = await testPrisma.reviewMaterial.create({
        data: {
          reviewId: review.id,
          name: 'Source Code Repository',
          url: 'https://github.com/repo',
          materialType: 'CODE',
        },
      })

      expect(material.materialType).toBe('CODE')
    })

    it('should create DOCUMENTATION type material', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      const material = await testPrisma.reviewMaterial.create({
        data: {
          reviewId: review.id,
          name: 'User Manual',
          url: 'https://example.com/manual.pdf',
          materialType: 'DOCUMENTATION',
        },
      })

      expect(material.materialType).toBe('DOCUMENTATION')
    })

    it('should create TEST_PLAN type material', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      const material = await testPrisma.reviewMaterial.create({
        data: {
          reviewId: review.id,
          name: 'Test Plan Document',
          url: 'https://example.com/test-plan.pdf',
          materialType: 'TEST_PLAN',
        },
      })

      expect(material.materialType).toBe('TEST_PLAN')
    })

    it('should create OTHER type material', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      const material = await testPrisma.reviewMaterial.create({
        data: {
          reviewId: review.id,
          name: 'Other Supporting Material',
          url: 'https://example.com/other.pdf',
          materialType: 'OTHER',
        },
      })

      expect(material.materialType).toBe('OTHER')
    })
  })

  describe('ReviewMaterial Relationships', () => {
    it('should associate material with review', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      const material = await testPrisma.reviewMaterial.create({
        data: {
          reviewId: review.id,
          name: 'Review Material',
          url: 'https://example.com/material.pdf',
          materialType: 'DESIGN',
        },
      })

      expect(material.reviewId).toBe(review.id)

      // Verify from review side
      const reviewWithMaterials = await testPrisma.review.findUnique({
        where: { id: review.id },
        include: { materials: true },
      })

      expect(reviewWithMaterials?.materials).toHaveLength(1)
    })

    it('should allow multiple materials for same review', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      await testPrisma.reviewMaterial.create({
        data: {
          reviewId: review.id,
          name: 'Design Doc',
          url: 'https://example.com/design.pdf',
          materialType: 'DESIGN',
        },
      })

      await testPrisma.reviewMaterial.create({
        data: {
          reviewId: review.id,
          name: 'Code Review',
          url: 'https://github.com/repo',
          materialType: 'CODE',
        },
      })

      await testPrisma.reviewMaterial.create({
        data: {
          reviewId: review.id,
          name: 'Test Plan',
          url: 'https://example.com/test.pdf',
          materialType: 'TEST_PLAN',
        },
      })

      const materials = await testPrisma.reviewMaterial.findMany({
        where: { reviewId: review.id },
      })

      expect(materials).toHaveLength(3)
    })

    it('should cascade delete material when review deleted', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      const material = await testPrisma.reviewMaterial.create({
        data: {
          reviewId: review.id,
          name: 'Cascade Test',
          url: 'https://example.com/cascade.pdf',
          materialType: 'DESIGN',
        },
      })

      // Delete review
      await testPrisma.review.delete({
        where: { id: review.id },
      })

      // Verify material is also deleted (CASCADE)
      const found = await testPrisma.reviewMaterial.findUnique({
        where: { id: material.id },
      })

      expect(found).toBeNull()
    })
  })

  describe('Material URL Validation', () => {
    it('should store HTTP URLs', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      const material = await testPrisma.reviewMaterial.create({
        data: {
          reviewId: review.id,
          name: 'HTTP Material',
          url: 'http://example.com/material.pdf',
          materialType: 'DESIGN',
        },
      })

      expect(material.url).toBe('http://example.com/material.pdf')
    })

    it('should store HTTPS URLs', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      const material = await testPrisma.reviewMaterial.create({
        data: {
          reviewId: review.id,
          name: 'HTTPS Material',
          url: 'https://secure.example.com/material.pdf',
          materialType: 'DESIGN',
        },
      })

      expect(material.url).toBe('https://secure.example.com/material.pdf')
    })

    it('should store repository URLs', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      const material = await testPrisma.reviewMaterial.create({
        data: {
          reviewId: review.id,
          name: 'Git Repository',
          url: 'https://github.com/org/repo/tree/main',
          materialType: 'CODE',
        },
      })

      expect(material.url).toContain('github.com')
    })
  })

  describe('Material Queries', () => {
    it('should find materials by reviewId', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review1 = await createTestReview(project.id, type.id)
      const review2 = await createTestReview(project.id, type.id)

      await testPrisma.reviewMaterial.create({
        data: {
          reviewId: review1.id,
          name: 'Material 1',
          url: 'https://example.com/1.pdf',
          materialType: 'DESIGN',
        },
      })

      await testPrisma.reviewMaterial.create({
        data: {
          reviewId: review1.id,
          name: 'Material 2',
          url: 'https://example.com/2.pdf',
          materialType: 'CODE',
        },
      })

      await testPrisma.reviewMaterial.create({
        data: {
          reviewId: review2.id,
          name: 'Material 3',
          url: 'https://example.com/3.pdf',
          materialType: 'DESIGN',
        },
      })

      const review1Materials = await testPrisma.reviewMaterial.findMany({
        where: { reviewId: review1.id },
      })

      expect(review1Materials).toHaveLength(2)
    })

    it('should find materials by materialType', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      await testPrisma.reviewMaterial.create({
        data: {
          reviewId: review.id,
          name: 'Design 1',
          url: 'https://example.com/design1.pdf',
          materialType: 'DESIGN',
        },
      })

      await testPrisma.reviewMaterial.create({
        data: {
          reviewId: review.id,
          name: 'Design 2',
          url: 'https://example.com/design2.pdf',
          materialType: 'DESIGN',
        },
      })

      await testPrisma.reviewMaterial.create({
        data: {
          reviewId: review.id,
          name: 'Code',
          url: 'https://github.com/repo',
          materialType: 'CODE',
        },
      })

      const designMaterials = await testPrisma.reviewMaterial.findMany({
        where: {
          reviewId: review.id,
          materialType: 'DESIGN',
        },
      })

      expect(designMaterials).toHaveLength(2)
    })

    it('should query material with review', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id, {
        title: 'Review with Materials',
      })

      const material = await testPrisma.reviewMaterial.create({
        data: {
          reviewId: review.id,
          name: 'Important Material',
          url: 'https://example.com/important.pdf',
          materialType: 'DESIGN',
        },
      })

      const materialWithReview = await testPrisma.reviewMaterial.findUnique({
        where: { id: material.id },
        include: {
          review: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      })

      expect(materialWithReview?.review.title).toBe('Review with Materials')
    })

    it('should order materials by createdAt', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      const material1 = await testPrisma.reviewMaterial.create({
        data: {
          reviewId: review.id,
          name: 'First Material',
          url: 'https://example.com/first.pdf',
          materialType: 'DESIGN',
        },
      })

      await new Promise((resolve) => setTimeout(resolve, 10))

      const material2 = await testPrisma.reviewMaterial.create({
        data: {
          reviewId: review.id,
          name: 'Second Material',
          url: 'https://example.com/second.pdf',
          materialType: 'CODE',
        },
      })

      const materials = await testPrisma.reviewMaterial.findMany({
        where: { reviewId: review.id },
        orderBy: { createdAt: 'asc' },
      })

      expect(materials[0].id).toBe(material1.id)
      expect(materials[1].id).toBe(material2.id)
    })
  })

  describe('Material Management Workflow', () => {
    it('should support complete material lifecycle', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      // Add initial material
      const material = await testPrisma.reviewMaterial.create({
        data: {
          reviewId: review.id,
          name: 'Initial Design',
          url: 'https://example.com/design-v1.pdf',
          materialType: 'DESIGN',
        },
      })

      expect(material.name).toBe('Initial Design')

      // Update to new version
      const updated = await testPrisma.reviewMaterial.update({
        where: { id: material.id },
        data: {
          name: 'Updated Design v2',
          url: 'https://example.com/design-v2.pdf',
        },
      })

      expect(updated.name).toBe('Updated Design v2')
      expect(updated.url).toContain('v2')

      // Add supplementary material
      await testPrisma.reviewMaterial.create({
        data: {
          reviewId: review.id,
          name: 'Supporting Analysis',
          url: 'https://example.com/analysis.pdf',
          materialType: 'OTHER',
        },
      })

      const allMaterials = await testPrisma.reviewMaterial.findMany({
        where: { reviewId: review.id },
      })

      expect(allMaterials).toHaveLength(2)
    })
  })
})
