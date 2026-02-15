import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error } from '@/lib/api/response';

// GET /api/v1/notifications/preferences - 获取用户通知偏好设置
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(error('用户ID不能为空', 400));
    }

    const preferences = await prisma.notificationPreference.findMany({
      where: { userId },
    });

    return NextResponse.json(success(preferences));
  } catch (err) {
    console.error('获取通知偏好失败:', err);
    return NextResponse.json(error('获取通知偏好失败', 500));
  }
}

// PUT /api/v1/notifications/preferences - 更新用户通知偏好设置
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, preferences } = body;

    if (!userId) {
      return NextResponse.json(error('用户ID不能为空', 400));
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
            userId,
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
    return NextResponse.json(error('更新通知偏好失败', 500));
  }
}
