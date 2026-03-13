import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error } from '@/lib/api/response';

// GET /api/v1/files/preview - 获取文件预览URL
export async function GET(request: NextRequest) {
  // 从中间件设置的 cookies 获取用户信息
  const userId = request.cookies.get('user-id')?.value;

  if (!userId) {
    return error('UNAUTHORIZED_ERROR', '未授权，请先登录', undefined, 401);
  }

  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get('fileId');
  const service = searchParams.get('service') || 'native'; // native, onlyoffice, kkfileview

  if (!fileId) {
    return error('文件ID不能为空_ERROR', '文件ID不能为空', undefined, 400);
  }

  // 检查文件是否存在
  const file = await prisma.fileStorage.findUnique({
    where: { id: fileId },
  });

  if (!file) {
    return error('文件不存在_ERROR', '文件不存在', undefined, 404);
  }

  // 验证文件所有权：只能预览自己上传的文件
  if (file.uploadedBy !== userId) {
    return error('FORBIDDEN_ERROR', '无权访问此文件', undefined, 403);
  }

  let previewUrl = '';

  // 根据服务类型生成预览URL
  switch (service) {
    case 'onlyoffice':
      // OnlyOffice预览服务
      previewUrl = `http://localhost:8080/preview?file=${encodeURIComponent(file.filePath)}`;
      break;
    case 'kkfileview':
      // KKFileView预览服务
      previewUrl = `http://localhost:8081/preview?file=${encodeURIComponent(file.filePath)}`;
      break;
    case 'native':
    default:
      // 原生预览（图片、PDF等）
      previewUrl = `/api/v1/files/${fileId}/download`;
      break;
  }

  return success({
    previewUrl,
    fileName: file.fileName,
    fileType: file.mimeType,
  });
}
