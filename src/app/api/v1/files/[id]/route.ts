import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { error } from '@/lib/api/response';
import { createReadStream } from 'fs';

export async function GET(request: NextRequest, context: any) {
  // 从中间件设置的 cookies 获取用户信息
  const userId = request.cookies.get('user-id')?.value;

  if (!userId) {
    return error('UNAUTHORIZED_ERROR', '未授权，请先登录', undefined, 401);
  }

  const id = context.params.id;

  try {
    const file = await prisma.fileStorage.findUnique({
      where: { id },
    });

    if (!file) {
      return error('文件不存在_ERROR', '文件不存在', undefined, 404);
    }

    // 验证文件所有权：只能下载自己上传的文件
    if (file.uploadedBy !== userId) {
      return error('FORBIDDEN_ERROR', '无权访问此文件', undefined, 403);
    }

    const filePath = file.filePath;
    const stream = createReadStream(filePath);

    return new Response(stream as any, {
      headers: {
        'Content-Type': file.mimeType,
        'Content-Disposition': `attachment; filename="${file.fileName}"`,
      },
    });
  } catch (err) {
    console.error('下载文件失败:', err);
    return error('下载文件失败_ERROR', '下载文件失败', undefined, 500);
  }
}
