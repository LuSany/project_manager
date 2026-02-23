import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ApiResponder } from '@/lib/api/response'
import { getAuthenticatedUser } from '@/lib/auth'

const aiConfigCreateSchema = z.object({
  name: z.string().min(1, '配置名称不能为空'),
  provider: z.enum(['OPENAI', 'ANTHROPIC', 'CUSTOM']),
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
  model: z.string().optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  config: z.string().optional(),
})

const aiConfigUpdateSchema = aiConfigCreateSchema.partial()

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user || user.role !== 'ADMIN') {
      return ApiResponder.forbidden('只有管理员可以访问AI配置')
    }

    const configs = await prisma.aIConfig.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return ApiResponder.success(configs)
  } catch (error) {
    console.error('获取AI配置失败:', error)
    return ApiResponder.serverError('获取失败')
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user || user.role !== 'ADMIN') {
      return ApiResponder.forbidden('只有管理员可以创建AI配置')
    }

    const body = await req.json()
    const validatedData = aiConfigCreateSchema.parse(body)

    if (validatedData.isDefault) {
      await prisma.aIConfig.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      })
    }

    const config = await prisma.aIConfig.create({
      data: {
        name: validatedData.name,
        provider: validatedData.provider,
        apiKey: validatedData.apiKey,
        baseUrl: validatedData.baseUrl,
        model: validatedData.model,
        isActive: validatedData.isActive,
        isDefault: validatedData.isDefault,
        config: validatedData.config,
      },
    })

    return ApiResponder.success(config, 'AI配置创建成功')
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.reduce(
        (acc, issue) => {
          acc[issue.path.join('.')] = issue.message
          return acc
        },
        {} as Record<string, string>
      )
      return ApiResponder.validationError('数据验证失败', issues)
    }
    console.error('创建AI配置失败:', error)
    return ApiResponder.serverError('创建失败')
  }
}
