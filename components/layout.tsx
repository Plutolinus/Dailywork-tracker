/**
 * AI Work Tracker - Layout Component
 */

import Link from 'next/link';
import cn from 'classnames';
import { useRouter } from 'next/router';
import { SkipNavContent } from '@reach/skip-nav';
import { NAVIGATION } from '@lib/constants';
import { useAuth } from '@lib/hooks/use-auth';
import styles from './layout.module.css';
import MobileMenu from './mobile-menu';
import Footer from './footer';
import React from 'react';

type Props = {
  children: React.ReactNode;
  className?: string;
  hideNav?: boolean;
  layoutStyles?: any;
};

export default function Layout({
  children,
  className,
  hideNav,
  layoutStyles
}: Props) {
  const router = useRouter();
  const activeRoute = router.asPath;
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <>
      <div className={styles.background}>
        {!hideNav && (
          <header className={cn(styles.header)}>
            <div className={styles['header-logos']}>
              <MobileMenu key={router.asPath} />
              <Link href="/" className={styles.logo}>
                <span className={styles.logoText}>🎯 AI Work Tracker</span>
              </Link>
            </div>
            <div className={styles.tabs}>
              {NAVIGATION.map(({ name, route }) => (
                <a
                  key={name}
                  href={route}
                  className={cn(styles.tab, {
                    [styles['tab-active']]: activeRoute === route || 
                      (route !== '/' && activeRoute.startsWith(route))
                  })}
                >
                  {name}
                </a>
              ))}
            </div>
            <div className={styles['header-right']}>
              {user && (
                <div className={styles.userSection}>
                  <span className={styles.userName}>
                    👤 {user.display_name || user.username}
                  </span>
                  <button 
                    className={styles.logoutBtn}
                    onClick={handleLogout}
                    title="退出登录"
                  >
                    退出
                  </button>
                </div>
              )}
            </div>
          </header>
        )}
        <div className={styles.page}>
          <main className={styles.main} style={layoutStyles}>
            <SkipNavContent />
            <div className={cn(styles.full, className)}>{children}</div>
          </main>
          <Footer />
        </div>
      </div>
    </>
  );
}
