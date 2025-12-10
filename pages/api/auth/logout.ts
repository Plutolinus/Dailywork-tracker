/**
 * API: 用户登出
 * POST /api/auth/logout
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { logout } from '@lib/auth';
import { ApiResponse } from '@lib/types';
import { serialize, parse } from '@lib/utils/cookie';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<null>>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const cookies = parse(req.headers.cookie || '');
    const token = cookies.auth_token;

    if (token) {
      await logout(token);
    }

    // 清除 cookie
    const cookie = serialize('auth_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0
    });

    res.setHeader('Set-Cookie', cookie);
    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : '登出失败' 
    });
  }
}

