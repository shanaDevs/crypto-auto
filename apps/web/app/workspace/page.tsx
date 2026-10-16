'use client';

import React, { useState, useEffect } from 'react';
import {
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
  subscribeRealtimeKline,
  detectPatternsOnRealCandles,
} from '@/lib/api';
import { TradingViewChart } from '@/components/chart/TradingViewChart';
import { AiEvidenceDrawer } from '@/components/workspace/AiEvidenceDrawer';
import { PatternEvidenceModal } from '@/components/workspace/PatternEvidenceModal';
import { LiveMarketDepth } from '@/components/workspace/LiveMarketDepth';
import { BinancePositionsPanel } from '@/components/workspace/BinancePositionsPanel';
import { useDemoTrade } from '@/store/useDemoTrade';
import Link from 'next/link';

export default function CoinWorkspacePage() {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [timeframe, setTimeframe] = useState('1h');
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [patterns, setPatterns] = useState<PatternItem[]>([]);
  const [forecasts, setForecasts] = useState<ForecastItem[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<PatternItem | null>(null);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<'depth' | 'ai' | 'patterns' | 'demo'>('depth');
  const [leverage, setLeverage] = useState<number>(10);

  const {
    openTrades,
    openTrade,
    closeTrade,
    closeAllTrades,
    isAutoTradeEnabled,
    setAutoTrade,
    stats,
    defaultTradeSize,
    setDefaultTradeSize,
    processLiveTick,
  } = useDemoTrade();
  const currentDemoTrade = openTrades.find((t) => t.symbol === symbol);

  // Indicators toggle
  const [indicators, setIndicators] = useState({
    ema20: true,
    ema50: true,
    ema200: false,
    bollinger: false,
    patterns: true,
    forecast: true,
  });

  // 1. Initial Load of Real Binance Historical Candles & Data
  useEffect(() => {
    async function load() {
      const [insts, fcs, nw, pats] = await Promise.all([
        fetchInstruments(),
        fetchForecasts(symbol),
        fetchNews(symbol),
        fetchPatterns(symbol),
      ]);
      setInstruments(insts);
      setForecasts(fcs);
      setNews(nw);

      const c = await fetchCandles(symbol, timeframe, 200);
      setCandles(c);
      if (c.length > 0) {
        setLivePrice(c[c.length - 1].close);
        const liveDetected = detectPatternsOnRealCandles(c, symbol, timeframe);
        const merged = [...liveDetected];
        for (const p of pats) {
          if (!merged.some((m) => m.id === p.id)) merged.push(p);
        }
        setPatterns(merged);
        if (merged.length > 0) {
          setSelectedPattern(merged[0]); // Automatically apply top usable pattern
        }
      } else if (pats.length > 0) {
        setPatterns(pats);
        setSelectedPattern(pats[0]);
      }
    }
    load();
  }, [symbol, timeframe]);

  // 2. Real-Time Binance WebSocket Subscription for Live Ticks
  useEffect(() => {
    const unsubscribe = subscribeRealtimeKline(symbol, timeframe, (tick, isClosed) => {
      setLivePrice(tick.close);
      processLiveTick(symbol, tick.close, patterns);

      setCandles((prev) => {
        if (prev.length === 0) return [tick];
        const last = prev[prev.length - 1];

        if (last.time === tick.time) {
          // Update in-flight candle
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...tick,
            high: Math.max(last.high, tick.high),
            low: Math.min(last.low, tick.low),
          };
          return updated;
        } else if (isClosed || tick.time > last.time) {
          // Append newly opened or finalized candle
          const updated = [...prev, tick];
          if (updated.length > 300) updated.shift();
          // Re-evaluate real patterns dynamically
          const detected = detectPatternsOnRealCandles(updated, symbol, timeframe);
          if (detected.length > 0) setPatterns(detected);
          return updated;
        }
        return prev;
      });
    });

    return () => {
      unsubscribe();
    };
  }, [symbol, timeframe]);

  const currentInst = instruments.find((i) => i.symbol === symbol) || {
    id: '1',
    symbol: symbol,
    baseAsset: symbol.replace('USDT', ''),
    quoteAsset: 'USDT',
    marketType: 'spot' as const,
    isActive: true,
    price: livePrice || 82130,
    change24h: 1.45,
    high24h: 82634,
    low24h: 79800,
    volume24h: 17485,
    sparkline: [],
  };

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
            <span style={{ fontSize: 18, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-primary)' }}>
              ${(livePrice || currentInst.price) < 1 ? (livePrice || currentInst.price).toFixed(4) : (livePrice || currentInst.price).toLocaleString()}
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

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--accent-teal)',
                boxShadow: '0 0 6px var(--accent-teal)',
                display: 'inline-block',
              }}
            />
            <span style={{ color: 'var(--accent-teal)', fontWeight: 600 }}>BINANCE REAL-TIME STREAM</span>
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
              <span style={{ color: 'var(--accent-teal)' }}>Patterns ({patterns.length})</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={indicators.forecast}
                onChange={(e) => setIndicators({ ...indicators, forecast: e.target.checked })}
              />
              <span style={{ color: '#10b981' }}>Forecast Fan</span>
            </label>

            <div style={{ width: 1, height: 16, background: 'var(--bg-border)', margin: '0 2px' }} />

            {/* Auto Demo Trade ON/OFF Toggle Button */}
            <button
              onClick={() => setAutoTrade(!isAutoTradeEnabled)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '3px 10px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: isAutoTradeEnabled ? 'rgba(0, 201, 167, 0.18)' : 'rgba(255, 255, 255, 0.05)',
                color: isAutoTradeEnabled ? 'var(--accent-teal)' : 'var(--text-muted)',
                border: `1px solid ${isAutoTradeEnabled ? 'var(--accent-teal)' : 'var(--bg-border)'}`,
              }}
              title="Toggle automatic demo entry placement when pattern entry price is reached"
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: isAutoTradeEnabled ? 'var(--accent-teal)' : '#6b7280',
                  boxShadow: isAutoTradeEnabled ? '0 0 6px var(--accent-teal)' : 'none',
                }}
              />
              ⚡ Auto Demo Trades: {isAutoTradeEnabled ? 'ON' : 'OFF'}
            </button>

            {/* Link to Accuracy Page */}
            <Link
              href="/demo-trades"
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: 'var(--accent-teal)',
                textDecoration: 'none',
                padding: '3px 8px',
                borderRadius: 4,
                background: 'rgba(0, 201, 167, 0.08)',
                border: '1px solid rgba(0, 201, 167, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
              title="View full demo trade accuracy, PnL and analytics"
            >
              📊 Accuracy ({stats.winRate}%)
            </Link>
          </div>
        </div>
      </div>

      {/* Main Workspace Body: Chart + Binance Positions Panel + Right Drawer */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 380px', overflow: 'hidden' }}>
        {/* Chart View + Binance Positions Terminal */}
        <div style={{ height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, minHeight: 0 }}>
            <TradingViewChart
              candles={candles}
              patterns={patterns}
              activePattern={selectedPattern}
              onPatternSelect={(p) => setSelectedPattern(p)}
              forecast={activeForecast}
              symbol={symbol}
              timeframe={timeframe}
              showIndicators={indicators}
              onPatternClick={(p) => setSelectedPattern(p)}
              height={480}
            />
          </div>

          {/* Bottom Live Telemetry Row */}
          <div
            style={{
              padding: '4px 14px',
              borderTop: '1px solid var(--bg-border)',
              background: 'var(--bg-card)',
              display: 'flex',
              gap: 16,
              fontSize: 10,
              fontFamily: 'JetBrains Mono, monospace',
              color: 'var(--text-muted)',
              alignItems: 'center',
            }}
          >
            <span>Live Price: <strong style={{ color: 'var(--accent-teal)' }}>${livePrice?.toLocaleString() || '...'}</strong></span>
            <span>24h High: <strong>${currentInst.high24h.toLocaleString()}</strong></span>
            <span>24h Low: <strong>${currentInst.low24h.toLocaleString()}</strong></span>
            <span>24h Vol: <strong>{currentInst.volume24h.toLocaleString()}</strong></span>
            <span>Status: <strong style={{ color: 'var(--accent-teal)' }}>Binance WebSocket Stream Connected</strong></span>
          </div>

          {/* Binance-Style Positions & Orders Terminal Area */}
          <BinancePositionsPanel
            currentSymbol={symbol}
            livePrice={livePrice}
            patterns={patterns}
            onSelectPattern={(p) => setSelectedPattern(p)}
          />
        </div>

        {/* Multi-Tab Right Sidebar: Order Book & Tape | AI Evidence | Patterns */}
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', borderLeft: '1px solid var(--bg-border)' }}>
          {/* Top Panel Tab Bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--bg-border)', background: 'var(--bg-secondary)' }}>
            <button
              onClick={() => setRightPanelTab('depth')}
              style={{
                flex: 1,
                padding: '8px 10px',
                fontSize: 10,
                fontWeight: 700,
                background: rightPanelTab === 'depth' ? 'var(--bg-card)' : 'transparent',
                color: rightPanelTab === 'depth' ? 'var(--accent-teal)' : 'var(--text-muted)',
                border: 'none',
                borderBottom: rightPanelTab === 'depth' ? '2px solid var(--accent-teal)' : '2px solid transparent',
                cursor: 'pointer',
              }}
            >
              Order Book & Tape
            </button>
            <button
              onClick={() => setRightPanelTab('ai')}
              style={{
                flex: 1,
                padding: '8px 10px',
                fontSize: 10,
                fontWeight: 700,
                background: rightPanelTab === 'ai' ? 'var(--bg-card)' : 'transparent',
                color: rightPanelTab === 'ai' ? 'var(--accent-teal)' : 'var(--text-muted)',
                border: 'none',
                borderBottom: rightPanelTab === 'ai' ? '2px solid var(--accent-teal)' : '2px solid transparent',
                cursor: 'pointer',
              }}
            >
              AI Evidence
            </button>
            <button
              onClick={() => setRightPanelTab('patterns')}
              style={{
                flex: 1,
                padding: '8px 8px',
                fontSize: 10,
                fontWeight: 700,
                background: rightPanelTab === 'patterns' ? 'var(--bg-card)' : 'transparent',
                color: rightPanelTab === 'patterns' ? 'var(--accent-teal)' : 'var(--text-muted)',
                border: 'none',
                borderBottom: rightPanelTab === 'patterns' ? '2px solid var(--accent-teal)' : '2px solid transparent',
                cursor: 'pointer',
              }}
            >
              Patterns ({patterns.length})
            </button>
            <button
              onClick={() => setRightPanelTab('demo')}
              style={{
                flex: 1,
                padding: '8px 8px',
                fontSize: 10,
                fontWeight: 700,
                background: rightPanelTab === 'demo' ? 'var(--bg-card)' : 'transparent',
                color: rightPanelTab === 'demo' ? 'var(--accent-teal)' : 'var(--text-muted)',
                border: 'none',
                borderBottom: rightPanelTab === 'demo' ? '2px solid var(--accent-teal)' : '2px solid transparent',
                cursor: 'pointer',
              }}
            >
              Demo Trade {currentDemoTrade ? '●' : '🎯'}
            </button>
          </div>

          {/* Panel Content */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {rightPanelTab === 'depth' && <LiveMarketDepth symbol={symbol} />}
            {rightPanelTab === 'ai' && <AiEvidenceDrawer symbol={symbol} />}
            {rightPanelTab === 'patterns' && (
              <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                  DETECTED REAL-TIME PATTERNS ({patterns.length})
                </div>
                {patterns.map((p) => {
                  const isSelected = selectedPattern?.id === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPattern(p)}
                      className="card"
                      style={{
                        padding: 10,
                        cursor: 'pointer',
                        borderLeft: p.lifecycle === 'confirmed' ? '3px solid var(--accent-teal)' : '3px solid #fbbf24',
                        border: isSelected ? '1.5px solid var(--accent-teal)' : '1px solid var(--bg-border)',
                        background: isSelected ? 'rgba(0, 201, 167, 0.08)' : 'var(--bg-card)',
                        boxShadow: isSelected ? '0 0 12px rgba(0, 201, 167, 0.2)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: isSelected ? 'var(--accent-teal)' : 'var(--text-primary)' }}>
                            {p.typeLabel}
                          </span>
                          {isSelected && (
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 700,
                                padding: '1px 5px',
                                borderRadius: 3,
                                background: 'var(--accent-teal)',
                                color: '#0d0f14',
                              }}
                            >
                              ON CHART
                            </span>
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 3,
                            background: p.lifecycle === 'confirmed' ? 'rgba(0,201,167,0.1)' : 'rgba(251,191,36,0.1)',
                            color: p.lifecycle === 'confirmed' ? 'var(--accent-teal)' : '#fbbf24',
                          }}
                        >
                          {p.lifecycle.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>
                        {p.description}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, fontSize: 9, color: 'var(--text-muted)' }}>
                        <span>Quality: <strong style={{ color: 'var(--accent-teal)' }}>{p.qualityScore}/100</strong></span>
                        {p.triggerPrice && <span>Trigger: <strong>${p.triggerPrice.toLocaleString()}</strong></span>}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPattern(p);
                          }}
                          style={{
                            background: isSelected ? 'var(--accent-teal)' : 'var(--bg-secondary)',
                            color: isSelected ? '#0d0f14' : 'var(--text-primary)',
                            border: '1px solid var(--bg-border)',
                            borderRadius: 3,
                            padding: '2px 6px',
                            fontSize: 9,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {isSelected ? '✓ Active' : 'Apply to Chart'}
                        </button>
                      </div>
                    </div>
                  );
                })}
                {patterns.length === 0 && (
                  <div style={{ padding: 24, textAlign: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
                    Scanning active candle window for P0 patterns...
                  </div>
                )}
              </div>
            )}

            {/* Demo Trading & Pattern Accuracy Panel */}
            {rightPanelTab === 'demo' && (
              <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Balance & Accuracy Banner */}
                <div
                  style={{
                    padding: 12,
                    background: 'var(--bg-secondary)',
                    borderRadius: 6,
                    border: '1px solid var(--bg-border)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Paper Balance
                    </span>
                    <Link
                      href="/demo-trades"
                      style={{ fontSize: 10, color: 'var(--accent-teal)', textDecoration: 'none', fontWeight: 600 }}
                    >
                      Full Accuracy Audit ➔
                    </Link>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-blue)' }}>
                    ${stats.currentBalance.toLocaleString()} USDT
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>
                    <span>
                      Accuracy: <strong style={{ color: 'var(--accent-teal)' }}>{stats.winRate}%</strong>
                    </span>
                    <span>
                      {stats.winningTrades} Wins / {stats.losingTrades} Losses
                    </span>
                  </div>
                </div>

                {/* Auto-Execution Toggle */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: isAutoTradeEnabled ? 'rgba(0, 201, 167, 0.1)' : 'var(--bg-secondary)',
                    border: `1px solid ${isAutoTradeEnabled ? 'var(--accent-teal)' : 'var(--bg-border)'}`,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: isAutoTradeEnabled ? 'var(--accent-teal)' : 'var(--text-primary)' }}>
                      ⚡ Auto-Execute Patterns
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                      Takes entry when price touches trigger
                    </div>
                  </div>
                  <button
                    onClick={() => setAutoTrade(!isAutoTradeEnabled)}
                    style={{
                      padding: '4px 8px',
                      fontSize: 10,
                      fontWeight: 700,
                      borderRadius: 4,
                      background: isAutoTradeEnabled ? 'var(--accent-teal)' : 'var(--bg-card)',
                      color: isAutoTradeEnabled ? '#0d0f14' : 'var(--text-muted)',
                      border: '1px solid var(--bg-border)',
                      cursor: 'pointer',
                    }}
                  >
                    {isAutoTradeEnabled ? 'ACTIVE' : 'OFF'}
                  </button>
                </div>

                {/* Active Open Position for Current Coin */}
                {currentDemoTrade ? (
                  <div
                    style={{
                      padding: 12,
                      background: 'var(--bg-secondary)',
                      borderRadius: 6,
                      border: '1px solid var(--accent-blue)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 3,
                          background: currentDemoTrade.side === 'LONG' ? 'rgba(0,201,167,0.18)' : 'rgba(244,63,94,0.18)',
                          color: currentDemoTrade.side === 'LONG' ? 'var(--accent-teal)' : 'var(--accent-rose)',
                        }}
                      >
                        DEMO {currentDemoTrade.side} POSITION
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: currentDemoTrade.unrealizedPnl >= 0 ? 'var(--accent-teal)' : 'var(--accent-rose)',
                        }}
                      >
                        {currentDemoTrade.unrealizedPnl >= 0 ? '+' : ''}${currentDemoTrade.unrealizedPnl.toFixed(2)} ({currentDemoTrade.unrealizedPnl >= 0 ? '+' : ''}{currentDemoTrade.unrealizedPnlPercent.toFixed(2)}%)
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 10, color: 'var(--text-secondary)', marginBottom: 10 }}>
                      <div>Entry: <strong>${currentDemoTrade.entryPrice.toLocaleString()}</strong></div>
                      <div>Live: <strong>${currentDemoTrade.currentPrice.toLocaleString()}</strong></div>
                      <div>Target (TP): <strong style={{ color: 'var(--accent-teal)' }}>${currentDemoTrade.takeProfit.toLocaleString()}</strong></div>
                      <div>Stop Loss: <strong style={{ color: 'var(--accent-rose)' }}>${currentDemoTrade.stopLoss.toLocaleString()}</strong></div>
                    </div>

                    <button
                      onClick={() => closeTrade(currentDemoTrade.id, currentDemoTrade.currentPrice, 'MANUAL')}
                      className="btn btn-ghost"
                      style={{
                        width: '100%',
                        fontSize: 11,
                        color: 'var(--accent-rose)',
                        borderColor: 'var(--accent-rose)',
                        justifyContent: 'center',
                      }}
                    >
                      Close Demo Position at Market
                    </button>
                  </div>
                ) : (
                  /* Binance-Style Order Placement Terminal */
                  <div
                    style={{
                      padding: 12,
                      background: 'var(--bg-secondary)',
                      borderRadius: 6,
                      border: '1px solid var(--bg-border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-primary)' }}>
                        BINANCE DEMO TRADE TERMINAL
                      </span>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: 3,
                          background: 'rgba(0,201,167,0.15)',
                          color: 'var(--accent-teal)',
                        }}
                      >
                        PAPER USDT FUTURES
                      </span>
                    </div>

                    {/* Leverage Selector (Binance Style) */}
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
                        Leverage Mode: <strong>Cross {leverage}x</strong>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {[1, 5, 10, 20, 50].map((lev) => (
                          <button
                            key={lev}
                            onClick={() => setLeverage(lev)}
                            style={{
                              flex: 1,
                              padding: '3px 0',
                              fontSize: 10,
                              fontWeight: 700,
                              borderRadius: 4,
                              background: leverage === lev ? 'var(--accent-teal)' : 'var(--bg-card)',
                              color: leverage === lev ? '#0d0f14' : 'var(--text-secondary)',
                              border: `1px solid ${leverage === lev ? 'var(--accent-teal)' : 'var(--bg-border)'}`,
                              cursor: 'pointer',
                            }}
                          >
                            {lev}x
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Margin Size Selector Chips */}
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
                        Margin Size: <strong>${defaultTradeSize.toLocaleString()} USDT</strong> (Position Value: $
                        {(defaultTradeSize * leverage).toLocaleString()} USDT)
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {[500, 1000, 2500, 5000].map((sz) => (
                          <button
                            key={sz}
                            onClick={() => setDefaultTradeSize(sz)}
                            style={{
                              flex: 1,
                              padding: '3px 0',
                              fontSize: 10,
                              fontWeight: 700,
                              borderRadius: 4,
                              background: defaultTradeSize === sz ? 'rgba(56, 189, 248, 0.2)' : 'var(--bg-card)',
                              color: defaultTradeSize === sz ? 'var(--accent-blue)' : 'var(--text-secondary)',
                              border: `1px solid ${
                                defaultTradeSize === sz ? 'var(--accent-blue)' : 'var(--bg-border)'
                              }`,
                              cursor: 'pointer',
                            }}
                          >
                            ${sz}
                          </button>
                        ))}
                      </div>
                    </div>

                    {(() => {
                      const activePat = selectedPattern || (patterns.length > 0 ? patterns[0] : null);

                      if (activePat) {
                        const isBull =
                          activePat.triggerPrice && activePat.invalidationPrice
                            ? activePat.triggerPrice >= activePat.invalidationPrice
                            : true;
                        const risk =
                          activePat.triggerPrice && activePat.invalidationPrice
                            ? Math.abs(activePat.triggerPrice - activePat.invalidationPrice)
                            : (livePrice || 50000) * 0.015;
                        const tp = isBull
                          ? (activePat.triggerPrice || (livePrice || 50000)) + risk * 1.8
                          : (activePat.triggerPrice || (livePrice || 50000)) - risk * 1.8;
                        const sl =
                          activePat.invalidationPrice ||
                          (isBull ? (livePrice || 50000) - risk : (livePrice || 50000) + risk);

                        return (
                          <div
                            style={{
                              padding: 10,
                              borderRadius: 6,
                              background: 'rgba(0,0,0,0.2)',
                              border: '1px solid var(--bg-border)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 6,
                              fontSize: 10,
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Active Pattern:</span>
                              <strong style={{ color: 'var(--accent-teal)' }}>
                                {activePat.typeLabel} ({activePat.qualityScore}%)
                              </strong>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Marked Entry Trigger:</span>
                              <strong style={{ color: 'var(--text-primary)' }}>
                                ${(activePat.triggerPrice || livePrice || 0).toLocaleString()}
                              </strong>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Target 1 (1:1.8 R:R):</span>
                              <strong style={{ color: 'var(--accent-teal)' }}>
                                ${Number(tp.toFixed(2)).toLocaleString()}
                              </strong>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Stop Loss:</span>
                              <strong style={{ color: '#f43f5e' }}>
                                ${Number(sl.toFixed(2)).toLocaleString()}
                              </strong>
                            </div>

                            {/* 1-Click Auto Take Entry Buttons */}
                            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                              <button
                                onClick={() => {
                                  openTrade({
                                    symbol,
                                    side: 'LONG',
                                    entryPrice: activePat.triggerPrice || livePrice || 50000,
                                    stopLoss: Number(sl.toFixed(2)),
                                    takeProfit: Number(tp.toFixed(2)),
                                    patternName: activePat.typeLabel,
                                    patternQuality: activePat.qualityScore,
                                    patternId: activePat.id,
                                    leverage,
                                    tradeSize: defaultTradeSize,
                                  });
                                }}
                                style={{
                                  flex: 1,
                                  padding: '8px 6px',
                                  borderRadius: 4,
                                  background: 'var(--accent-teal)',
                                  color: '#0d0f14',
                                  border: 'none',
                                  fontWeight: 800,
                                  fontSize: 11,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  gap: 2,
                                }}
                              >
                                <span>⚡ AUTO BUY / LONG</span>
                                <span style={{ fontSize: 9, opacity: 0.85 }}>Entry @ ${(activePat.triggerPrice || livePrice || 0).toLocaleString()}</span>
                              </button>

                              <button
                                onClick={() => {
                                  openTrade({
                                    symbol,
                                    side: 'SHORT',
                                    entryPrice: activePat.triggerPrice || livePrice || 50000,
                                    stopLoss: Number(sl.toFixed(2)),
                                    takeProfit: Number(tp.toFixed(2)),
                                    patternName: activePat.typeLabel,
                                    patternQuality: activePat.qualityScore,
                                    patternId: activePat.id,
                                    leverage,
                                    tradeSize: defaultTradeSize,
                                  });
                                }}
                                style={{
                                  flex: 1,
                                  padding: '8px 6px',
                                  borderRadius: 4,
                                  background: '#f43f5e',
                                  color: '#ffffff',
                                  border: 'none',
                                  fontWeight: 800,
                                  fontSize: 11,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  gap: 2,
                                }}
                              >
                                <span>⚡ AUTO SELL / SHORT</span>
                                <span style={{ fontSize: 9, opacity: 0.85 }}>Entry @ ${(activePat.triggerPrice || livePrice || 0).toLocaleString()}</span>
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', padding: 12 }}>
                          No active pattern selected. Select a pattern from the Patterns tab or click on the chart.
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
