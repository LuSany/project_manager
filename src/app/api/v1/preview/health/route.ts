import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api/response'
import { db } from '@/lib/db'
import { getAllServicesHealth, checkServiceHealth } from '@/lib/preview/degradation'
import { PreviewServiceType } from '@/lib/preview/degradation'

// 辅助函数：获取认证用户
async function getAuthUser(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value
  if (!userId) return null
  return db.user.findUnique({ where: { id: userId } })
}

// GET /api/v1/preview/health - 获取所有预览服务健康状态
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) {
    return error('UNAUTHORIZED', '未授权，请先登录', undefined, 401)
  }

  try {
    const healthStatus = await getAllServicesHealth()
    return NextResponse.json(success(healthStatus))
  } catch (err) {
    console.error('获取预览服务健康状态失败:', err)
    return error('GET_HEALTH_ERROR', '获取健康状态失败', undefined, 500)
  }
}

// POST /api/v1/preview/health - 检查特定服务健康状态
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) {
    return error('UNAUTHORIZED', '未授权，请先登录', undefined, 401)
  }

  try {
    const body = await request.json()
    const { serviceType } = body

    if (!serviceType) {
      return error('VALIDATION_ERROR', '缺少服务类型', undefined, 400)
    }

    const config = await db.previewServiceConfig.findFirst({
      where: { serviceType: serviceType as any, isEnabled: true },
    })

    if (!config) {
      return error('NOT_FOUND', '服务配置不存在', undefined, 404)
    }

    const health = await checkServiceHealth(
      serviceType as PreviewServiceType,
      config as any
    )

    return NextResponse.json(success(health))
  } catch (err) {
    console.error('检查预览服务健康状态失败:', err)
    return error('CHECK_HEALTH_ERROR', '检查健康状态失败', undefined, 500)
  }
}