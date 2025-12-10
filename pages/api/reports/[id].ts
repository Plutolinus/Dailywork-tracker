/**
 * API: 获取单个报告
 * GET /api/reports/[id]
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { getReport } from '@lib/db-api';
import { getUserFromRequest } from '@lib/auth/get-user-from-request';
import { ApiResponse, WorkReport } from '@lib/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<WorkReport>>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ success: false, error: 'Invalid report ID' });
  }

  try {
    const user = await getUserFromRequest(req);
    
    if (!user) {
      return res.status(401).json({ success: false, error: '请先登录' });
    }

    const report = await getReport(id, user.id);
    
    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    return res.status(200).json({ success: true, data: report });
  } catch (error) {
    console.error('Report API error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}

