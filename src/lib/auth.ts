import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { error } from './api/response';

/**
 * 从请求中获取已认证的用户信息
 * @param request NextRequest 对象
 * @returns 用户对象或 null（如果未认证）
 */
export async function getAuthenticatedUser(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value;

  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  return user;
}

/**
 * 验证请求是否已认证
 * @param request NextRequest 对象
 * @returns 用户对象，如果未认证则返回错误响应
 */
export async function requireAuth(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value;

  if (!userId) {
    return error('UNAUTHORIZED_ERROR', '未授权，请先登录', undefined, 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return error('USER_NOT_FOUND_ERROR', '用户不存在', undefined, 404);
  }

  return user;
}
