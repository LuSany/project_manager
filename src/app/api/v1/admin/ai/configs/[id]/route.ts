import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ApiResponder } from '@/lib/api/response'
import { getAuthenticatedUser } from '@/lib/auth'

const aiConfigUpdateSchema = z.object({
  name: z.string().min(1, '配置名称不能为空').optional(),
  provider: z.enum(['OPENAI', 'ANTHROPIC', 'CUSTOM']).optional(),
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
  model: z.string().optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  config: z.string().optional(),
})

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getAuthenticatedUser(req)
    if (!user || user.role !== 'ADMIN') {
      return ApiResponder.forbidden('只有管理员可以更新AI配置')
    }

    const body = await req.json()
    const validatedData = aiConfigUpdateSchema.parse(body)

    if (validatedData.isDefault) {
      await prisma.ai_configs.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      })
    }

    const config = await prisma.ai_configs.update({
      where: { id },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.provider && { provider: validatedData.provider }),
        ...(validatedData.apiKey !== undefined && { apiKey: validatedData.apiKey }),
        ...(validatedData.baseUrl !== undefined && { baseUrl: validatedData.baseUrl }),
        ...(validatedData.model !== undefined && { model: validatedData.model }),
        ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive }),
        ...(validatedData.isDefault !== undefined && { isDefault: validatedData.isDefault }),
        ...(validatedData.config !== undefined && { config: validatedData.config }),
        updatedAt: new Date(),
      },
    })

    return ApiResponder.success(config, 'AI配置更新成功')
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
    console.error('更新AI配置失败:', error)
    return ApiResponder.serverError('更新失败')
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getAuthenticatedUser(req)
    if (!user || user.role !== 'ADMIN') {
      return ApiResponder.forbidden('只有管理员可以删除AI配置')
    }

    await prisma.ai_configs.delete({
      where: { id },
    })

    return ApiResponder.success(null, 'AI配置删除成功')
  } catch (error) {
    console.error('删除AI配置失败:', error)
    return ApiResponder.serverError('删除失败')
  }
}
