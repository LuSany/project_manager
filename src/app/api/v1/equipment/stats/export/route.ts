import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { generateExcelBuffer } from '@/lib/equipment-stats'

async function getAuthUser(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value
  if (!userId) return null
  return db.users.findUnique({ where: { id: userId } })
}

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as 'project-hours' | 'device-utilization' | 'usage-record'
    const month = searchParams.get('month') || undefined
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined
    const projectId = searchParams.get('projectId') || undefined
    const deviceTypeId = searchParams.get('deviceTypeId') || undefined

    if (!type) {
      return new Response('Missing type parameter', { status: 400 })
    }

    const buffer = await generateExcelBuffer({
      type,
      month,
      startDate,
      endDate,
      projectId,
      deviceTypeId,
    })

    const timestamp = new Date().toISOString().slice(0, 10)

    return new Response(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="equipment-stats-${timestamp}.xlsx"`,
      },
    })
  } catch (err) {
    console.error('导出Excel失败:', err)
    return new Response('Export failed', { status: 500 })
  }
}
