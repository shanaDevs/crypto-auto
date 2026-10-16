'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useDemoTrade } from '@/store/useDemoTrade';
import { subscribeRealtimeTickers, fetchCandles, detectPatternsOnRealCandles, DEFAULT_INSTRUMENTS } from '@/lib/api';

export function DemoTradingEngine() {
  const { notifications, dismissNotification, processLiveTick, isAutoTradeEnabled, stats } = useDemoTrade();
  const patternsCacheRef = useRef<Record<string, any[]>>({});

  // 1. Initial pattern scan across high-volume pairs to populate trigger levels
  useEffect(() => {
    async function primePatterns() {
      const topSymbols = DEFAULT_INSTRUMENTS.slice(0, 10).map((i) => i.symbol);
      for (const sym of topSymbols) {
        try {
          const candles = await fetchCandles(sym, '1h', 80);
          if (candles.length > 30) {
            const detected = detectPatternsOnRealCandles(candles, sym, '1h');
            patternsCacheRef.current[sym] = detected;
          }
        } catch {}
      }
    }
    primePatterns();

    // Refresh pattern cache every 45 seconds
    const interval = setInterval(primePatterns, 45000);
    return () => clearInterval(interval);
  }, []);

  // 2. Continuous Real-Time Binance Multi-Ticker WebSocket listener
  useEffect(() => {
    const unsub = subscribeRealtimeTickers((ticker) => {
      const activePatterns = patternsCacheRef.current[ticker.symbol] || [];
      processLiveTick(ticker.symbol, ticker.price, activePatterns);
    });

    return () => {
      unsub();
    };
  }, [processLiveTick]);

  if (notifications.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        maxWidth: 380,
        pointerEvents: 'none',
      }}
    >
      {notifications.slice(0, 3).map((n) => {
        const isWin = n.type === 'TAKE_PROFIT';
        const isLoss = n.type === 'STOP_LOSS';
        const isEntry = n.type === 'ENTRY';

        const borderColor = isWin
          ? 'var(--accent-teal)'
          : isLoss
          ? 'var(--accent-rose)'
          : 'var(--accent-blue)';

        const bgColor = isWin
          ? 'rgba(0, 201, 167, 0.12)'
          : isLoss
          ? 'rgba(244, 63, 94, 0.12)'
          : 'rgba(56, 189, 248, 0.12)';

        return (
          <div
            key={n.id}
            style={{
              pointerEvents: 'auto',
              background: 'var(--bg-card)',
              border: `1px solid ${borderColor}`,
              borderLeft: `4px solid ${borderColor}`,
              borderRadius: 6,
              padding: '10px 14px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
              backdropFilter: 'blur(8px)',
              animation: 'fadeInSlide 0.25s ease-out',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 3,
                    background: bgColor,
                    color: borderColor,
                    textTransform: 'uppercase',
                  }}
                >
                  {isEntry ? '⚡ AUTO-ENTRY' : isWin ? '🎯 TAKE PROFIT' : isLoss ? '🛑 STOP LOSS' : 'TRADE'}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700 }}>{n.symbol}</span>
              </div>
              <button
                onClick={() => dismissNotification(n.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: 13,
                  padding: '0 4px',
                }}
                title="Dismiss"
              >
                ✕
              </button>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{n.message}</div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 6,
                paddingTop: 6,
                borderTop: '1px solid var(--bg-border)',
                fontSize: 10,
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>
                Accuracy: <strong style={{ color: 'var(--accent-teal)' }}>{stats.winRate}%</strong> ({stats.winningTrades}W / {stats.losingTrades}L)
              </span>
              <Link
                href="/demo-trades"
                style={{
                  color: 'var(--accent-teal)',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                View Accuracy Page ➔
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
