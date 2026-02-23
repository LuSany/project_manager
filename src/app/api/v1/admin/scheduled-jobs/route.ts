import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth'
import { ApiResponder } from '@/lib/api/response'

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user || user.role !== 'ADMIN') {
      return ApiResponder.forbidden('只有管理员可以访问定时任务')
    }

    const jobs = await prisma.scheduledJob.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return ApiResponder.success(jobs)
  } catch (error) {
    console.error('获取定时任务列表失败:', error)
    return ApiResponder.serverError('获取定时任务列表失败')
  }
}
