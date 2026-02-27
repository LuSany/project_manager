import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error } from '@/lib/api/response';
import { createNotification, shouldSendEmail, sendEmailNotification, NotificationType } from '@/lib/notification';

// GET /api/v1/notifications - 获取通知列表

// GET /api/v1/notifications - 获取通知列表
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
  const unreadOnly = searchParams.get('unreadOnly') === 'true';

  const where: any = { userId }; // 只查询当前用户的通知
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
    // 从中间件设置的 cookies 获取用户信息
    const userId = request.cookies.get('user-id')?.value;

    if (!userId) {
      return error('UNAUTHORIZED_ERROR', '未授权，请先登录', undefined, 401);
    }

    const body = await request.json();
    const { type, title, content, link, projectId, sendEmail } = body;

    if (!type || !title || !content) {
      return error('缺少必填字段_ERROR', '缺少必填字段', undefined, 400);
    }

    // 使用 createNotification 函数创建通知（包含邮件偏好逻辑）
    await createNotification({
      userId,
      type: type as NotificationType,
      title,
      content,
      link,
      projectId,
    });

    // 如果请求明确指定发送邮件（覆盖用户偏好）
    if (sendEmail === true) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });
      if (user?.email) {
        await sendEmailNotification(
          userId,
          type as NotificationType,
          title,
          content
        );
      }
    }

    return NextResponse.json(success({ message: '通知已创建' }));
  } catch (err) {
    console.error('创建通知失败:', err);
    return error('创建通知失败_ERROR', '创建通知失败', undefined, 500);
  }
}

// PUT /api/v1/notifications/[id]/read - 标记通知为已读
export async function PUT(request: NextRequest, context: any) {
  // 从中间件设置的 cookies 获取用户信息
  const userId = request.cookies.get('user-id')?.value;

  if (!userId) {
    return error('UNAUTHORIZED_ERROR', '未授权，请先登录', undefined, 401);
  }

  const id = context.params.id;

  try {
    // 先检查通知是否属于当前用户
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return error('NOTIFICATION_NOT_FOUND_ERROR', '通知不存在', undefined, 404);
    }

    if (notification.userId !== userId) {
      return error('FORBIDDEN_ERROR', '无权操作此通知', undefined, 403);
    }

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
  // 从中间件设置的 cookies 获取用户信息
  const userId = request.cookies.get('user-id')?.value;

  if (!userId) {
    return error('UNAUTHORIZED_ERROR', '未授权，请先登录', undefined, 401);
  }

  const id = context.params.id;

  try {
    // 先检查通知是否属于当前用户
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return error('NOTIFICATION_NOT_FOUND_ERROR', '通知不存在', undefined, 404);
    }

    if (notification.userId !== userId) {
      return error('FORBIDDEN_ERROR', '无权操作此通知', undefined, 403);
    }

    await prisma.notification.delete({
      where: { id },
    });

    return NextResponse.json(success({ message: '通知已删除' }));
  } catch (err) {
    console.error('删除通知失败:', err);
    return error('删除通知失败_ERROR', '删除通知失败', undefined, 500);
  }
}
