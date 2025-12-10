/**
 * AI Work Tracker - Footer
 */

import styles from './footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.content}>
        <p className={styles.text}>
          🎯 AI Work Tracker - 智能工作追踪
        </p>
        <p className={styles.copyright}>
          Powered by Next.js + Supabase + Gemini
        </p>
      </div>
    </footer>
  );
}
