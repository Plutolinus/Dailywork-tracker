/**
 * AI Work Tracker - Constants
 */

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
export const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_ORIGIN || new URL(SITE_URL).origin;
export const SITE_NAME = 'AI Work Tracker';
export const SITE_NAME_MULTILINE = ['AI Work', 'Tracker'];
export const META_DESCRIPTION = 'AI 驱动的工作行为监控与日志生成系统，帮助你追踪工作时间并自动生成工作报告';
export const SITE_DESCRIPTION = '智能追踪你的工作，自动生成日报';
export const TWITTER_USER_NAME = process.env.NEXT_PUBLIC_TWITTER_USER_NAME || '';

// 截屏配置
export const SCREENSHOT_INTERVAL_MS = 5000; // 5秒截屏一次
export const MAX_SCREENSHOTS_PER_SESSION = 10000;

// 导航菜单
export const NAVIGATION = [
  {
    name: '仪表盘',
    route: '/'
  },
  {
    name: '时间线',
    route: '/timeline'
  },
  {
    name: '工作报告',
    route: '/reports'
  }
];

// 活动类型
export const ACTIVITY_TYPES = [
  { value: 'coding', label: '编程开发', color: '#10b981' },
  { value: 'browsing', label: '网页浏览', color: '#3b82f6' },
  { value: 'documentation', label: '文档阅读', color: '#8b5cf6' },
  { value: 'communication', label: '沟通协作', color: '#f59e0b' },
  { value: 'meeting', label: '会议', color: '#ec4899' },
  { value: 'design', label: '设计', color: '#06b6d4' },
  { value: 'entertainment', label: '娱乐', color: '#ef4444' },
  { value: 'other', label: '其他', color: '#6b7280' }
];
