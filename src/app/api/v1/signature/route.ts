import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { success, error } from '@/lib/api/response';
import { z } from 'zod';

// POST /api/v1/signature - 生成URL签名
const signUrlSchema = z.object({
  url: z.string().url(),
  expiresIn: z.number().positive().optional(), // 签名过期时间（秒）
});

export async function POST(request: NextRequest) {
  try {
    // 从中间件设置的 cookies 获取用户信息
    const userId = request.cookies.get('user-id')?.value;

    if (!userId) {
      return error('UNAUTHORIZED_ERROR', '未授权，请先登录', undefined, 401);
    }

    const body = await request.json();
    const validated = signUrlSchema.parse(body);

    // 获取并验证 URL 签名密钥
    const secret = process.env.URL_SIGN_SECRET;
    if (!secret || secret.length < 32) {
      return error('CONFIGURATION_ERROR', 'URL 签名密钥未配置或长度不足', undefined, 500);
    }

    const url = validated.url;

    // 简单签名实现：HMAC-SHA256(url + secret + expires)
    const expires = validated.expiresIn || 3600; // 默认1小时
    const timestamp = Math.floor(Date.now() / 1000) + expires;
    const signature = createHmac('sha256', secret)
      .update(`${url}|${timestamp}`)
      .digest('hex');

    const signedUrl = `${url}?signature=${signature}&expires=${timestamp}`;

    return NextResponse.json(success({
      signedUrl,
      expiresAt: timestamp * 1000,
    }));
  } catch (err) {
    if (err instanceof z.ZodError) {
      return error('参数验证失败_ERROR', '参数验证失败', { issues: err.issues }, 400);
    }
    console.error('生成URL签名失败:', err);
    return error('生成URL签名失败_ERROR', '生成URL签名失败', undefined, 500);
  }
}
