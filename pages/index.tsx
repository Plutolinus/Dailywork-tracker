/**
 * AI Work Tracker - Dashboard (仪表盘首页)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { SkipNavContent } from '@reach/skip-nav';
import Page from '@components/page';
import Layout from '@components/layout';
import AuthGuard from '@components/auth-guard';
import styles from '@styles/dashboard.module.css';
import { DashboardStats, Screenshot } from '@lib/types';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentScreenshots, setRecentScreenshots] = useState<Screenshot[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(true);
  const [screenshotCount, setScreenshotCount] = useState(0);
  const [isSupported, setIsSupported] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  
  // 使用 ref 存储 sessionId，避免 state 更新延迟问题
  const sessionIdRef = useRef<string | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const meta = {
    title: 'AI Work Tracker - 仪表盘',
    description: 'AI 驱动的工作行为监控与日志生成系统'
  };

  // 检查浏览器支持
  useEffect(() => {
    setIsSupported(!!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia));
  }, []);

  // 获取统计数据
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  // 获取最近截图
  const fetchRecentScreenshots = useCallback(async () => {
    try {
      const res = await fetch('/api/screenshots?recent=true&limit=8');
      const data = await res.json();
      if (data.success) {
        setRecentScreenshots(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch screenshots:', error);
    }
  }, []);

  // 初始化
  useEffect(() => {
    Promise.all([fetchStats(), fetchRecentScreenshots()]).finally(() => {
      setLoading(false);
    });

    // 定期刷新
    const interval = setInterval(() => {
      fetchStats();
      fetchRecentScreenshots();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchStats, fetchRecentScreenshots]);

  // 截取屏幕帧
  const captureFrame = useCallback(async () => {
    const currentSessionId = sessionIdRef.current;
    
    if (!videoRef.current || !canvasRef.current || !currentSessionId) {
      console.log('Skip capture: missing video, canvas, or sessionId');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // 确保视频已准备好
    if (video.readyState < 2) {
      console.log('Video not ready yet');
      return;
    }

    // 设置 canvas 尺寸
    const maxWidth = 1920;
    const maxHeight = 1080;
    
    let width = video.videoWidth;
    let height = video.videoHeight;

    if (width === 0 || height === 0) {
      console.log('Video dimensions not available');
      return;
    }

    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }
    if (height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);
    const imageBase64 = canvas.toDataURL('image/jpeg', 0.7);
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    setStatusMessage('正在上传截图...');

    // 上传截图
    try {
      const res = await fetch('/api/screenshots/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSessionId,
          imageBase64: base64Data
        })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        setScreenshotCount(prev => prev + 1);
        setStatusMessage('截图上传成功，AI 分析中...');
        fetchRecentScreenshots();
      } else {
        console.error('Upload failed:', data.error);
        setStatusMessage('截图上传失败: ' + (data.error || '未知错误'));
      }
    } catch (error) {
      console.error('Upload error:', error);
      setStatusMessage('截图上传出错');
    }
  }, [fetchRecentScreenshots]);

  // 开始屏幕共享
  const startRecording = async () => {
    try {
      setStatusMessage('正在请求屏幕共享权限...');
      
      // 请求屏幕共享
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
          frameRate: { ideal: 1, max: 5 }
        },
        audio: false
      });

      mediaStreamRef.current = stream;
      setStatusMessage('屏幕共享已启动，正在初始化...');

      // 创建视频元素
      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      
      // 等待视频加载
      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => {
          video.play().then(() => resolve());
        };
      });
      
      videoRef.current = video;

      // 创建 canvas
      canvasRef.current = document.createElement('canvas');

      // 监听停止共享
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        setStatusMessage('屏幕共享已停止');
        stopRecording();
      });

      // 先创建工作会话
      setStatusMessage('正在创建工作会话...');
      const res = await fetch('/api/sessions', { method: 'POST' });
      const data = await res.json();
      
      if (!data.success) {
        throw new Error('Failed to create session');
      }
      
      // 使用 ref 存储 sessionId
      sessionIdRef.current = data.data.id;
      console.log('Session created:', data.data.id);

      setIsRecording(true);
      setScreenshotCount(0);
      setStatusMessage('开始录制，每5秒自动截图...');

      // 等待一下确保视频流稳定
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 立即截取第一张
      await captureFrame();

      // 每5秒截取一次
      intervalRef.current = setInterval(() => {
        captureFrame();
      }, 5000);

    } catch (error) {
      console.error('Screen capture failed:', error);
      setStatusMessage('屏幕共享失败');
      alert('无法启动屏幕共享，请确保浏览器支持并授予权限');
      stopRecording();
    }
  };

  // 停止屏幕共享
  const stopRecording = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current = null;
    }

    setIsRecording(false);
    setStatusMessage('');
  };

  // 结束工作并生成报告
  const handleEndWork = async () => {
    const currentSessionId = sessionIdRef.current;
    
    if (!currentSessionId) {
      alert('没有活跃的工作会话');
      return;
    }

    if (screenshotCount === 0) {
      alert('还没有截取任何截图，请等待至少一张截图后再结束');
      return;
    }

    setStatusMessage('正在结束会话...');
    await stopRecording();

    // 更新会话状态
    setStatusMessage('正在更新会话状态...');
    await fetch(`/api/sessions/${currentSessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' })
    });

    // 生成报告
    setStatusMessage('正在生成工作报告，请稍候...');
    const res = await fetch('/api/reports/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: currentSessionId })
    });

    const data = await res.json();
    
    if (data.success) {
      sessionIdRef.current = null;
      window.location.href = `/reports/${data.data.id}`;
    } else {
      setStatusMessage('');
      alert('报告生成失败：' + (data.error || '未知错误'));
      fetchStats();
    }
  };

  // 格式化时间
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <AuthGuard>
      <Page meta={meta}>
        <SkipNavContent />
        <Layout>
          <div className={styles.container}>
          {/* 头部控制区 */}
          <header className={styles.header}>
            <div className={styles.titleSection}>
              <h1 className={styles.title}>🎯 工作追踪</h1>
              <p className={styles.subtitle}>
                {statusMessage || (isRecording 
                  ? `正在记录... 已截图 ${screenshotCount} 张` 
                  : '点击开始，选择要共享的屏幕')}
              </p>
            </div>
            <div className={styles.controls}>
              {!isSupported ? (
                <div className={styles.notSupported}>
                  ⚠️ 您的浏览器不支持屏幕共享
                </div>
              ) : isRecording ? (
                <>
                  <div className={styles.recordingIndicator}>
                    <span className={styles.recordingDot} />
                    录制中 ({screenshotCount})
                  </div>
                  <button
                    className={`${styles.btn} ${styles.btnEnd}`}
                    onClick={handleEndWork}
                    disabled={screenshotCount === 0}
                  >
                    🛑 结束并生成报告
                  </button>
                </>
              ) : (
                <button
                  className={`${styles.btn} ${styles.btnStart}`}
                  onClick={startRecording}
                >
                  🖥️ 开始共享屏幕
                </button>
              )}
            </div>
          </header>

          {/* 使用说明 */}
          {!isRecording && (
            <div className={styles.guide}>
              <h3>📋 使用说明</h3>
              <ol>
                <li>点击 <strong>"开始共享屏幕"</strong> 按钮</li>
                <li>在弹出窗口中选择要共享的 <strong>整个屏幕</strong>（推荐）</li>
                <li>系统将每 <strong>5 秒</strong> 自动截取屏幕</li>
                <li>AI 会自动分析您的工作内容</li>
                <li>工作完成后点击 <strong>"结束并生成报告"</strong></li>
              </ol>
            </div>
          )}

          {/* 统计卡片 */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>⏱️</div>
              <div className={styles.statContent}>
                <div className={styles.statValue}>
                  {loading ? '--' : formatDuration(stats?.today_duration_minutes || 0)}
                </div>
                <div className={styles.statLabel}>今日工作时长</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>📸</div>
              <div className={styles.statContent}>
                <div className={styles.statValue}>
                  {loading ? '--' : (isRecording ? screenshotCount : stats?.today_screenshots || 0)}
                </div>
                <div className={styles.statLabel}>{isRecording ? '本次截图' : '今日截图数'}</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>🎯</div>
              <div className={styles.statContent}>
                <div className={styles.statValue}>
                  {loading ? '--' : `${stats?.today_productivity_score || 0}%`}
                </div>
                <div className={styles.statLabel}>效率评分</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>💻</div>
              <div className={styles.statContent}>
                <div className={styles.statValue} style={{ fontSize: '1rem' }}>
                  {loading ? '--' : (stats?.current_activity || '无活动')}
                </div>
                <div className={styles.statLabel}>最近活动</div>
              </div>
            </div>
          </div>

          {/* 最近截图 */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>📷 最近截图</h2>
            {recentScreenshots.length > 0 ? (
              <div className={styles.screenshotsGrid}>
                {recentScreenshots.map((screenshot) => (
                  <div key={screenshot.id} className={styles.screenshotCard}>
                    {screenshot.file_url ? (
                      <img
                        src={screenshot.file_url}
                        alt="Screenshot"
                        className={styles.screenshotImage}
                      />
                    ) : (
                      <div className={styles.screenshotPlaceholder}>
                        📷
                      </div>
                    )}
                    <div className={styles.screenshotInfo}>
                      <div className={styles.screenshotApp}>
                        {screenshot.analysis?.app_name || '分析中...'}
                      </div>
                      <div className={styles.screenshotTime}>
                        {new Date(screenshot.captured_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.empty}>
                {loading ? '加载中...' : '暂无截图，开始共享屏幕以捕获您的工作'}
              </div>
            )}
          </section>

          {/* 快捷操作 */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>🔗 快捷操作</h2>
            <div className={styles.quickActions}>
              <a href="/timeline" className={styles.actionCard}>
                <span className={styles.actionIcon}>📊</span>
                <span className={styles.actionLabel}>时间线</span>
              </a>
              <a href="/reports" className={styles.actionCard}>
                <span className={styles.actionIcon}>📋</span>
                <span className={styles.actionLabel}>历史报告</span>
              </a>
            </div>
          </section>
        </div>
      </Layout>
    </Page>
  </AuthGuard>
  );
}
