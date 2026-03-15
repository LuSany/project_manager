import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error } from '@/lib/api/response';
import { checkFileAccess } from '@/lib/file-permission';
import { isSupportedFileType } from '@/lib/preview/onlyoffice';

// GET /api/v1/files/preview - 获取文件预览URL
export async function GET(request: NextRequest) {
  // 从中间件设置的 cookies 获取用户信息
  const userId = request.cookies.get('user-id')?.value;

  if (!userId) {
    return error('UNAUTHORIZED_ERROR', '未授权，请先登录', undefined, 401);
  }

  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get('fileId');
  const service = searchParams.get('service') || 'auto'; // auto, onlyoffice, kkfileview, native

  if (!fileId) {
    return error('文件ID不能为空_ERROR', '文件ID不能为空', undefined, 400);
  }

  try {
    // 使用新的权限检查函数
    const accessCheck = await checkFileAccess(fileId, userId);

    if (!accessCheck.hasAccess) {
      return error('FORBIDDEN_ERROR', accessCheck.reason || '无权访问此文件', undefined, 403);
    }

    // 检查文件是否存在
    const file = await prisma.fileStorage.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return error('文件不存在_ERROR', '文件不存在', undefined, 404);
    }

    const isOfficeFile = isSupportedFileType(file.fileName);
    const mimeType = file.mimeType.toLowerCase();

    // 判断文件类型
    const isImage = mimeType.startsWith('image/');
    const isPdf = mimeType === 'application/pdf';
    const isText = mimeType.startsWith('text/');

    let previewUrl = '';
    let previewType = '';

    // 根据服务类型和文件类型生成预览URL
    if (service === 'auto') {
      // 自动选择最佳预览方式
      if (isImage || isPdf) {
        // 图片和PDF：浏览器原生预览
        previewUrl = `/api/v1/files/${fileId}`;
        previewType = 'native';
      } else if (isOfficeFile) {
        // Office文档：使用OnlyOffice预览
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        previewUrl = `${appUrl}/api/v1/files/${fileId}/preview-edit?mode=view`;
        previewType = 'onlyoffice';
      } else if (isText) {
        // 文本文件：浏览器原生预览
        previewUrl = `/api/v1/files/${fileId}`;
        previewType = 'native';
      } else {
        // 其他格式：尝试下载
        previewUrl = `/api/v1/files/${fileId}`;
        previewType = 'download';
      }
    } else {
      // 根据指定服务生成URL
      switch (service) {
        case 'onlyoffice':
          if (!isOfficeFile) {
            return error(
              'UNSUPPORTED_FILE_TYPE',
              '此文件类型不支持OnlyOffice预览',
              { fileType: file.mimeType },
              400
            );
          }
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          previewUrl = `${appUrl}/api/v1/files/${fileId}/preview-edit?mode=view`;
          previewType = 'onlyoffice';
          break;
        case 'kkfileview':
          // KKFileView预览服务
          const kkfileviewUrl = process.env.KKFILEVIEW_URL || 'http://localhost:8081';
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          previewUrl = `${kkfileviewUrl}/onlinePreview?url=${encodeURIComponent(`${baseUrl}/api/v1/files/${fileId}`)}`;
          previewType = 'kkfileview';
          break;
        case 'native':
        default:
          previewUrl = `/api/v1/files/${fileId}`;
          previewType = 'native';
          break;
      }
    }

    return success({
      previewUrl,
      previewType,
      fileName: file.fileName,
      fileType: file.mimeType,
      isOfficeFile,
      isImage,
      isPdf,
    });
  } catch (err) {
    console.error('获取文件预览URL失败:', err);
    return error('INTERNAL_ERROR', '获取文件预览URL失败', undefined, 500);
  }
}