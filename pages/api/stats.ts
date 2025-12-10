/**
 * API: 获取仪表盘统计数据
 * GET /api/stats
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { getDashboardStats } from '@lib/db-api';
import { getUserFromRequest } from '@lib/auth/get-user-from-request';
import { ApiResponse, DashboardStats } from '@lib/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<DashboardStats>>
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

    const stats = await getDashboardStats(user.id);
    return res.status(200).json({ success: true, data: stats });
  } catch (error) {
    console.error('Stats API error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}

