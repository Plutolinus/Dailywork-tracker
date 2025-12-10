/**
 * AI Work Tracker - 活动记录器 (每个时间点的详细工作记录)
 */

import { useState, useEffect } from 'react';
import { SkipNavContent } from '@reach/skip-nav';
import Page from '@components/page';
import Layout from '@components/layout';
import AuthGuard from '@components/auth-guard';
import styles from '@styles/timeline.module.css';
import { WorkSession, Screenshot, ActivityType } from '@lib/types';

// 活动类型颜色映射
const activityColors: Record<ActivityType, string> = {
  coding: '#10b981',
  browsing: '#3b82f6',
  documentation: '#8b5cf6',
  communication: '#f59e0b',
  meeting: '#ec4899',
  design: '#06b6d4',
  entertainment: '#ef4444',
  other: '#6b7280'
};

// 活动类型中文名
const activityLabels: Record<ActivityType, string> = {
  coding: '编程开发',
  browsing: '网页浏览',
  documentation: '文档阅读',
  communication: '沟通协作',
  meeting: '会议',
  design: '设计',
  entertainment: '娱乐',
  other: '其他'
};

export default function Timeline() {
  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const meta = {
    title: 'AI Work Tracker - 活动记录器',
    description: '查看每个时间点的详细工作记录'
  };

  // 获取会话列表
  useEffect(() => {
    async function fetchSessions() {
      try {
        const res = await fetch('/api/sessions?limit=20');
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          setSessions(data.data);
          setSelectedSession(data.data[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch sessions:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchSessions();
  }, []);

  // 获取截图数据（按时间排序）
  useEffect(() => {
    if (!selectedSession) return;

    async function fetchScreenshots() {
      try {
        const res = await fetch(`/api/screenshots?sessionId=${selectedSession}`);
        const data = await res.json();
        if (data.success) {
          // 按时间排序，最新的在前
          const sorted = [...data.data].sort((a: Screenshot, b: Screenshot) => 
            new Date(b.captured_at).getTime() - new Date(a.captured_at).getTime()
          );
          setScreenshots(sorted);
        }
      } catch (error) {
        console.error('Failed to fetch screenshots:', error);
      }
    }
    fetchScreenshots();
  }, [selectedSession]);

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
  };

  // 格式化时间（精确到分钟）
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // 切换展开/收起详细内容
  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // 全部展开/收起
  const toggleExpandAll = () => {
    if (expandedItems.size === screenshots.length) {
      setExpandedItems(new Set());
    } else {
      setExpandedItems(new Set(screenshots.map(s => s.id)));
    }
  };

  return (
    <AuthGuard>
      <Page meta={meta}>
        <SkipNavContent />
        <Layout>
          <div className={styles.container}>
            <header className={styles.header}>
              <h1 className={styles.title}>📝 活动记录器</h1>
              
              <div className={styles.headerControls}>
                {/* 会话选择器 */}
                <select
                  className={styles.sessionSelect}
                  value={selectedSession || ''}
                  onChange={(e) => setSelectedSession(e.target.value)}
                >
                  {sessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {formatDate(session.started_at)} - {session.status === 'active' ? '进行中' : '已完成'}
                    </option>
                  ))}
                </select>

                {/* 展开/收起按钮 */}
                {screenshots.length > 0 && (
                  <button 
                    className={styles.expandAllBtn}
                    onClick={toggleExpandAll}
                  >
                    {expandedItems.size === screenshots.length ? '收起全部' : '展开全部'}
                  </button>
                )}
              </div>
            </header>

            {/* 统计信息 */}
            {screenshots.length > 0 && (
              <div className={styles.statsBar}>
                <span>共 {screenshots.length} 条记录</span>
                <span>•</span>
                <span>
                  {screenshots[screenshots.length - 1] && formatTime(screenshots[screenshots.length - 1].captured_at)} 
                  {' - '}
                  {screenshots[0] && formatTime(screenshots[0].captured_at)}
                </span>
              </div>
            )}

            {loading ? (
              <div className={styles.loading}>加载中...</div>
            ) : screenshots.length > 0 ? (
              <div className={styles.timeline}>
                {screenshots.map((screenshot) => {
                  const isExpanded = expandedItems.has(screenshot.id);
                  // analysis 是数组，取第一个元素
                  const analysis = Array.isArray(screenshot.analysis) 
                    ? screenshot.analysis[0] 
                    : screenshot.analysis;
                  const activityType = (analysis?.activity_type || 'other') as ActivityType;

                  return (
                    <div 
                      key={screenshot.id} 
                      className={`${styles.recordItem} ${isExpanded ? styles.expanded : ''}`}
                    >
                      {/* 时间标记 */}
                      <div className={styles.timeMarker}>
                        <span className={styles.timeText}>
                          {formatTime(screenshot.captured_at)}
                        </span>
                        <div 
                          className={styles.timeDot}
                          style={{ backgroundColor: activityColors[activityType] }}
                        />
                      </div>

                      {/* 记录内容 */}
                      <div 
                        className={styles.recordContent}
                        onClick={() => toggleExpand(screenshot.id)}
                      >
                        {/* 头部信息 */}
                        <div className={styles.recordHeader}>
                          <span 
                            className={styles.activityBadge}
                            style={{ backgroundColor: activityColors[activityType] }}
                          >
                            {activityLabels[activityType]}
                          </span>
                          <span className={styles.appName}>
                            {analysis?.app_name || '未知应用'}
                          </span>
                          <span className={styles.expandIcon}>
                            {isExpanded ? '▼' : '▶'}
                          </span>
                        </div>

                        {/* 简短描述 */}
                        <div className={styles.recordDescription}>
                          {analysis?.description || '无描述'}
                        </div>

                        {/* 展开的详细内容 */}
                        {isExpanded && (
                          <div className={styles.detailedContent}>
                            {/* 截图预览 */}
                            {screenshot.file_url && (
                              <div className={styles.screenshotSection}>
                                <img
                                  src={screenshot.file_url}
                                  alt="Screenshot"
                                  className={styles.screenshotImage}
                                />
                              </div>
                            )}

                            {/* 详细内容 */}
                            {analysis?.detailed_content && (
                              <div className={styles.detailSection}>
                                <h4>📄 详细记录</h4>
                                <p>{analysis.detailed_content}</p>
                              </div>
                            )}

                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={styles.empty}>
                {selectedSession ? '该会话暂无活动记录' : '请先选择一个工作会话'}
              </div>
            )}

            {/* 活动类型图例 */}
            <div className={styles.legend}>
              {Object.entries(activityLabels).map(([key, label]) => (
                <div key={key} className={styles.legendItem}>
                  <span 
                    className={styles.legendDot}
                    style={{ backgroundColor: activityColors[key as ActivityType] }}
                  />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </Layout>
      </Page>
    </AuthGuard>
  );
}

