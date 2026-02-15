import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error } from '@/lib/api/response';

export async function GET(request: NextRequest, context: any) {
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '10');
  const status = searchParams.get('status') as any;
  const ownerId = searchParams.get('ownerId');

  const where: any = {};
  if (status) {
    where.status = status;
  }
  if (ownerId) {
    where.ownerId = ownerId;
  }

  const skip = (page - 1) * pageSize;
  const take = pageSize;

  try {
    const [projects, total] = await Promise.all([
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
        },
      }),
    ]);

    return NextResponse.json(success({
      items: projects,
      total: Number(total),
      page,
      pageSize,
      totalPages: Math.ceil(Number(total) / pageSize),
    }));
  } catch (err) {
    console.error('获取项目列表失败:', err);
    return error('获取项目列表失败_ERROR', '获取项目列表失败', undefined, 500);
  }
}
