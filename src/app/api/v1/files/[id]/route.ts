import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { error } from '@/lib/api/response';
import { createReadStream } from 'fs';
import { checkFileAccess } from '@/lib/file-permission';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = request.cookies.get('user-id')?.value;

  if (!userId) {
    return error('UNAUTHORIZED_ERROR', '未授权，请先登录', undefined, 401);
  }

  const { id: fileId } = await params;

  try {
    // 使用新的权限检查函数
    const accessCheck = await checkFileAccess(fileId, userId);

    if (!accessCheck.hasAccess) {
      return error('FORBIDDEN_ERROR', accessCheck.reason || '无权访问此文件', undefined, 403);
    }

    const file = await prisma.fileStorage.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return error('文件不存在_ERROR', '文件不存在', undefined, 404);
    }

    const filePath = file.filePath;

    // 检查文件是否存在
    try {
      const stream = createReadStream(filePath);

      return new Response(stream as any, {
        headers: {
          'Content-Type': file.mimeType,
          'Content-Disposition': `inline; filename="${file.fileName}"`,
        },
      });
    } catch (fsError: any) {
      console.error('文件读取失败:', fsError);
      if (fsError.code === 'ENOENT') {
        return error('FILE_NOT_FOUND_ERROR', '文件物理路径不存在', undefined, 404);
      }
      throw fsError;
    }
  } catch (err) {
    console.error('下载文件失败:', err);
    return error('INTERNAL_ERROR', '下载文件失败', undefined, 500);
  }
}
