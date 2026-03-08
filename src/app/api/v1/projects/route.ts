import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { success, error } from '@/lib/api/response';
import type { AuthenticatedRequest } from '@/middleware';

// 项目创建验证 Schema
const createProjectSchema = z.object({
  name: z.string().min(2, '项目名称至少 2 位').max(100, '项目名称最多 100 位'),
  description: z.string().optional(),
  status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).default('PLANNING'),
  startDate: z.string().optional(), // 接受日期字符串
  endDate: z.string().optional(), // 接受日期字符串
});

export async function GET(request: NextRequest, context: any) {
  // 从中间件设置的 cookies 获取用户信息
  const userId = request.cookies.get('user-id')?.value;

  if (!userId) {
    return error('UNAUTHORIZED_ERROR', '未授权，请先登录', undefined, 401);
  }

  // 检查用户是否存在
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    return error('USER_NOT_FOUND_ERROR', '用户不存在', undefined, 404);
  }

  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '10');
  const status = searchParams.get('status') as any;

  // 构建查询条件：用户只能看到自己作为所有者或成员的项目，或者管理员可以看到所有项目
  const where: any = {};

  if (status) {
    where.status = status;
  }

  // 非管理员只能看到自己有权限的项目
  if (user.role !== 'ADMIN') {
    where.OR = [
      { ownerId: userId },
      { members: { some: { userId: userId } } }
    ];
  }

  const skip = (page - 1) * pageSize;
  const take = pageSize;

  try {
    const [total, projects] = await Promise.all([
      prisma.project.count({ where }),
      prisma.project.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
            },
          },
          members: {
            where: { userId: userId },
            select: { role: true },
          },
        },
      }),
    ]);

    return success({
      items: projects,
      total: Number(total),
      page,
      pageSize,
      totalPages: Math.ceil(Number(total) / pageSize),
    });
  } catch (err) {
    console.error('获取项目列表失败:', err);
    return error('获取项目列表失败_ERROR', '获取项目列表失败', undefined, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    // 从中间件获取用户信息
    const userId = request.cookies.get('user-id')?.value;

    if (!userId) {
      return error('UNAUTHORIZED', '未授权，请先登录', undefined, 401);
    }

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return error('USER_NOT_FOUND', '用户不存在', undefined, 404);
    }

    // 解析并验证请求体
    const body = await request.json();
    const validatedData = createProjectSchema.parse(body);

    // 创建项目
    const project = await prisma.project.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        status: validatedData.status,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        ownerId: userId,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        startDate: project.startDate,
        endDate: project.endDate,
        owner: project.owner,
      },
      message: '项目创建成功',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      console.error('项目创建验证失败:', err.issues);
      return error('VALIDATION_ERROR', '请求数据验证失败', { issues: err.issues }, 400);
    }
    console.error('创建项目错误:', err);
    return error('INTERNAL_ERROR', '创建项目失败', undefined, 500);
  }
}
