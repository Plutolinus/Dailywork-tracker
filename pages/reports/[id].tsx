/**
 * AI Work Tracker - Report Detail (报告详情)
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { SkipNavContent } from '@reach/skip-nav';
import Page from '@components/page';
import Layout from '@components/layout';
import AuthGuard from '@components/auth-guard';
import styles from '@styles/report-detail.module.css';
import { WorkReport, ActivityType } from '@lib/types';

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

// 活动类型颜色
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

export default function ReportDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [report, setReport] = useState<WorkReport | null>(null);
  const [loading, setLoading] = useState(true);

  const meta = {
    title: 'AI Work Tracker - 报告详情',
    description: '查看工作报告详情'
  };

  useEffect(() => {
    if (!id) return;

    async function fetchReport() {
      try {
        const res = await fetch(`/api/reports/${id}`);
        const data = await res.json();
        if (data.success) {
          setReport(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch report:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [id]);

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 获取效率评分颜色
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  // 获取效率评分描述
  const getScoreLabel = (score: number) => {
    if (score >= 90) return '非常高效！';
    if (score >= 80) return '效率很好';
    if (score >= 60) return '效率一般';
    if (score >= 40) return '需要改进';
    return '效率较低';
  };

  if (loading) {
    return (
      <AuthGuard>
        <Page meta={meta}>
          <SkipNavContent />
          <Layout>
            <div className={styles.container}>
              <div className={styles.loading}>加载中...</div>
            </div>
          </Layout>
        </Page>
      </AuthGuard>
    );
  }

  if (!report) {
    return (
      <AuthGuard>
        <Page meta={meta}>
          <SkipNavContent />
          <Layout>
            <div className={styles.container}>
              <div className={styles.error}>报告不存在</div>
            </div>
          </Layout>
        </Page>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <Page meta={meta}>
        <SkipNavContent />
        <Layout>
          <div className={styles.container}>
          {/* 返回按钮 */}
          <a href="/reports" className={styles.backLink}>
            ← 返回报告列表
          </a>

          {/* 报告头部 */}
          <header className={styles.header}>
            <div className={styles.headerContent}>
              <h1 className={styles.title}>📋 工作报告</h1>
              <div className={styles.date}>{formatDate(report.generated_at)}</div>
            </div>
            <div 
              className={styles.scoreCard}
              style={{ borderColor: getScoreColor(report.productivity_score) }}
            >
              <div 
                className={styles.scoreValue}
                style={{ color: getScoreColor(report.productivity_score) }}
              >
                {report.productivity_score}
              </div>
              <div className={styles.scoreLabel}>
                {getScoreLabel(report.productivity_score)}
              </div>
            </div>
          </header>

          {/* 工作摘要 */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>📝 工作摘要</h2>
            <div className={styles.summary}>{report.summary}</div>
          </section>

          {/* 重点工作 */}
          {report.highlights.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>✅ 重点工作</h2>
              <ul className={styles.highlightsList}>
                {report.highlights.map((highlight, i) => (
                  <li key={i} className={styles.highlightItem}>
                    <span className={styles.highlightCheck}>✓</span>
                    {highlight}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 时间分配 */}
          {Object.keys(report.time_breakdown).length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>⏱️ 时间分配</h2>
              <div className={styles.timeBreakdown}>
                {Object.entries(report.time_breakdown).map(([activity, data]) => {
                  const activityType = activity as ActivityType;
                  return (
                    <div key={activity} className={styles.breakdownItem}>
                      <div className={styles.breakdownHeader}>
                        <span 
                          className={styles.breakdownDot}
                          style={{ backgroundColor: activityColors[activityType] }}
                        />
                        <span className={styles.breakdownLabel}>
                          {activityLabels[activityType] || activity}
                        </span>
                        <span className={styles.breakdownTime}>
                          {data.duration_minutes}分钟
                        </span>
                        <span className={styles.breakdownPercent}>
                          {data.percentage}%
                        </span>
                      </div>
                      <div className={styles.breakdownBar}>
                        <div 
                          className={styles.breakdownProgress}
                          style={{ 
                            width: `${data.percentage}%`,
                            backgroundColor: activityColors[activityType]
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* 改进建议 */}
          {report.suggestions.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>💡 改进建议</h2>
              <ul className={styles.suggestionsList}>
                {report.suggestions.map((suggestion, i) => (
                  <li key={i} className={styles.suggestionItem}>
                    <span className={styles.suggestionIcon}>💡</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </Layout>
    </Page>
  </AuthGuard>
  );
}

