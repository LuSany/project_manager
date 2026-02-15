import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error } from '@/lib/api/response';

// GET /api/v1/notifications - 获取通知列表
export async function GET(request: NextRequest, context: any) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const unreadOnly = searchParams.get('unreadOnly') === 'true';

  if (!userId) {
    return error('用户ID不能为空_ERROR', '用户ID不能为空', undefined, 400);
  }

  const where: any = { userId };
  if (unreadOnly) {
    where.isRead = false;
  }

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json(success(notifications));
}

// POST /api/v1/notifications - 创建通知
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, title, content, link, userId, projectId } = body;

    if (!type || !title || !content || !userId) {
      return error('缺少必填字段_ERROR', '缺少必填字段', undefined, 400);
    }

    const notification = await prisma.notification.create({
      data: {
        type,
        title,
        content,
        link: link || null,
        userId,
        projectId: projectId || null,
        isRead: false,
      },
    });

    return NextResponse.json(success(notification));
  } catch (err) {
    console.error('创建通知失败:', err);
    return error('创建通知失败_ERROR', '创建通知失败', undefined, 500);
  }
}

// PUT /api/v1/notifications/[id]/read - 标记通知为已读
export async function PUT(request: NextRequest, context: any) {
  const id = context.params.id;

  try {
    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return NextResponse.json(success({ message: '通知已标记为已读' }));
  } catch (err) {
    console.error('标记通知已读失败:', err);
    return error('标记通知已读失败_ERROR', '标记通知已读失败', undefined, 500);
  }
}

// DELETE /api/v1/notifications/[id] - 删除通知
export async function DELETE(request: NextRequest, context: any) {
  const id = context.params.id;

  try {
    await prisma.notification.delete({
      where: { id },
    });

    return NextResponse.json(success({ message: '通知已删除' }));
  } catch (err) {
    console.error('删除通知失败:', err);
    return error('删除通知失败_ERROR', '删除通知失败', undefined, 500);
  }
}
