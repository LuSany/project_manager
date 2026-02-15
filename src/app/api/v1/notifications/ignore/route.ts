import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error } from '@/lib/api/response';

// POST /api/v1/notifications/ignore - 忽略项目通知
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, projectId } = body;

    if (!userId || !projectId) {
      return error('用户ID和项目ID不能为空_ERROR', '用户ID和项目ID不能为空', undefined, 400);
    }

    const ignore = await prisma.notificationIgnore.create({
      data: {
        userId,
        projectId,
      },
    });

    return NextResponse.json(success(ignore));
  } catch (err) {
    console.error('忽略项目通知失败:', err);
    return error('忽略项目通知失败_ERROR', '忽略项目通知失败', undefined, 500);
  }
}

// DELETE /api/v1/notifications/ignore - 取消忽略项目通知
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const projectId = searchParams.get('projectId');

    if (!userId || !projectId) {
      return error('用户ID和项目ID不能为空_ERROR', '用户ID和项目ID不能为空', undefined, 400);
    }

    await prisma.notificationIgnore.deleteMany({
      where: {
        userId,
        projectId,
      },
    });

    return NextResponse.json(success({ message: '已取消忽略项目通知' }));
  } catch (err) {
    console.error('取消忽略项目通知失败:', err);
    return error('取消忽略项目通知失败_ERROR', '取消忽略项目通知失败', undefined, 500);
  }
}
