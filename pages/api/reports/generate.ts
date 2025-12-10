/**
 * API: 生成工作报告
 * POST /api/reports/generate
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { generateReport } from '@lib/ai';
import { saveReport, getSession, getAnalysesBySession } from '@lib/db-api';
import { getUserFromRequest } from '@lib/auth/get-user-from-request';
import { ApiResponse, WorkReport } from '@lib/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<WorkReport>>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const user = await getUserFromRequest(req);
    
    if (!user) {
      return res.status(401).json({ success: false, error: '请先登录' });
    }

    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'Session ID is required' });
    }

    // 获取会话信息（验证属于当前用户）
    const session = await getSession(sessionId, user.id);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    // 计算会话时长
    const startTime = new Date(session.started_at).getTime();
    const endTime = session.ended_at 
      ? new Date(session.ended_at).getTime() 
      : Date.now();
    const durationMinutes = Math.round((endTime - startTime) / 60000);

    // 获取所有分析结果
    const analyses = await getAnalysesBySession(sessionId);

    if (analyses.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No analysis data available for this session' 
      });
    }

    // 生成报告
    const reportData = await generateReport(analyses, durationMinutes);
    
    // 保存报告（包含 user_id）
    const report = await saveReport({
      session_id: sessionId,
      ...reportData
    }, user.id);

    return res.status(201).json({ success: true, data: report });
  } catch (error) {
    console.error('Report generation error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}

