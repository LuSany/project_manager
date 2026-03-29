import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ApiResponder } from '@/lib/api/response'
import { getAuthenticatedUser } from '@/lib/auth'

const emailConfigUpdateSchema = z.object({
  name: z.string().min(1, '配置名称不能为空').optional(),
  provider: z.enum(['COMPANY', 'SMTP', 'SENDGRID']).optional(),
  apiKey: z.string().optional(),
  smtpHost: z.string().optional(),
  smtpPort: z.number().optional(),
  smtpUser: z.string().optional(),
  smtpPassword: z.string().optional(),
  fromAddress: z.string().email().optional(),
  fromName: z.string().optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
})

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getAuthenticatedUser(req)
    if (!user || user.role !== 'ADMIN') {
      return ApiResponder.forbidden('只有管理员可以更新邮件配置')
    }

    const body = await req.json()
    const validatedData = emailConfigUpdateSchema.parse(body)

    if (validatedData.isDefault) {
      await prisma.email_configs.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      })
    }

    const config = await prisma.email_configs.update({
      where: { id },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.provider && { provider: validatedData.provider }),
        ...(validatedData.apiKey !== undefined && { apiKey: validatedData.apiKey }),
        ...(validatedData.smtpHost !== undefined && { smtpHost: validatedData.smtpHost }),
        ...(validatedData.smtpPort !== undefined && { smtpPort: validatedData.smtpPort }),
        ...(validatedData.smtpUser !== undefined && { smtpUser: validatedData.smtpUser }),
        ...(validatedData.smtpPassword !== undefined && {
          smtpPassword: validatedData.smtpPassword,
        }),
        ...(validatedData.fromAddress && { fromAddress: validatedData.fromAddress }),
        ...(validatedData.fromName !== undefined && { fromName: validatedData.fromName }),
        ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive }),
        ...(validatedData.isDefault !== undefined && { isDefault: validatedData.isDefault }),
        updatedAt: new Date(),
      },
    })

    return ApiResponder.success(config, '邮件配置更新成功')
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
    console.error('更新邮件配置失败:', error)
    return ApiResponder.serverError('更新失败')
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getAuthenticatedUser(req)
    if (!user || user.role !== 'ADMIN') {
      return ApiResponder.forbidden('只有管理员可以删除邮件配置')
    }

    await prisma.email_configs.delete({
      where: { id },
    })

    return ApiResponder.success(null, '邮件配置删除成功')
  } catch (error) {
    console.error('删除邮件配置失败:', error)
    return ApiResponder.serverError('删除失败')
  }
}
