/**
 * AI Work Tracker - Database API
 * 统一的数据库访问层
 */

import * as supabaseApi from './db-providers/supabase';
import {
  WorkSession,
  Screenshot,
  ScreenshotAnalysis,
  WorkReport,
  DashboardStats,
  TimelineItem
} from './types';

// ==================== 会话管理 ====================

export async function createSession(userId?: string): Promise<WorkSession> {
  return supabaseApi.createSession(userId);
}

export async function getActiveSession(userId?: string): Promise<WorkSession | null> {
  return supabaseApi.getActiveSession(userId);
}

export async function updateSessionStatus(
  id: string,
  status: WorkSession['status']
): Promise<WorkSession> {
  return supabaseApi.updateSessionStatus(id, status);
}

export async function getSession(id: string, userId?: string): Promise<WorkSession | null> {
  return supabaseApi.getSession(id, userId);
}

export async function getSessions(limit?: number, userId?: string): Promise<WorkSession[]> {
  return supabaseApi.getSessions(limit, userId);
}

// ==================== 截图管理 ====================

export async function saveScreenshot(
  sessionId: string,
  filePath: string,
  fileUrl?: string,
  userId?: string,
  imageHash?: string
): Promise<Screenshot> {
  return supabaseApi.saveScreenshot(sessionId, filePath, fileUrl, userId, imageHash);
}

export async function getScreenshots(sessionId: string): Promise<Screenshot[]> {
  return supabaseApi.getScreenshots(sessionId);
}

export async function getScreenshot(id: string): Promise<Screenshot | null> {
  return supabaseApi.getScreenshot(id);
}

export async function getRecentScreenshots(limit?: number, userId?: string): Promise<Screenshot[]> {
  return supabaseApi.getRecentScreenshots(limit, userId);
}

// ==================== AI 分析管理 ====================

export async function saveAnalysis(
  screenshotId: string,
  analysis: Omit<ScreenshotAnalysis, 'id' | 'screenshot_id' | 'created_at'>
): Promise<ScreenshotAnalysis> {
  return supabaseApi.saveAnalysis(screenshotId, analysis);
}

export async function getAnalysesBySession(sessionId: string): Promise<ScreenshotAnalysis[]> {
  return supabaseApi.getAnalysesBySession(sessionId);
}

export async function copyAnalysisFromScreenshot(
  sourceScreenshotId: string,
  targetScreenshotId: string
): Promise<void> {
  return supabaseApi.copyAnalysisFromScreenshot(sourceScreenshotId, targetScreenshotId);
}

// ==================== 报告管理 ====================

export async function saveReport(
  report: Omit<WorkReport, 'id' | 'created_at'>,
  userId?: string
): Promise<WorkReport> {
  return supabaseApi.saveReport(report, userId);
}

export async function getReport(id: string, userId?: string): Promise<WorkReport | null> {
  return supabaseApi.getReport(id, userId);
}

export async function getReportBySession(sessionId: string, userId?: string): Promise<WorkReport | null> {
  return supabaseApi.getReportBySession(sessionId, userId);
}

export async function getReports(limit?: number, userId?: string): Promise<WorkReport[]> {
  return supabaseApi.getReports(limit, userId);
}

// ==================== 统计与时间线 ====================

export async function getDashboardStats(userId?: string): Promise<DashboardStats> {
  return supabaseApi.getDashboardStats(userId);
}

export async function getTimeline(sessionId: string): Promise<TimelineItem[]> {
  return supabaseApi.getTimeline(sessionId);
}

// ==================== 存储 ====================

export async function uploadScreenshot(file: Buffer, fileName: string): Promise<string> {
  return supabaseApi.uploadScreenshot(file, fileName);
}
