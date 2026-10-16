'use client';

import React, { useState, useEffect } from 'react';
import {
  DEFAULT_INSTRUMENTS,
  Instrument,
  CandleData,
  PatternItem,
  ForecastItem,
  NewsItem,
  fetchInstruments,
  fetchCandles,
  fetchPatterns,
  fetchForecasts,
  fetchNews,
} from '@/lib/api';
import { TradingViewChart } from '@/components/chart/TradingViewChart';
import { AiEvidenceDrawer } from '@/components/workspace/AiEvidenceDrawer';
import { PatternEvidenceModal } from '@/components/workspace/PatternEvidenceModal';

export default function CoinWorkspacePage() {
  const [instruments, setInstruments] = useState<Instrument[]>(DEFAULT_INSTRUMENTS);
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [timeframe, setTimeframe] = useState('1h');
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [patterns, setPatterns] = useState<PatternItem[]>([]);
  const [forecasts, setForecasts] = useState<ForecastItem[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<PatternItem | null>(null);

  // Indicators toggle
  const [indicators, setIndicators] = useState({
    ema20: true,
    ema50: true,
    ema200: false,
    bollinger: false,
    patterns: true,
    forecast: true,
  });

  useEffect(() => {
    async function load() {
      const [insts, pats, fcs, nw] = await Promise.all([
        fetchInstruments(),
        fetchPatterns(symbol),
        fetchForecasts(symbol),
        fetchNews(symbol),
      ]);
      setInstruments(insts);
      setPatterns(pats);
      setForecasts(fcs);
      setNews(nw);

      const c = await fetchCandles(symbol, timeframe);
      setCandles(c);
    }
    load();
  }, [symbol, timeframe]);

  const currentInst = instruments.find((i) => i.symbol === symbol) || instruments[0];
  const activeForecast = forecasts.find((f) => f.symbol === symbol);

  return (
    <div style={{ height: 'calc(100vh - 48px)', display: 'flex', flexDirection: 'column' }}>
      {/* Pattern Evidence Modal */}
      <PatternEvidenceModal pattern={selectedPattern} onClose={() => setSelectedPattern(null)} />

      {/* Top Workspace Bar */}
      <div
        style={{
          padding: '8px 14px',
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--bg-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        {/* Coin & Pair Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--bg-border)',
              borderRadius: 4,
              color: 'var(--text-primary)',
              fontWeight: 700,
              fontSize: 13,
              padding: '4px 8px',
            }}
          >
            {instruments.map((inst) => (
              <option key={inst.id} value={inst.symbol}>
                {inst.symbol} ({inst.baseAsset})
              </option>
            ))}
          </select>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 16, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
              ${currentInst.price < 1 ? currentInst.price.toFixed(4) : currentInst.price.toLocaleString()}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: currentInst.change24h >= 0 ? 'var(--accent-teal)' : '#f43f5e',
              }}
            >
              {currentInst.change24h >= 0 ? '+' : ''}{currentInst.change24h}%
            </span>
          </div>

          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            24h High: <strong>${currentInst.high24h.toLocaleString()}</strong> · Low: <strong>${currentInst.low24h.toLocaleString()}</strong>
          </div>
        </div>

        {/* Timeframe & Overlays Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Timeframes */}
          <div style={{ display: 'flex', gap: 2 }}>
            {['5m', '15m', '1h', '4h', '1d'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`btn ${timeframe === tf ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '2px 8px', fontSize: 11 }}
              >
                {tf}
              </button>
            ))}
          </div>

          <div style={{ width: 1, height: 16, background: 'var(--bg-border)' }} />

          {/* Indicators Checkboxes */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={indicators.ema20}
                onChange={(e) => setIndicators({ ...indicators, ema20: e.target.checked })}
              />
              <span style={{ color: '#38bdf8' }}>EMA 20</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={indicators.ema50}
                onChange={(e) => setIndicators({ ...indicators, ema50: e.target.checked })}
              />
              <span style={{ color: '#fbbf24' }}>EMA 50</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={indicators.ema200}
                onChange={(e) => setIndicators({ ...indicators, ema200: e.target.checked })}
              />
              <span style={{ color: '#c084fc' }}>EMA 200</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={indicators.patterns}
                onChange={(e) => setIndicators({ ...indicators, patterns: e.target.checked })}
              />
              <span style={{ color: 'var(--accent-teal)' }}>Patterns</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={indicators.forecast}
                onChange={(e) => setIndicators({ ...indicators, forecast: e.target.checked })}
              />
              <span style={{ color: '#10b981' }}>Forecast Fan</span>
            </label>
          </div>
        </div>
      </div>

      {/* Main Workspace Body: Chart (dominating) + Collapsible Right Drawer */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 380px', overflow: 'hidden' }}>
        {/* Chart View */}
        <div style={{ height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, minHeight: 0 }}>
            <TradingViewChart
              candles={candles}
              patterns={patterns}
              forecast={activeForecast}
              symbol={symbol}
              timeframe={timeframe}
              showIndicators={indicators}
              onPatternClick={(p) => setSelectedPattern(p)}
              height={620}
            />
          </div>

          {/* Bottom Indicators Data Row */}
          <div
            style={{
              padding: '6px 14px',
              borderTop: '1px solid var(--bg-border)',
              background: 'var(--bg-card)',
              display: 'flex',
              gap: 16,
              fontSize: 10,
              fontFamily: 'JetBrains Mono, monospace',
              color: 'var(--text-muted)',
            }}
          >
            <span>RSI (14): <strong style={{ color: 'var(--text-primary)' }}>58.4</strong></span>
            <span>ATR (14): <strong style={{ color: 'var(--text-primary)' }}>842.1</strong></span>
            <span>MACD (12,26,9): <strong style={{ color: 'var(--accent-teal)' }}>+142.5</strong></span>
            <span>Rel Vol (vs 20-bar): <strong style={{ color: 'var(--accent-teal)' }}>1.15x</strong></span>
            <span>Pivot Delay: <strong>3 closed bars (non-backdated)</strong></span>
          </div>
        </div>

        {/* Collapsible Right Sidebar: AI Evidence & News */}
        <div style={{ height: '100%', overflowY: 'auto' }}>
          <AiEvidenceDrawer symbol={symbol} />
        </div>
      </div>
    </div>
  );
}
