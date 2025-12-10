/**
 * AI Work Tracker - 登录/注册页面
 */

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '@lib/hooks/use-auth';
import styles from '@styles/auth.module.css';

type AuthMode = 'login' | 'register';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading, login, register, error: authError } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 如果已登录，跳转到首页
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // 同步认证错误
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let success = false;

      if (mode === 'login') {
        success = await login(username, password);
      } else {
        success = await register(username, password, displayName || undefined);
      }

      if (success) {
        router.push('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError('');
    setUsername('');
    setPassword('');
    setDisplayName('');
  };

  // 加载中状态
  if (authLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.logo}>🎯</div>
            <h1 className={styles.title}>加载中...</h1>
          </div>
        </div>
      </div>
    );
  }

  // 已登录，显示跳转提示
  if (user) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.logo}>✓</div>
            <h1 className={styles.title}>已登录</h1>
            <p className={styles.subtitle}>正在跳转到首页...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{mode === 'login' ? '登录' : '注册'} - AI Work Tracker</title>
        <meta name="description" content="登录到 AI Work Tracker" />
      </Head>

      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.logo}>🎯</div>
            <h1 className={styles.title}>AI Work Tracker</h1>
            <p className={styles.subtitle}>智能工作追踪与分析系统</p>
          </div>

          {/* 登录/注册切换 */}
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${mode === 'login' ? styles.tabActive : ''}`}
              onClick={() => switchMode('login')}
              type="button"
            >
              登录
            </button>
            <button
              className={`${styles.tab} ${mode === 'register' ? styles.tabActive : ''}`}
              onClick={() => switchMode('register')}
              type="button"
            >
              注册
            </button>
          </div>

          {/* 错误提示 */}
          {error && <div className={styles.error}>{error}</div>}

          {/* 表单 */}
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="username">用户名</label>
              <input
                id="username"
                type="text"
                className={styles.input}
                placeholder="请输入用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                required
                autoComplete="username"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="password">密码</label>
              <input
                id="password"
                type="password"
                className={styles.input}
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            {mode === 'register' && (
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="displayName">显示名称（可选）</label>
                <input
                  id="displayName"
                  type="text"
                  className={styles.input}
                  placeholder="您希望显示的名字"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={loading}
                  autoComplete="name"
                />
              </div>
            )}

            <button
              type="submit"
              className={styles.button}
              disabled={loading || !username || !password}
            >
              {loading ? (
                <span className={styles.loading}>
                  <span className={styles.spinner} />
                  处理中...
                </span>
              ) : mode === 'login' ? (
                '登录'
              ) : (
                '注册'
              )}
            </button>
          </form>

          <div className={styles.footer}>
            <p>
              {mode === 'login' 
                ? '还没有账号？点击上方 "注册" 创建一个' 
                : '已有账号？点击上方 "登录" 进入系统'}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

