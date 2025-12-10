/**
 * API: 获取报告列表
 * GET /api/reports
 * GET /api/reports?sessionId=xxx
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { getReports, getReportBySession } from '@lib/db-api';
import { getUserFromRequest } from '@lib/auth/get-user-from-request';
import { ApiResponse, WorkReport } from '@lib/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<WorkReport | WorkReport[]>>
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

    const { sessionId, limit } = req.query;

    if (sessionId && typeof sessionId === 'string') {
      const report = await getReportBySession(sessionId, user.id);
      return res.status(200).json({ success: true, data: report || undefined });
    }

    const reports = await getReports(parseInt(limit as string) || 10, user.id);
    return res.status(200).json({ success: true, data: reports });
  } catch (error) {
    console.error('Reports API error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}

