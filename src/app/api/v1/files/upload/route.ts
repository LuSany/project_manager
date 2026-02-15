import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error } from '@/lib/api/response';
import { z } from 'zod';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

// POST /api/v1/files/upload - 上传文件
const uploadFileSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().positive().max(100 * 1024 * 1024), // 100MB限制
  mimeType: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = uploadFileSchema.parse(body);

    // 从中间件设置的 cookies 获取用户信息
    const userId = request.cookies.get('user-id')?.value;
    const userEmail = request.cookies.get('user-email')?.value;
    const userRole = request.cookies.get('user-role')?.value;

    if (!userId) {
      return error('未授权_ERROR', '未授权，请先登录', undefined, 401);
    }

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return error('用户不存在_ERROR', '用户不存在', undefined, 404);
    }

    // 生成唯一文件名
    const fileId = crypto.randomUUID();
    const extension = validated.fileName.split('.').pop();
    const fileName = `${fileId}.${extension}`;
    const uploadDir = join(process.cwd(), 'uploads');
    const filePath = join(uploadDir, fileName);

    // 确保uploads目录存在
    await mkdir(uploadDir, { recursive: true });

    // 这里应该处理实际的文件上传
    // 简化版本，假设文件内容在body中
    // 实际应该使用FormData处理文件上传

    const file = await prisma.fileStorage.create({
      data: {
        fileName,
        originalName: validated.fileName,
        filePath,
        fileSize: validated.fileSize,
        mimeType: validated.mimeType,
        uploadedBy: userId,
      },
    });

    return NextResponse.json(success(file));
  } catch (err) {
    if (err instanceof z.ZodError) {
      return error('VALIDATION_ERROR', '参数验证失败', { errors: err.errors }, 400);
    }
    console.error('上传文件失败:', err);
    return error('UPLOAD_FILE_FAILED', '上传文件失败', undefined, 500);
  }
}
