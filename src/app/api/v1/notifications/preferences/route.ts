import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error } from '@/lib/api/response';

// 默认偏好设置
const defaultPreferences = {
  emailEnabled: true,
  inAppEnabled: true,
  taskDue: true,
  taskAssigned: true,
  reviewInvite: true,
  riskAlert: true,
  commentMention: true,
  dailyDigest: false,
  weeklyDigest: false,
};

// GET /api/v1/notifications/preferences - 获取用户通知偏好设置
export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('user-id')?.value;

    if (!userId) {
      return error('UNAUTHORIZED_ERROR', '未授权，请先登录', undefined, 401);
    }

    const preferences = await prisma.notificationPreference.findMany({
      where: { userId },
    });

    // 将数据库记录转换为对象格式
    const result = { ...defaultPreferences };

    preferences.forEach((pref) => {
      const key = pref.type.toLowerCase().replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      if (key === 'email' || key === 'emailEnabled') {
        result.emailEnabled = pref.enabled;
      } else if (key === 'inApp' || key === 'inAppEnabled') {
        result.inAppEnabled = pref.enabled;
      } else if (key in result) {
        (result as Record<string, boolean>)[key] = pref.enabled;
      }
    });

    return NextResponse.json(success(result));
  } catch (err) {
    console.error('获取通知偏好失败:', err);
    return error('获取通知偏好失败_ERROR', '获取通知偏好失败', undefined, 500);
  }
}

// PUT /api/v1/notifications/preferences - 更新用户通知偏好设置
export async function PUT(request: NextRequest) {
  try {
    const userId = request.cookies.get('user-id')?.value;

    if (!userId) {
      return error('UNAUTHORIZED_ERROR', '未授权，请先登录', undefined, 401);
    }

    const body = await request.json();

    // 支持两种格式：对象格式或数组格式
    const preferences: Array<{ type: string; enabled: boolean; channel?: string }> = [];

    if (Array.isArray(body.preferences)) {
      preferences.push(...body.preferences);
    } else {
      // 对象格式转换为数组
      const mapping: Record<string, string> = {
        emailEnabled: 'EMAIL',
        inAppEnabled: 'IN_APP',
        taskDue: 'TASK_DUE_REMINDER',
        taskAssigned: 'TASK_ASSIGNED',
        reviewInvite: 'REVIEW_INVITE',
        riskAlert: 'RISK_ALERT',
        commentMention: 'COMMENT_MENTION',
        dailyDigest: 'DAILY_DIGEST',
        weeklyDigest: 'WEEKLY_DIGEST',
      };

      Object.entries(body).forEach(([key, value]) => {
        if (typeof value === 'boolean' && mapping[key]) {
          preferences.push({
            type: mapping[key],
            enabled: value,
            channel: key === 'emailEnabled' ? 'EMAIL' : 'IN_APP',
          });
        }
      });
    }

    if (preferences.length === 0) {
      return error('偏好设置格式错误_ERROR', '偏好设置格式错误', undefined, 400);
    }

    // 删除旧偏好设置
    await prisma.notificationPreference.deleteMany({
      where: { userId },
    });

    // 创建新偏好设置
    const newPreferences = await Promise.all(
      preferences.map((pref) =>
        prisma.notificationPreference.create({
          data: {
            userId,
            type: pref.type as any,
            enabled: pref.enabled !== false,
            channel: (pref.channel as any) || 'IN_APP',
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