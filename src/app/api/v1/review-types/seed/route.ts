import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth'
import { ApiResponder } from '@/lib/api/response'

const DEFAULT_REVIEW_TYPES = [
  {
    name: 'FEASIBILITY',
    displayName: '可行性评估评审',
    description: '评估项目或方案可行性',
    isSystem: true,
  },
  { name: 'MILESTONE', displayName: '里程碑评审', description: '里程碑相关评审', isSystem: true },
  {
    name: 'TEST_PLAN',
    displayName: '测试方案评审',
    description: '测试方案或规程评审',
    isSystem: true,
  },
  {
    name: 'TEST_RELEASE',
    displayName: '测试发布评审',
    description: '测试程序发布评审',
    isSystem: true,
  },
  { name: 'TEST_REPORT', displayName: '测试报告评审', description: '测试报告评审', isSystem: true },
  { name: 'INITIAL', displayName: '初审', description: '初步评审', isSystem: true },
  { name: 'FINAL', displayName: '终审', description: '最终评审', isSystem: true },
  { name: 'PHASE', displayName: '阶段评审', description: '阶段评审', isSystem: true },
]

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user || user.role !== 'ADMIN') {
      return ApiResponder.forbidden('只有管理员可以初始化评审类型')
    }

    const results = []

    for (const type of DEFAULT_REVIEW_TYPES) {
      const existing = await prisma.reviewTypeConfig.findUnique({
        where: { name: type.name },
      })

      if (!existing) {
        const created = await prisma.reviewTypeConfig.create({
          data: type,
        })
        results.push({ name: type.name, status: 'created', id: created.id })
      } else {
        results.push({ name: type.name, status: 'exists', id: existing.id })
      }
    }

    return ApiResponder.success(results, '评审类型初始化完成')
  } catch (error) {
    console.error('初始化评审类型失败:', error)
    return ApiResponder.serverError('初始化评审类型失败')
  }
}
