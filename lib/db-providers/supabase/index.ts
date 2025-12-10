/**
 * AI Work Tracker - Supabase Database Provider
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  WorkSession,
  Screenshot,
  ScreenshotAnalysis,
  WorkReport,
  DashboardStats,
  TimelineItem,
  ActivityType
} from '@lib/types';

let supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_SECRET || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!url || !key) {
      throw new Error('Supabase credentials not configured');
    }
    
    supabase = createClient(url, key);
  }
  return supabase;
}

// ==================== 会话管理 ====================

export async function createSession(userId?: string): Promise<WorkSession> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('work_sessions')
    .insert({
      status: 'active',
      started_at: new Date().toISOString(),
      total_screenshots: 0,
      user_id: userId || null
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getActiveSession(userId?: string): Promise<WorkSession | null> {
  const client = getSupabaseClient();
  let query = client
    .from('work_sessions')
    .select('*')
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(1);

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data } = await query.single();
  return data;
}

export async function updateSessionStatus(
  id: string,
  status: WorkSession['status']
): Promise<WorkSession> {
  const client = getSupabaseClient();
  const updates: Partial<WorkSession> = { status };
  
  if (status === 'completed') {
    updates.ended_at = new Date().toISOString();
  }

  const { data, error } = await client
    .from('work_sessions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getSession(id: string, userId?: string): Promise<WorkSession | null> {
  const client = getSupabaseClient();
  let query = client
    .from('work_sessions')
    .select('*')
    .eq('id', id);

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data } = await query.single();
  return data;
}

export async function getSessions(limit = 10, userId?: string): Promise<WorkSession[]> {
  const client = getSupabaseClient();
  let query = client
    .from('work_sessions')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(limit);

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data } = await query;
  return data || [];
}

// ==================== 截图管理 ====================

export async function saveScreenshot(
  sessionId: string,
  filePath: string,
  fileUrl?: string,
  userId?: string,
  imageHash?: string
): Promise<Screenshot> {
  const client = getSupabaseClient();
  
  const { data, error } = await client
    .from('screenshots')
    .insert({
      session_id: sessionId,
      file_path: filePath,
      file_url: fileUrl,
      image_hash: imageHash || null,
      captured_at: new Date().toISOString(),
      user_id: userId || null
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // 更新会话截图计数
  await client.rpc('increment_screenshot_count', { session_id: sessionId });

  return data;
}

export async function getScreenshots(sessionId: string): Promise<Screenshot[]> {
  const client = getSupabaseClient();
  const { data } = await client
    .from('screenshots')
    .select(`
      *,
      analysis:screenshot_analyses(*)
    `)
    .eq('session_id', sessionId)
    .order('captured_at', { ascending: true });

  return data || [];
}

export async function getScreenshot(id: string): Promise<Screenshot | null> {
  const client = getSupabaseClient();
  const { data } = await client
    .from('screenshots')
    .select(`
      *,
      analysis:screenshot_analyses(*)
    `)
    .eq('id', id)
    .single();

  return data;
}

export async function getRecentScreenshots(limit = 20, userId?: string): Promise<Screenshot[]> {
  const client = getSupabaseClient();
  let query = client
    .from('screenshots')
    .select(`
      *,
      analysis:screenshot_analyses(*)
    `)
    .order('captured_at', { ascending: false })
    .limit(limit);

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data } = await query;
  return data || [];
}

// ==================== AI 分析管理 ====================

export async function saveAnalysis(
  screenshotId: string,
  analysis: Omit<ScreenshotAnalysis, 'id' | 'screenshot_id' | 'created_at'>
): Promise<ScreenshotAnalysis> {
  const client = getSupabaseClient();
  
  const insertData = {
    screenshot_id: screenshotId,
    app_name: analysis.app_name,
    activity_type: analysis.activity_type,
    description: analysis.description,
    detailed_content: analysis.detailed_content || '',
    tags: analysis.tags || [],
    confidence: analysis.confidence,
    raw_response: analysis.raw_response
  };
  
  const { data, error } = await client
    .from('screenshot_analyses')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Save analysis error:', error);
    throw new Error(error.message);
  }
  return data;
}

export async function getAnalysesBySession(sessionId: string): Promise<ScreenshotAnalysis[]> {
  const client = getSupabaseClient();
  const { data } = await client
    .from('screenshot_analyses')
    .select(`
      *,
      screenshot:screenshots!inner(session_id)
    `)
    .eq('screenshot.session_id', sessionId)
    .order('created_at', { ascending: true });

  return data || [];
}

// 复制分析结果到新截图（用于相同图片跳过分析时）
export async function copyAnalysisFromScreenshot(
  sourceScreenshotId: string,
  targetScreenshotId: string
): Promise<void> {
  const client = getSupabaseClient();
  
  // 获取源截图的分析
  const { data: sourceAnalysis } = await client
    .from('screenshot_analyses')
    .select('*')
    .eq('screenshot_id', sourceScreenshotId)
    .single();
  
  if (!sourceAnalysis) return;
  
  // 复制到新截图
  await client
    .from('screenshot_analyses')
    .insert({
      screenshot_id: targetScreenshotId,
      app_name: sourceAnalysis.app_name,
      activity_type: sourceAnalysis.activity_type,
      description: sourceAnalysis.description,
      detailed_content: sourceAnalysis.detailed_content,
      tags: sourceAnalysis.tags,
      confidence: sourceAnalysis.confidence,
      raw_response: '[复制自上一张相同截图]'
    });
}

// ==================== 报告管理 ====================

export async function saveReport(
  report: Omit<WorkReport, 'id' | 'created_at'>,
  userId?: string
): Promise<WorkReport> {
  const client = getSupabaseClient();
  
  const { data, error } = await client
    .from('work_reports')
    .insert({
      ...report,
      user_id: userId || null
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getReport(id: string, userId?: string): Promise<WorkReport | null> {
  const client = getSupabaseClient();
  let query = client
    .from('work_reports')
    .select('*')
    .eq('id', id);

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data } = await query.single();
  return data;
}

export async function getReportBySession(sessionId: string, userId?: string): Promise<WorkReport | null> {
  const client = getSupabaseClient();
  let query = client
    .from('work_reports')
    .select('*')
    .eq('session_id', sessionId)
    .order('generated_at', { ascending: false })
    .limit(1);

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data } = await query.single();
  return data;
}

export async function getReports(limit = 10, userId?: string): Promise<WorkReport[]> {
  const client = getSupabaseClient();
  let query = client
    .from('work_reports')
    .select('*')
    .order('generated_at', { ascending: false })
    .limit(limit);

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data } = await query;
  return data || [];
}

// ==================== 统计查询 ====================

export async function getDashboardStats(userId?: string): Promise<DashboardStats> {
  const client = getSupabaseClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 获取今日活跃会话
  const activeSession = await getActiveSession(userId);

  // 获取今日截图数
  let screenshotQuery = client
    .from('screenshots')
    .select('*', { count: 'exact', head: true })
    .gte('captured_at', today.toISOString());

  if (userId) {
    screenshotQuery = screenshotQuery.eq('user_id', userId);
  }

  const { count: todayScreenshots } = await screenshotQuery;

  // 获取今日工作时长（分钟）
  let sessionQuery = client
    .from('work_sessions')
    .select('started_at, ended_at')
    .gte('started_at', today.toISOString());

  if (userId) {
    sessionQuery = sessionQuery.eq('user_id', userId);
  }

  const { data: todaySessions } = await sessionQuery;

  let todayDurationMinutes = 0;
  if (todaySessions) {
    for (const session of todaySessions) {
      const start = new Date(session.started_at);
      const end = session.ended_at ? new Date(session.ended_at) : new Date();
      todayDurationMinutes += (end.getTime() - start.getTime()) / 60000;
    }
  }

  // 获取最新活动
  const latestScreenshots = await getRecentScreenshots(1, userId);
  const currentActivity = latestScreenshots[0]?.analysis?.description;

  return {
    today_duration_minutes: Math.round(todayDurationMinutes),
    today_screenshots: todayScreenshots || 0,
    today_productivity_score: 0, // 需要从报告计算
    current_activity: currentActivity,
    active_session: activeSession || undefined
  };
}

export async function getTimeline(sessionId: string): Promise<TimelineItem[]> {
  const screenshots = await getScreenshots(sessionId);
  
  // 按小时分组
  const groups = new Map<string, Screenshot[]>();
  
  for (const screenshot of screenshots) {
    const date = new Date(screenshot.captured_at);
    const hourKey = `${date.getHours().toString().padStart(2, '0')}:00`;
    
    if (!groups.has(hourKey)) {
      groups.set(hourKey, []);
    }
    groups.get(hourKey)!.push(screenshot);
  }

  const timeline: TimelineItem[] = [];
  
  for (const [time, items] of groups) {
    // 统计主要活动类型
    const activityCounts = new Map<ActivityType, number>();
    const appCounts = new Map<string, number>();
    
    for (const item of items) {
      if (item.analysis) {
        const activity = item.analysis.activity_type as ActivityType;
        activityCounts.set(activity, (activityCounts.get(activity) || 0) + 1);
        appCounts.set(item.analysis.app_name, (appCounts.get(item.analysis.app_name) || 0) + 1);
      }
    }

    let dominantActivity: ActivityType = 'other';
    let maxCount = 0;
    for (const [activity, count] of activityCounts) {
      if (count > maxCount) {
        maxCount = count;
        dominantActivity = activity;
      }
    }

    let dominantApp = '';
    maxCount = 0;
    for (const [app, count] of appCounts) {
      if (count > maxCount) {
        maxCount = count;
        dominantApp = app;
      }
    }

    timeline.push({
      time,
      screenshots: items,
      dominant_activity: dominantActivity,
      app_name: dominantApp
    });
  }

  return timeline.sort((a, b) => a.time.localeCompare(b.time));
}

// ==================== 存储管理 ====================

export async function uploadScreenshot(
  file: Buffer,
  fileName: string
): Promise<string> {
  const client = getSupabaseClient();
  
  const { data, error } = await client.storage
    .from('screenshots')
    .upload(fileName, file, {
      contentType: 'image/png',
      upsert: false
    });

  if (error) throw new Error(error.message);

  const { data: urlData } = client.storage
    .from('screenshots')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}
