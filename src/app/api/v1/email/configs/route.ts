import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error } from '@/lib/api/response';

// GET /api/v1/email/configs - 获取邮件配置列表
export async function GET(request: NextRequest) {
  try {
    const configs = await prisma.emailConfig.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(success(configs));
  } catch (err) {
    console.error('获取邮件配置失败:', err);
    return NextResponse.json(error('获取邮件配置失败', 500));
  }
}

// POST /api/v1/email/configs - 创建邮件配置
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, host, port, secure, from } = body;

    if (!name || !host) {
      return NextResponse.json(error('名称和主机不能为空', 400));
    }

    const config = await prisma.emailConfig.create({
      data: {
        name,
        host,
        port: port || 587,
        secure: secure || false,
        from: from || 'noreply@example.com',
      },
    });

    return NextResponse.json(success(config));
  } catch (err) {
    console.error('创建邮件配置失败:', err);
    return NextResponse.json(error('创建邮件配置失败', 500));
  }
}
