import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error } from '@/lib/api/response';

// GET /api/v1/files - 获取文件列表
export async function GET(request: NextRequest) {
  try {
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
    const requestedUserId = searchParams.get('userId');

    const where: any = {};
    // 只允许用户查看自己上传的文件
    where.uploadedBy = userId;

    const files = await prisma.fileStorage.findMany({
      where,
      include: {
        uploader: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(success(files));
  } catch (err) {
    console.error('获取文件列表失败:', err);
    return error('获取文件列表失败_ERROR', '获取文件列表失败', undefined, 500);
  }
}
