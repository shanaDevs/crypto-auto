'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useThemeStore } from '@/store/themeStore';
import { DemoBadge } from '@/components/ui/DemoBadge';
import { DemoTradingEngine } from '@/components/demo/DemoTradingEngine';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: '◈' },
  { href: '/workspace', label: 'Coin Workspace', icon: '◉' },
  { href: '/demo-trades', label: 'Demo Trading & Accuracy', icon: '🎯' },
  { href: '/scanner', label: 'Pattern Scanner', icon: '◎' },
  { href: '/forecasts', label: 'Forecast Archive', icon: '◌' },
  { href: '/news', label: 'News Centre', icon: '◆' },
  { href: '/alerts', label: 'Alerts', icon: '◈' },
  { href: '/research', label: 'Paper Research', icon: '◇' },
  { href: '/ai', label: 'AI Assistant', icon: '◈' },
  { href: '/admin', label: 'Admin', icon: '⚙' },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, toggle } = useThemeStore();

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar" role="navigation" aria-label="Main navigation">
        {/* Logo */}
        <div style={{ padding: '14px 14px 8px', borderBottom: '1px solid var(--bg-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div style={{
              width: 28, height: 28, borderRadius: 6,
              background: 'linear-gradient(135deg, var(--accent-teal), var(--accent-blue))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: '#0d0f14',
            }}>₿</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '-0.2px' }}>CryptoAnalysis</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>PLATFORM v1.0</div>
            </div>
          </div>
          <DemoBadge />
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '8px 0' }}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${pathname === item.href ? 'active' : ''}`}
              aria-current={pathname === item.href ? 'page' : undefined}
            >
              <span style={{ fontSize: 10 }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '10px 14px', borderTop: '1px solid var(--bg-border)' }}>
          <button
            onClick={toggle}
            className="btn btn-ghost"
            style={{ width: '100%', justifyContent: 'center', fontSize: 11 }}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? '☀ Light Mode' : '◐ Dark Mode'}
          </button>
          <div style={{ marginTop: 8, textAlign: 'center', fontSize: 9, color: 'var(--text-muted)' }}>
            Asia/Colombo (UTC+5:30)
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content" id="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              {NAV_ITEMS.find((n) => n.href === pathname)?.label ?? 'Crypto Analysis'}
            </span>
          </div>
          <div className="status-bar">
            <div className="status-dot ok" aria-label="System status: ok" />
            <span>System OK</span>
            <span style={{ color: 'var(--bg-border)' }}>|</span>
            <span>
              {new Date().toLocaleTimeString('en-US', {
                timeZone: 'Asia/Colombo',
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              IST
            </span>
          </div>
        </header>

        {/* Page content */}
        <main id="page-content" tabIndex={-1}>
          {children}
        </main>
      </div>

      {/* Global Background Demo Trading Engine & Notification Toasts */}
      <DemoTradingEngine />
    </div>
  );
}
