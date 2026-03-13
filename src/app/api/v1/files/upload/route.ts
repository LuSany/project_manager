import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error } from '@/lib/api/response';
import { z } from 'zod';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// 允许的文件类型
const ALLOWED_MIME_TYPES = [
  // 文档
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // 图片
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  // 文本
  'text/plain',
  'text/csv',
];

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

// POST /api/v1/files/upload - 上传文件
const uploadFileSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().positive().max(MAX_FILE_SIZE),
  mimeType: z.string(),
});

// 从中间件获取用户信息
async function getAuthUser(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value;
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return error('未授权_ERROR', '未授权，请先登录', undefined, 401);
    }

    const contentType = request.headers.get('content-type') || '';

    // 处理 FormData (multipart/form-data) 格式
    if (contentType.includes('multipart/form-data')) {
      return await handleFormDataUpload(request, user.id);
    }

    // 处理 JSON 格式 (向后兼容)
    return await handleJsonUpload(request, user.id);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return error('VALIDATION_ERROR', '参数验证失败', { issues: err.issues }, 400);
    }
    console.error('上传文件失败:', err);
    return error('UPLOAD_FILE_FAILED', '上传文件失败', undefined, 500);
  }
}

// 处理 FormData 格式上传
async function handleFormDataUpload(request: NextRequest, userId: string) {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return error('VALIDATION_ERROR', '未提供文件', undefined, 400);
  }

  // 验证文件大小
  if (file.size > MAX_FILE_SIZE) {
    return error('VALIDATION_ERROR', `文件大小超过限制 (最大 ${MAX_FILE_SIZE / 1024 / 1024}MB)`, undefined, 400);
  }

  // 验证文件类型
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return error('VALIDATION_ERROR', `不支持的文件类型: ${file.type}`, undefined, 400);
  }

  // 生成唯一文件名
  const fileId = crypto.randomUUID();
  const extension = file.name.split('.').pop() || 'bin';
  const fileName = `${fileId}.${extension}`;
  const uploadDir = join(process.cwd(), 'uploads');
  const filePath = join(uploadDir, fileName);

  // 确保 uploads 目录存在
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  // 写入文件到磁盘
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  await writeFile(filePath, buffer);

  // 创建数据库记录
  const fileRecord = await prisma.fileStorage.create({
    data: {
      fileName,
      originalName: file.name,
      filePath,
      fileSize: file.size,
      mimeType: file.type,
      uploadedBy: userId,
    },
  });

  return NextResponse.json(success(fileRecord));
}

// 处理 JSON 格式上传 (向后兼容，仅记录元数据)
async function handleJsonUpload(request: NextRequest, userId: string) {
  const body = await request.json();
  const validated = uploadFileSchema.parse(body);

  // 生成唯一文件名
  const fileId = crypto.randomUUID();
  const extension = validated.fileName.split('.').pop();
  const fileName = `${fileId}.${extension}`;
  const uploadDir = join(process.cwd(), 'uploads');
  const filePath = join(uploadDir, fileName);

  // 确保 uploads 目录存在
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

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
}
