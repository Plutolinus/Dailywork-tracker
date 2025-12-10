/**
 * API: 会话管理
 * GET /api/sessions - 获取会话列表
 * POST /api/sessions - 创建新会话
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createSession, getSessions, getActiveSession } from '@lib/db-api';
import { getUserFromRequest } from '@lib/auth/get-user-from-request';
import { ApiResponse, WorkSession } from '@lib/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<WorkSession | WorkSession[]>>
) {
  try {
    const user = await getUserFromRequest(req);
    
    if (!user) {
      return res.status(401).json({ success: false, error: '请先登录' });
    }

    if (req.method === 'GET') {
      const { active } = req.query;
      
      if (active === 'true') {
        const session = await getActiveSession(user.id);
        return res.status(200).json({ success: true, data: session || undefined });
      }
      
      const limit = parseInt(req.query.limit as string) || 10;
      const sessions = await getSessions(limit, user.id);
      return res.status(200).json({ success: true, data: sessions });
    }

    if (req.method === 'POST') {
      const session = await createSession(user.id);
      return res.status(201).json({ success: true, data: session });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('Session API error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}

