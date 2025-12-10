/**
 * AI Work Tracker - Type Definitions
 */

// 工作会话
export type WorkSession = {
  id: string;
  started_at: string;
  ended_at?: string;
  status: 'active' | 'paused' | 'completed';
  total_screenshots: number;
  created_at: string;
};

// 截图记录
export type Screenshot = {
  id: string;
  session_id: string;
  file_path: string;
  file_url?: string;
  image_hash?: string;  // 图片 hash，用于判断是否重复
  captured_at: string;
  analysis?: ScreenshotAnalysis;
  created_at: string;
};

// AI 分析结果
export type ScreenshotAnalysis = {
  id: string;
  screenshot_id: string;
  app_name: string;
  activity_type: ActivityType;
  description: string;
  detailed_content?: string;  // 详细内容记录
  tags: string[];
  confidence: number;
  raw_response?: string;
  created_at: string;
};

// 活动类型
export type ActivityType =
  | 'coding'
  | 'browsing'
  | 'documentation'
  | 'communication'
  | 'meeting'
  | 'design'
  | 'entertainment'
  | 'other';

// 工作报告
export type WorkReport = {
  id: string;
  session_id: string;
  summary: string;
  highlights: string[];
  time_breakdown: TimeBreakdown;
  productivity_score: number;
  suggestions: string[];
  generated_at: string;
  created_at: string;
};

// 时间分配
export type TimeBreakdown = {
  [key in ActivityType]?: {
    duration_minutes: number;
    percentage: number;
  };
};

// 仪表盘统计
export type DashboardStats = {
  today_duration_minutes: number;
  today_screenshots: number;
  today_productivity_score: number;
  current_activity?: string;
  active_session?: WorkSession;
};

// 时间线项
export type TimelineItem = {
  time: string;
  screenshots: Screenshot[];
  dominant_activity: ActivityType;
  app_name: string;
};

// API 响应
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Electron IPC 消息
export type IPCMessage =
  | { type: 'start-session' }
  | { type: 'pause-session' }
  | { type: 'resume-session' }
  | { type: 'end-session' }
  | { type: 'screenshot-captured'; data: { path: string; timestamp: string } }
  | { type: 'session-status'; data: { status: WorkSession['status'] } };

// ==================== 用户认证类型 ====================

// 用户
export type User = {
  id: string;
  username: string;
  display_name?: string;
  created_at: string;
  updated_at: string;
};

// 用户会话
export type UserSession = {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
};

// 登录请求
export type LoginRequest = {
  username: string;
  password: string;
};

// 注册请求
export type RegisterRequest = {
  username: string;
  password: string;
  display_name?: string;
};

// 认证响应
export type AuthResponse = {
  user: User;
  token: string;
  expires_at: string;
};
