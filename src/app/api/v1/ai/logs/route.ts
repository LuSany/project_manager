import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { success, error } from '@/lib/api/response'

// 辅助函数：检查管理员权限
async function checkAdmin(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value
  if (!userId) return null

  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user || user.role !== 'ADMIN') return null

  return user
}

// GET /api/v1/ai/logs - 获取 AI 调用日志
export async function GET(request: NextRequest) {
  const admin = await checkAdmin(request)
  if (!admin) {
    return error('FORBIDDEN', '无权限访问', undefined, 403)
  }

  try {
    const { searchParams } = new URL(request.url)
    const serviceType = searchParams.get('serviceType')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}
    if (serviceType) {
      where.serviceType = serviceType
    }

    const logs = await db.aILog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json(success(logs))
  } catch (err) {
    console.error('获取 AI 日志失败:', err)
    return error('GET_LOGS_ERROR', '获取 AI 日志失败', undefined, 500)
  }
}