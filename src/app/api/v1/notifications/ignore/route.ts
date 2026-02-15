import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error } from '@/lib/api/response';

// POST /api/v1/notifications/ignore - 忽略项目通知
export async function POST(request: NextRequest) {
  try {
    // 从中间件设置的 cookies 获取用户信息
    const userId = request.cookies.get('user-id')?.value;

    if (!userId) {
      return error('UNAUTHORIZED_ERROR', '未授权，请先登录', undefined, 401);
    }

    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return error('项目ID不能为空_ERROR', '项目ID不能为空', undefined, 400);
    }

    const ignore = await prisma.notificationIgnore.create({
      data: {
        userId, // 使用当前认证用户的ID
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
    // 从中间件设置的 cookies 获取用户信息
    const userId = request.cookies.get('user-id')?.value;

    if (!userId) {
      return error('UNAUTHORIZED_ERROR', '未授权，请先登录', undefined, 401);
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return error('项目ID不能为空_ERROR', '项目ID不能为空', undefined, 400);
    }

    await prisma.notificationIgnore.deleteMany({
      where: {
        userId, // 只能删除当前用户的忽略设置
        projectId,
      },
    });

    return NextResponse.json(success({ message: '已取消忽略项目通知' }));
  } catch (err) {
    console.error('取消忽略项目通知失败:', err);
    return error('取消忽略项目通知失败_ERROR', '取消忽略项目通知失败', undefined, 500);
  }
}
