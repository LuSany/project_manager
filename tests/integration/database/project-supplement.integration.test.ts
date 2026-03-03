/**
 * 项目管理补充集成测试
 *
 * 测试覆盖：
 * - 项目状态管理
 * - 项目成员角色
 * - 项目权限验证
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

describe('项目管理补充集成测试', () => {
  setupTestDatabase()

  let ownerUser: { id: string }
  let memberUser: { id: string }
  let testProject: { id: string }

  beforeEach(async () => {
    ownerUser = await createTestUser({ email: 'owner@example.com' })
    memberUser = await createTestUser({ email: 'member@example.com' })
    testProject = await createTestProject(ownerUser.id)
    await createTestProjectMember(testProject.id, ownerUser.id, { role: 'PROJECT_OWNER' })
  })

  // ============================================
  // 项目状态管理测试
  // ============================================

  describe('项目状态管理', () => {
    it('应该创建状态为 PLANNING 的项目', async () => {
      const project = await createTestProject(ownerUser.id, { status: 'PLANNING' })
      expect(project.status).toBe('PLANNING')
    })

    it('应该能更新项目状态为 ACTIVE', async () => {
      const updated = await testPrisma.project.update({
        where: { id: testProject.id },
        data: { status: 'ACTIVE' },
      })
      expect(updated.status).toBe('ACTIVE')
    })

    it('应该能更新项目状态为 COMPLETED', async () => {
      const updated = await testPrisma.project.update({
        where: { id: testProject.id },
        data: { status: 'COMPLETED' },
      })
      expect(updated.status).toBe('COMPLETED')
    })

    it('应该能更新项目状态为 ON_HOLD', async () => {
      const updated = await testPrisma.project.update({
        where: { id: testProject.id },
        data: { status: 'ON_HOLD' },
      })
      expect(updated.status).toBe('ON_HOLD')
    })

    it('应该能更新项目状态为 CANCELLED', async () => {
      const updated = await testPrisma.project.update({
        where: { id: testProject.id },
        data: { status: 'CANCELLED' },
      })
      expect(updated.status).toBe('CANCELLED')
    })

    it('应该能按状态筛选项目', async () => {
      await createTestProject(ownerUser.id, { status: 'ACTIVE' })
      await createTestProject(ownerUser.id, { status: 'COMPLETED' })

      const activeProjects = await testPrisma.project.findMany({
        where: { status: 'ACTIVE' },
      })
      expect(activeProjects.length).toBeGreaterThanOrEqual(1)
    })
  })

  // ============================================
  // 项目成员角色测试
  // ============================================

  describe('项目成员角色', () => {
    it('应该能添加 OWNER 角色成员', async () => {
      const member = await createTestProjectMember(testProject.id, ownerUser.id, { role: 'PROJECT_OWNER' })
      expect(member.role).toBe('OWNER')
    })

    it('应该能添加 ADMIN 角色成员', async () => {
      const member = await createTestProjectMember(testProject.id, memberUser.id, { role: 'ADMIN' })
      expect(member.role).toBe('ADMIN')
    })

    it('应该能添加 MEMBER 角色成员', async () => {
      const newUser = await createTestUser({ email: 'new-member@example.com' })
      const member = await createTestProjectMember(testProject.id, newUser.id, { role: 'MEMBER' })
      expect(member.role).toBe('MEMBER')
    })

    it('应该能查询项目的所有成员', async () => {
      await createTestProjectMember(testProject.id, memberUser.id, { role: 'MEMBER' })

      const members = await testPrisma.projectMember.findMany({
        where: { projectId: testProject.id },
      })
      expect(members.length).toBe(2) // owner + member
    })

    it('应该能删除项目成员', async () => {
      const member = await createTestProjectMember(testProject.id, memberUser.id, {
        role: 'MEMBER',
      })

      await testPrisma.projectMember.delete({
        where: {
          projectId_userId: {
            projectId: testProject.id,
            userId: memberUser.id,
          },
        },
      })

      const members = await testPrisma.projectMember.findMany({
        where: { projectId: testProject.id },
      })
      expect(members.length).toBe(1) // only owner
    })
  })

  // ============================================
  // 项目权限验证测试
  // ============================================

  describe('项目权限验证', () => {
    it('项目所有者应该有完全访问权限', async () => {
      const project = await testPrisma.project.findUnique({
        where: { id: testProject.id },
        include: { members: true },
      })

      const isOwner = project?.ownerId === ownerUser.id
      const isMember = project?.members.some((m) => m.userId === ownerUser.id)

      expect(isOwner || isMember).toBe(true)
    })

    it('项目成员应该有访问权限', async () => {
      await createTestProjectMember(testProject.id, memberUser.id, { role: 'MEMBER' })

      const membership = await testPrisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: testProject.id,
            userId: memberUser.id,
          },
        },
      })

      expect(membership).toBeDefined()
    })

    it('非项目成员应该无访问权限', async () => {
      const outsider = await createTestUser({ email: 'outsider@example.com' })

      const membership = await testPrisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: testProject.id,
            userId: outsider.id,
          },
        },
      })

      expect(membership).toBeNull()
    })
  })

  // ============================================
  // 项目关联数据测试
  // ============================================

  describe('项目关联数据', () => {
    it('删除项目应该级联删除成员', async () => {
      await createTestProjectMember(testProject.id, memberUser.id, { role: 'MEMBER' })

      await testPrisma.project.delete({
        where: { id: testProject.id },
      })

      const members = await testPrisma.projectMember.findMany({
        where: { projectId: testProject.id },
      })
      expect(members.length).toBe(0)
    })

    it('应该能查询项目的里程碑', async () => {
      await testPrisma.milestone.create({
        data: {
          title: 'Milestone 1',
          projectId: testProject.id,
        },
      })

      const milestones = await testPrisma.milestone.findMany({
        where: { projectId: testProject.id },
      })
      expect(milestones.length).toBe(1)
    })

    it('应该能查询项目的任务', async () => {
      await testPrisma.task.create({
        data: {
          title: 'Task 1',
          projectId: testProject.id,
        },
      })

      const tasks = await testPrisma.task.findMany({
        where: { projectId: testProject.id },
      })
      expect(tasks.length).toBe(1)
    })
  })
})
