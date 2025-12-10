/**
 * API: 获取截图列表
 * GET /api/screenshots?sessionId=xxx
 * GET /api/screenshots?recent=true&limit=20
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { getScreenshots, getRecentScreenshots } from '@lib/db-api';
import { getUserFromRequest } from '@lib/auth/get-user-from-request';
import { ApiResponse, Screenshot } from '@lib/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<Screenshot[]>>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const user = await getUserFromRequest(req);
    
    if (!user) {
      return res.status(401).json({ success: false, error: '请先登录' });
    }

    const { sessionId, recent, limit } = req.query;

    if (recent === 'true') {
      const screenshots = await getRecentScreenshots(parseInt(limit as string) || 20, user.id);
      return res.status(200).json({ success: true, data: screenshots });
    }

    if (sessionId && typeof sessionId === 'string') {
      const screenshots = await getScreenshots(sessionId);
      return res.status(200).json({ success: true, data: screenshots });
    }

    return res.status(400).json({ success: false, error: 'Session ID or recent flag is required' });
  } catch (error) {
    console.error('Screenshots API error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}

