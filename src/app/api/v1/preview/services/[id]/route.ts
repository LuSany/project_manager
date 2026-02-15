import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error } from '@/lib/api/response';
import { z } from 'zod';

// PUT /api/v1/preview/services/[id] - 更新预览服务配置
const updateServiceSchema = z.object({
  endpoint: z.string().url().optional(),
  isEnabled: z.boolean().optional(),
  config: z.string().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validated = updateServiceSchema.parse(body);

    // 检查服务配置是否存在
    const existing = await prisma.previewServiceConfig.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(error('预览服务配置不存在', 404));
    }

    const updateData: any = {};
    if (validated.endpoint !== undefined) updateData.endpoint = validated.endpoint;
    if (validated.isEnabled !== undefined) updateData.isEnabled = validated.isEnabled;
    if (validated.config !== undefined) updateData.config = validated.config;
    updateData.updatedAt = new Date();

    const service = await prisma.previewServiceConfig.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(success(service));
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(error('参数验证失败', 400, err.errors));
    }
    console.error('更新预览服务配置失败:', err);
    return NextResponse.json(error('更新预览服务配置失败', 500));
  }
}

// DELETE /api/v1/preview/services/[id] - 删除预览服务配置
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 检查服务配置是否存在
    const existing = await prisma.previewServiceConfig.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(error('预览服务配置不存在', 404));
    }

    await prisma.previewServiceConfig.delete({
      where: { id: params.id },
    });

    return NextResponse.json(success({ message: '预览服务配置已删除' }));
  } catch (err) {
    console.error('删除预览服务配置失败:', err);
    return NextResponse.json(error('删除预览服务配置失败', 500));
  }
}
