import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error } from '@/lib/api/response';
import { z } from 'zod';

const updateServiceSchema = z.object({
  endpoint: z.string().optional(),
  isEnabled: z.boolean().optional(),
  config: z.string().optional(),
});

export async function PUT(request: NextRequest, context: any) {
  const id = context.params.id;

  try {
    const body = await request.json();
    const validated = updateServiceSchema.parse(body);

    const service = await prisma.previewServiceConfig.findUnique({
      where: { id },
    });

    if (!service) {
      return error('SERVICE_NOT_FOUND', '预览服务配置不存在', undefined, 404);
    }

    const updateData: any = {};
    if (validated.endpoint !== undefined) updateData.endpoint = validated.endpoint;
    if (validated.isEnabled !== undefined) updateData.isEnabled = validated.isEnabled;
    if (validated.config !== undefined) updateData.config = validated.config;

    const updatedService = await prisma.previewServiceConfig.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(success(updatedService));
  } catch (err) {
    if (err instanceof z.ZodError) {
      return error('VALIDATION_ERROR', '参数验证失败', { errors: err.errors }, 400);
    }
    console.error('更新预览服务配置失败:', err);
    return error('UPDATE_SERVICE_FAILED', '更新预览服务配置失败', undefined, 500);
  }
}

// DELETE /api/v1/preview/services/[id] - 删除预览服务配置
export async function DELETE(request: NextRequest, context: any) {
  const id = context.params.id;

  try {
    const existing = await prisma.previewServiceConfig.findUnique({
      where: { id },
    });

    if (!existing) {
      return error('SERVICE_NOT_FOUND', '预览服务配置不存在', undefined, 404);
    }

    await prisma.previewServiceConfig.delete({
      where: { id },
    });

    return NextResponse.json(success({ message: '预览服务配置已删除' }));
  } catch (err) {
    console.error('删除预览服务配置失败:', err);
    return error('DELETE_SERVICE_FAILED', '删除预览服务配置失败', undefined, 500);
  }
}
