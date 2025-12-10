/**
 * API: 上传截图
 * POST /api/screenshots/upload
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createHash } from 'crypto';
import { saveScreenshot, uploadScreenshot, getRecentScreenshots, saveAnalysis } from '@lib/db-api';
import { analyzeScreenshot } from '@lib/ai';
import { getUserFromRequest } from '@lib/auth/get-user-from-request';
import { ApiResponse, Screenshot } from '@lib/types';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};

// 计算图片的 hash 值
function calculateImageHash(base64: string): string {
  return createHash('md5').update(base64).digest('hex');
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<Screenshot & { skipped?: boolean }>>
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

    const { sessionId, imageBase64, filePath } = req.body;

    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'Session ID is required' });
    }

    if (!imageBase64 && !filePath) {
      return res.status(400).json({ success: false, error: 'Image data or file path is required' });
    }

    let fileUrl: string | undefined;
    let localPath = filePath || '';
    let skipAnalysis = false;

    // 如果有 base64 数据
    if (imageBase64) {
      // 计算当前图片的 hash
      const currentHash = calculateImageHash(imageBase64);
      
      // 获取最近一张截图，检查是否相同
      const recentScreenshots = await getRecentScreenshots(1, user.id);
      if (recentScreenshots.length > 0) {
        const previousHash = recentScreenshots[0].image_hash;
        
        if (previousHash && previousHash === currentHash) {
          // 图片相同，跳过分析
          skipAnalysis = true;
          console.log('Screenshot unchanged, skipping AI analysis');
        }
      }

      // 上传到 Supabase Storage
      const buffer = Buffer.from(imageBase64, 'base64');
      const fileName = `${user.id}/${sessionId}/${Date.now()}.png`;
      fileUrl = await uploadScreenshot(buffer, fileName);
      localPath = fileName;

      // 保存截图记录（包含 hash）
      const screenshot = await saveScreenshot(sessionId, localPath, fileUrl, user.id, currentHash);

      if (skipAnalysis) {
        // 屏幕无变化，保存暂停状态
        await saveAnalysis(screenshot.id, {
          app_name: '屏幕无变化',
          activity_type: 'other',
          description: '暂停 - 屏幕内容与上一张相同',
          detailed_content: '',
          tags: [],
          confidence: 1
        });
        console.log('Screenshot unchanged, marked as paused');
        return res.status(201).json({ 
          success: true, 
          data: { ...screenshot, skipped: true } 
        });
      }

      // 执行 AI 分析
      try {
        const analysis = await analyzeScreenshot(imageBase64);
        await saveAnalysis(screenshot.id, analysis);
        console.log('Analysis saved:', analysis.app_name, analysis.description);
      } catch (analysisError) {
        console.error('Analysis failed:', analysisError);
      }

      return res.status(201).json({ success: true, data: screenshot });
    }

    // 没有 base64 数据的情况
    const screenshot = await saveScreenshot(sessionId, localPath, fileUrl, user.id);
    return res.status(201).json({ success: true, data: screenshot });
    
  } catch (error) {
    console.error('Screenshot upload error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}

