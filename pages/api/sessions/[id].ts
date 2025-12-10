/**
 * API: 单个会话操作
 * GET /api/sessions/[id] - 获取会话详情
 * PATCH /api/sessions/[id] - 更新会话状态
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { getSession, updateSessionStatus } from '@lib/db-api';
import { getUserFromRequest } from '@lib/auth/get-user-from-request';
import { ApiResponse, WorkSession } from '@lib/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<WorkSession>>
) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ success: false, error: 'Invalid session ID' });
  }

  try {
    const user = await getUserFromRequest(req);
    
    if (!user) {
      return res.status(401).json({ success: false, error: '请先登录' });
    }

    if (req.method === 'GET') {
      const session = await getSession(id, user.id);
      if (!session) {
        return res.status(404).json({ success: false, error: 'Session not found' });
      }
      return res.status(200).json({ success: true, data: session });
    }

    if (req.method === 'PATCH') {
      // 先验证会话属于当前用户
      const session = await getSession(id, user.id);
      if (!session) {
        return res.status(404).json({ success: false, error: 'Session not found' });
      }

      const { status } = req.body;
      
      if (!['active', 'paused', 'completed'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Invalid status' });
      }

      const updatedSession = await updateSessionStatus(id, status);
      return res.status(200).json({ success: true, data: updatedSession });
    }

    res.setHeader('Allow', ['GET', 'PATCH']);
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('Session API error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}

