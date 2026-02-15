import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error } from '@/lib/api/response';
import { createReadStream } from 'fs';
import { join } from 'path';

// GET /api/v1/files/[id] - 下载文件
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const file = await prisma.fileStorage.findUnique({
      where: { id: params.id },
    });

    if (!file) {
      return NextResponse.json(error('文件不存在', 404));
    }

    // 检查文件是否存在
    const filePath = join(process.cwd(), file.filePath);

    // 返回文件流
    const stream = createReadStream(filePath);

    return new Response(stream as any, {
      headers: {
        'Content-Type': file.mimeType,
        'Content-Disposition': `attachment; filename="${file.fileName}"`,
      },
    });
  } catch (err) {
    console.error('下载文件失败:', err);
    return NextResponse.json(error('下载文件失败', 500));
  }
}
