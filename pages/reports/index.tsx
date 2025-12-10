/**
 * AI Work Tracker - Reports List (报告列表)
 */

import { useState, useEffect } from 'react';
import { SkipNavContent } from '@reach/skip-nav';
import Page from '@components/page';
import Layout from '@components/layout';
import AuthGuard from '@components/auth-guard';
import styles from '@styles/reports.module.css';
import { WorkReport } from '@lib/types';

export default function Reports() {
  const [reports, setReports] = useState<WorkReport[]>([]);
  const [loading, setLoading] = useState(true);

  const meta = {
    title: 'AI Work Tracker - 工作报告',
    description: '查看历史工作报告'
  };

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await fetch('/api/reports?limit=20');
        const data = await res.json();
        if (data.success) {
          setReports(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch reports:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

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

  return (
    <AuthGuard>
      <Page meta={meta}>
        <SkipNavContent />
        <Layout>
          <div className={styles.container}>
            <header className={styles.header}>
            <h1 className={styles.title}>📋 工作报告</h1>
          </header>

          {loading ? (
            <div className={styles.loading}>加载中...</div>
          ) : reports.length > 0 ? (
            <div className={styles.reportsList}>
              {reports.map((report) => (
                <a
                  key={report.id}
                  href={`/reports/${report.id}`}
                  className={styles.reportCard}
                >
                  <div className={styles.reportHeader}>
                    <div className={styles.reportDate}>
                      {formatDate(report.generated_at)}
                    </div>
                    <div 
                      className={styles.reportScore}
                      style={{ color: getScoreColor(report.productivity_score) }}
                    >
                      {report.productivity_score}分
                    </div>
                  </div>
                  
                  <div className={styles.reportSummary}>
                    {report.summary}
                  </div>
                  
                  {report.highlights.length > 0 && (
                    <div className={styles.reportHighlights}>
                      {report.highlights.slice(0, 3).map((highlight, i) => (
                        <span key={i} className={styles.highlightTag}>
                          ✓ {highlight}
                        </span>
                      ))}
                      {report.highlights.length > 3 && (
                        <span className={styles.highlightMore}>
                          +{report.highlights.length - 3} 更多
                        </span>
                      )}
                    </div>
                  )}

                  <div className={styles.reportArrow}>→</div>
                </a>
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>📋</div>
              <div className={styles.emptyText}>暂无工作报告</div>
              <p className={styles.emptyHint}>
                完成一个工作会话后，系统将自动生成工作报告
              </p>
            </div>
          )}
        </div>
      </Layout>
    </Page>
  </AuthGuard>
  );
}

