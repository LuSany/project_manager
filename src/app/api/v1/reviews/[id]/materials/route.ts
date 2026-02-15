import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error } from '@/lib/api/response';
import { z } from 'zod';

// POST /api/v1/reviews/[id]/materials - 上传评审材料
const createMaterialSchema = z.object({
  fileId: z.string().cuid(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validated = createMaterialSchema.parse(body);

    // 检查评审是否存在
    const review = await prisma.review.findUnique({
      where: { id: params.id },
    });
    if (!review) {
      return NextResponse.json(error('评审不存在', 404));
    }

    // 检查文件是否存在
    const file = await prisma.fileStorage.findUnique({
      where: { id: validated.fileId },
    });
    if (!file) {
      return NextResponse.json(error('文件不存在', 404));
    }

    const material = await prisma.reviewMaterial.create({
      data: {
        reviewId: params.id,
        fileId: validated.fileId,
        fileName: file.fileName,
        fileType: file.mimeType,
        fileSize: file.fileSize,
      },
      include: {
        file: true,
      },
    });

    return NextResponse.json(success(material));
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(error('参数验证失败', 400, err.errors));
    }
    console.error('上传评审材料失败:', err);
    return NextResponse.json(error('上传评审材料失败', 500));
  }
}
