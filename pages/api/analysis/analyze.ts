/**
 * API: AI 分析截图
 * POST /api/analysis/analyze
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { analyzeScreenshot } from '@lib/ai';
import { saveAnalysis, getScreenshot } from '@lib/db-api';
import { ApiResponse, ScreenshotAnalysis } from '@lib/types';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<ScreenshotAnalysis>>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { screenshotId, imageBase64 } = req.body;

    if (!screenshotId || !imageBase64) {
      return res.status(400).json({ 
        success: false, 
        error: 'Screenshot ID and image data are required' 
      });
    }

    // 验证截图存在
    const screenshot = await getScreenshot(screenshotId);
    if (!screenshot) {
      return res.status(404).json({ success: false, error: 'Screenshot not found' });
    }

    // 分析截图
    const analysisResult = await analyzeScreenshot(imageBase64);
    
    // 保存分析结果
    const analysis = await saveAnalysis(screenshotId, analysisResult);

    return res.status(200).json({ success: true, data: analysis });
  } catch (error) {
    console.error('Analysis API error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}

