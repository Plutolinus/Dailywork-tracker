/**
 * API: 用户登录
 * POST /api/auth/login
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { login } from '@lib/auth';
import { ApiResponse, AuthResponse } from '@lib/types';
import { serialize } from '@lib/utils/cookie';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<AuthResponse>>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        error: '请提供用户名和密码' 
      });
    }

    const authResult = await login(username, password);

    // 设置 cookie
    const cookie = serialize('auth_token', authResult.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 天
    });

    res.setHeader('Set-Cookie', cookie);
    return res.status(200).json({ success: true, data: authResult });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(401).json({ 
      success: false, 
      error: error instanceof Error ? error.message : '登录失败' 
    });
  }
}

