/**
 * AI Work Tracker - 认证保护组件
 */

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@lib/hooks/use-auth';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // 加载中显示加载状态
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#0f172a',
        color: '#94a3b8',
        fontSize: '1.125rem'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎯</div>
          <div>加载中...</div>
        </div>
      </div>
    );
  }

  // 未登录时显示空白（等待跳转）
  if (!user) {
    return null;
  }

  return <>{children}</>;
}

