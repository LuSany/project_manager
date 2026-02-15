import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error } from '@/lib/api/response';

// GET /api/v1/notifications - 获取通知列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    if (!userId) {
      return NextResponse.json(error('用户ID不能为空', 400));
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
  } catch (err) {
    console.error('获取通知列表失败:', err);
    return NextResponse.json(error('获取通知列表失败', 500));
  }
}

// PUT /api/v1/notifications/[id]/read - 标记通知为已读
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const notification = await prisma.notification.update({
      where: { id: params.id },
      data: { isRead: true },
    });

    return NextResponse.json(success(notification));
  } catch (err) {
    console.error('标记通知已读失败:', err);
    return NextResponse.json(error('标记通知已读失败', 500));
  }
}

// DELETE /api/v1/notifications/[id] - 删除通知
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.notification.delete({
      where: { id: params.id },
    });

    return NextResponse.json(success({ message: '通知已删除' }));
  } catch (err) {
    console.error('删除通知失败:', err);
    return NextResponse.json(error('删除通知失败', 500));
  }
}

// POST /api/v1/notifications - 创建通知
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, title, content, link, userId, projectId } = body;

    if (!type || !title || !content || !userId) {
      return NextResponse.json(error('缺少必填字段', 400));
    }

    const notification = await prisma.notification.create({
      data: {
        type,
        title,
        content,
        link: link || null,
        userId,
        projectId: projectId || null,
      },
    });

    return NextResponse.json(success(notification));
  } catch (err) {
    console.error('创建通知失败:', err);
    return NextResponse.json(error('创建通知失败', 500));
  }
}
