import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error, unauthorized, forbidden, notFound } from '@/lib/api/response';
import {
  generateOnlyOfficeUrl,
  generateDocumentKey,
  getFileType,
  isSupportedFileType,
  isOnlyOfficeAvailable,
  generateMockOnlyOfficeResponse,
  buildDocumentConfig,
} from '@/lib/preview/onlyoffice';
import { checkFilePreviewAccess } from '@/lib/file-permission';

// GET /api/v1/files/:id/preview-edit - 获取OnlyOffice编辑URL
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = request.cookies.get('user-id')?.value;

  if (!userId) {
    return unauthorized('未授权，请先登录');
  }

  const { id: fileId } = await params;
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode') === 'view' ? 'view' : 'edit';

  try {
    // 使用新的权限检查函数
    const accessCheck = await checkFilePreviewAccess(fileId, userId);

    if (!accessCheck.hasAccess) {
      return forbidden(accessCheck.reason || '无权访问此文件');
    }

    // 获取文件信息
    const file = await prisma.fileStorage.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return notFound('文件不存在');
    }

    // 检查文件类型是否支持
    if (!isSupportedFileType(file.fileName)) {
      return error(
        'UNSUPPORTED_FILE_TYPE',
        '此文件类型不支持OnlyOffice预览/编辑',
        { fileType: file.mimeType },
        400
      );
    }

    // 检查OnlyOffice服务是否可用
    const mockMode = process.env.ONLYOFFICE_MOCK_MODE === 'true';
    if (!isOnlyOfficeAvailable()) {
      return error(
        'SERVICE_UNAVAILABLE',
        'OnlyOffice服务未配置或不可用',
        undefined,
        503
      );
    }

    // 生成文档键
    const documentKey = generateDocumentKey(file.id, 1);

    // 构建预签名文件URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const fileUrl = `${appUrl}/api/v1/files/${file.id}`;

    // 获取文件类型
    const fileType = getFileType(file.fileName);

    const config = {
      apiUrl: process.env.ONLYOFFICE_API_URL || process.env.NEXT_PUBLIC_ONLYOFFICE_API_URL || '',
      apiKey: process.env.ONLYOFFICE_API_KEY || '',
      documentKey,
      fileUrl,
      fileType,
      mode: mode as 'edit' | 'view',
      user: {
        id: accessCheck.user!.id,
        name: accessCheck.user!.name,
      },
    };

    // Mock模式返回模拟数据
    if (mockMode) {
      const mockResponse = generateMockOnlyOfficeResponse(config);
      return success({
        ...mockResponse,
        mockMode: true,
        fileName: file.fileName,
        fileType: file.mimeType,
      });
    }

    // 生成OnlyOffice编辑器URL
    const editorUrl = generateOnlyOfficeUrl(config);
    const docConfig = buildDocumentConfig(config);

    return success({
      url: editorUrl,
      config: docConfig,
      fileName: file.fileName,
      fileType: file.mimeType,
      documentKey,
    });
  } catch (err) {
    console.error('获取OnlyOffice编辑URL失败:', err);
    return error(
      'INTERNAL_ERROR',
      '获取OnlyOffice编辑URL失败',
      undefined,
      500
    );
  }
}
