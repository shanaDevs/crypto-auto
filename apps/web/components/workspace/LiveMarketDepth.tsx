'use client';

import React, { useState, useEffect } from 'react';
import { subscribeLiveOrderBook, subscribeLiveTrades } from '@/lib/api';

interface LiveMarketDepthProps {
  symbol: string;
}

export function LiveMarketDepth({ symbol }: LiveMarketDepthProps) {
  const [bids, setBids] = useState<[string, string][]>([]);
  const [asks, setAsks] = useState<[string, string][]>([]);
  const [trades, setTrades] = useState<
    { id: number; price: number; qty: number; time: number; isBuyerMaker: boolean }[]
  >([]);

  useEffect(() => {
    const unsubDepth = subscribeLiveOrderBook(symbol, (b, a) => {
      setBids(b);
      setAsks(a);
    });

    const unsubTrades = subscribeLiveTrades(symbol, (trade) => {
      setTrades((prev) => [trade, ...prev.slice(0, 19)]);
    });

    return () => {
      unsubDepth();
      unsubTrades();
    };
  }, [symbol]);

  // Max volume for depth bars
  const maxBidVol = Math.max(...bids.map(([, v]) => parseFloat(v) || 0), 1);
  const maxAskVol = Math.max(...asks.map(([, v]) => parseFloat(v) || 0), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 12 }}>
      {/* Order Book Section */}
      <div className="card" style={{ padding: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
            LIVE ORDER BOOK (BINANCE SPOT)
          </div>
          <span style={{ fontSize: 9, color: 'var(--accent-teal)', fontWeight: 600 }}>● REAL-TIME DEPTH</span>
        </div>

        {/* Asks (Sell Orders) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 6 }}>
          {asks.slice(0, 6).reverse().map(([price, size], i) => {
            const p = parseFloat(price);
            const s = parseFloat(size);
            const pct = Math.min((s / maxAskVol) * 100, 100);
            return (
              <div
                key={`ask-${i}`}
                style={{
                  position: 'relative',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 10,
                  fontFamily: 'JetBrains Mono, monospace',
                  padding: '2px 6px',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: `${pct}%`,
                    background: 'rgba(244, 63, 94, 0.15)',
                    pointerEvents: 'none',
                  }}
                />
                <span style={{ color: '#f43f5e', zIndex: 1 }}>{p < 1 ? p.toFixed(4) : p.toFixed(2)}</span>
                <span style={{ color: 'var(--text-muted)', zIndex: 1 }}>{s.toFixed(3)}</span>
              </div>
            );
          })}
        </div>

        {/* Spread Divider */}
        <div
          style={{
            padding: '3px 6px',
            background: 'var(--bg-secondary)',
            borderTop: '1px solid var(--bg-border)',
            borderBottom: '1px solid var(--bg-border)',
            fontSize: 9,
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: 'JetBrains Mono, monospace',
            color: 'var(--text-muted)',
            margin: '4px 0',
          }}
        >
          <span>Spread</span>
          <span>
            {asks.length > 0 && bids.length > 0
              ? `$${(parseFloat(asks[0][0]) - parseFloat(bids[0][0])).toFixed(2)}`
              : '...'}
          </span>
        </div>

        {/* Bids (Buy Orders) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {bids.slice(0, 6).map(([price, size], i) => {
            const p = parseFloat(price);
            const s = parseFloat(size);
            const pct = Math.min((s / maxBidVol) * 100, 100);
            return (
              <div
                key={`bid-${i}`}
                style={{
                  position: 'relative',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 10,
                  fontFamily: 'JetBrains Mono, monospace',
                  padding: '2px 6px',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: `${pct}%`,
                    background: 'rgba(0, 201, 167, 0.15)',
                    pointerEvents: 'none',
                  }}
                />
                <span style={{ color: 'var(--accent-teal)', zIndex: 1 }}>
                  {p < 1 ? p.toFixed(4) : p.toFixed(2)}
                </span>
                <span style={{ color: 'var(--text-muted)', zIndex: 1 }}>{s.toFixed(3)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Trades Stream */}
      <div className="card" style={{ padding: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
            RECENT TRADES TAPE
          </div>
          <span style={{ fontSize: 9, color: 'var(--accent-teal)', fontWeight: 600 }}>● BINANCE TAPE</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 180, overflowY: 'auto' }}>
          {trades.map((t) => (
            <div
              key={t.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 10,
                fontFamily: 'JetBrains Mono, monospace',
                padding: '2px 4px',
                borderBottom: '1px solid rgba(255,255,255,0.02)',
              }}
            >
              <span style={{ color: t.isBuyerMaker ? '#f43f5e' : 'var(--accent-teal)' }}>
                {t.price < 1 ? t.price.toFixed(4) : t.price.toFixed(2)}
              </span>
              <span style={{ color: 'var(--text-secondary)' }}>{t.qty.toFixed(3)}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 9 }}>
                {new Date(t.time * 1000).toLocaleTimeString()}
              </span>
            </div>
          ))}
          {trades.length === 0 && (
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', padding: 12 }}>
              Streaming live trades from Binance...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
