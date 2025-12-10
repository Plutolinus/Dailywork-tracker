/**
 * API: 获取当前用户
 * GET /api/auth/me
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { getCurrentUser } from '@lib/auth';
import { ApiResponse, User } from '@lib/types';
import { parse } from 'cookie';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<User>>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const cookies = parse(req.headers.cookie || '');
    const token = cookies.auth_token;

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: '未登录' 
      });
    }

    const user = await getCurrentUser(token);

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: '会话已过期，请重新登录' 
      });
    }

    return res.status(200).json({ success: true, data: user });

  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : '获取用户信息失败' 
    });
  }
}

