import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error } from '@/lib/api/response';

export async function GET(request: NextRequest, context: any) {
  const reviewId = context.params.reviewId;

  try {
    const materials = await prisma.reviewMaterial.findMany({
      where: { reviewId },
      orderBy: { uploadedAt: 'asc' },
    });

    return NextResponse.json(success(materials));
  } catch (err) {
    console.error('获取评审材料列表失败:', err);
    return error('获取评审材料列表失败_ERROR', '获取评审材料列表失败', undefined, 500);
  }
}

// POST /api/v1/reviews/[id]/materials - 上传评审材料
export async function POST(request: NextRequest, context: any) {
  const reviewId = context.params.reviewId;

  try {
    const body = await request.json();
    const { fileName } = body;

    if (!fileName) {
      return error('文件名不能为空_ERROR', '文件名不能为空', undefined, 400);
    }

    const fileId = crypto.randomUUID();
    const material = await prisma.reviewMaterial.create({
      data: {
        review: { connect: { id: reviewId } },
        fileId,
        fileName,
        fileType: 'UNKNOWN',
        fileSize: 0,
        uploadedAt: new Date(),
      },
    });

    return NextResponse.json(success(material));
  } catch (err) {
    console.error('上传评审材料失败:', err);
    return error('上传评审材料失败_ERROR', '上传评审材料失败', undefined, 500);
  }
}
