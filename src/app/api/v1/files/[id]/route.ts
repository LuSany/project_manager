import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { error } from '@/lib/api/response';
import { createReadStream } from 'fs';

export async function GET(request: NextRequest, context: any) {
  const id = context.params.id;

  try {
    const file = await prisma.fileStorage.findUnique({
      where: { id },
    });

    if (!file) {
      return error('文件不存在_ERROR', '文件不存在', undefined, 404);
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
