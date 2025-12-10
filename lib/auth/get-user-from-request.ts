/**
 * 从请求中获取当前用户
 */

import { NextApiRequest } from 'next';
import { getCurrentUser } from './index';
import { User } from '@lib/types';

/**
 * 简单解析 cookie 字符串
 */
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  
  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.split('=');
    if (name) {
      const value = rest.join('=');
      cookies[name.trim()] = decodeURIComponent(value.trim());
    }
  });
  
  return cookies;
}

export async function getUserFromRequest(req: NextApiRequest): Promise<User | null> {
  try {
    const cookies = parseCookies(req.headers.cookie || '');
    const token = cookies.auth_token;

    if (!token) {
      return null;
    }

    return await getCurrentUser(token);
  } catch (error) {
    console.error('Error getting user from request:', error);
    return null;
  }
}

/**
 * 验证用户是否已登录，如果未登录则抛出错误
 */
export async function requireAuth(req: NextApiRequest): Promise<User> {
  const user = await getUserFromRequest(req);
  
  if (!user) {
    throw new Error('未登录');
  }

  return user;
}

