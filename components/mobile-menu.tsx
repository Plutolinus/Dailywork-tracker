/**
 * AI Work Tracker - Mobile Menu
 */

import { useState } from 'react';
import { useRouter } from 'next/router';
import cn from 'classnames';
import { NAVIGATION } from '@lib/constants';
import styles from './mobile-menu.module.css';

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const activeRoute = router.asPath;

  return (
    <div className={styles.container}>
      <button
        className={styles.menuButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        <span className={cn(styles.menuIcon, { [styles.open]: isOpen })}>
          <span />
          <span />
          <span />
        </span>
      </button>

      {isOpen && (
        <>
          <div className={styles.overlay} onClick={() => setIsOpen(false)} />
          <nav className={styles.menu}>
            {NAVIGATION.map(({ name, route }) => (
              <a
                key={name}
                href={route}
                className={cn(styles.menuItem, {
                  [styles.active]: activeRoute === route ||
                    (route !== '/' && activeRoute.startsWith(route))
                })}
                onClick={() => setIsOpen(false)}
              >
                {name}
              </a>
            ))}
          </nav>
        </>
      )}
    </div>
  );
}
