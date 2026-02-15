import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error } from '@/lib/api/response';
import { z } from 'zod';

// GET /api/v1/preview/services - 获取预览服务配置列表
export async function GET(request: NextRequest) {
  try {
    const services = await prisma.previewServiceConfig.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(success(services));
  } catch (err) {
    console.error('获取预览服务配置失败:', err);
    return error('FETCH_SERVICES_FAILED', '获取预览服务配置失败', undefined, 500);
  }
}

// POST /api/v1/preview/services - 创建预览服务配置
const createServiceSchema = z.object({
  serviceType: z.enum(['ONLYOFFICE', 'KKFILEVIEW', 'NATIVE']),
  endpoint: z.string().url(),
  isEnabled: z.boolean().default(true),
  config: z.string().optional(), // JSON格式存储服务配置
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createServiceSchema.parse(body);

    const service = await prisma.previewServiceConfig.create({
      data: {
        serviceType: validated.serviceType,
        endpoint: validated.endpoint,
        isEnabled: validated.isEnabled,
        config: validated.config || '{}',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(success(service));
  } catch (err) {
    if (err instanceof z.ZodError) {
      return error('VALIDATION_ERROR', '参数验证失败', { errors: err.errors }, 400);
    }
    console.error('创建预览服务配置失败:', err);
    return error('CREATE_SERVICE_FAILED', '创建预览服务配置失败', undefined, 500);
  }
}
