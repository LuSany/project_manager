import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error } from '@/lib/api/response';

// GET /api/v1/notifications/preferences - 获取用户通知偏好设置
export async function GET(request: NextRequest) {
  try {
    // 从中间件设置的 cookies 获取用户信息
    const userId = request.cookies.get('user-id')?.value;

    if (!userId) {
      return error('UNAUTHORIZED_ERROR', '未授权，请先登录', undefined, 401);
    }

    const preferences = await prisma.notificationPreference.findMany({
      where: { userId }, // 只查询当前用户的偏好
    });

    return NextResponse.json(success(preferences));
  } catch (err) {
    console.error('获取通知偏好失败:', err);
    return error('获取通知偏好失败_ERROR', '获取通知偏好失败', undefined, 500);
  }
}

// PUT /api/v1/notifications/preferences - 更新用户通知偏好设置
export async function PUT(request: NextRequest) {
  try {
    // 从中间件设置的 cookies 获取用户信息
    const userId = request.cookies.get('user-id')?.value;

    if (!userId) {
      return error('UNAUTHORIZED_ERROR', '未授权，请先登录', undefined, 401);
    }

    const body = await request.json();
    const { preferences } = body;

    if (!preferences || !Array.isArray(preferences)) {
      return error('偏好设置格式错误_ERROR', '偏好设置格式错误', undefined, 400);
    }

    // 删除旧偏好设置
    await prisma.notificationPreference.deleteMany({
      where: { userId },
    });

    // 创建新偏好设置
    const newPreferences = await Promise.all(
      preferences.map((pref: any) =>
        prisma.notificationPreference.create({
          data: {
            userId, // 使用当前认证用户的ID
            type: pref.type,
            enabled: pref.enabled !== false,
            channel: pref.channel || 'IN_APP',
          },
        })
      )
    );

    return NextResponse.json(success(newPreferences));
  } catch (err) {
    console.error('更新通知偏好失败:', err);
    return error('更新通知偏好失败_ERROR', '更新通知偏好失败', undefined, 500);
  }
}
