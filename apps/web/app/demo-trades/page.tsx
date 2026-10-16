'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useDemoTrade } from '@/store/useDemoTrade';

export default function DemoTradesPage() {
  const {
    balance,
    openTrades,
    closedTrades,
    stats,
    isAutoTradeEnabled,
    defaultTradeSize,
    setAutoTrade,
    setDefaultTradeSize,
    closeTrade,
    resetAccount,
  } = useDemoTrade();

  const [filterResult, setFilterResult] = useState<'ALL' | 'WIN' | 'LOSS'>('ALL');
  const [filterSymbol, setFilterSymbol] = useState<string>('ALL');
  const [confirmReset, setConfirmReset] = useState(false);

  const filteredClosedTrades = closedTrades.filter((t) => {
    if (filterResult !== 'ALL' && t.result !== filterResult) return false;
    if (filterSymbol !== 'ALL' && t.symbol !== filterSymbol) return false;
    return true;
  });

  const uniqueSymbols = Array.from(new Set(closedTrades.map((t) => t.symbol)));

  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Page Header */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 14,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '-0.3px' }}>
              Demo Trading & Pattern Accuracy Engine
            </h1>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 4,
                background: isAutoTradeEnabled ? 'rgba(0, 201, 167, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                color: isAutoTradeEnabled ? 'var(--accent-teal)' : 'var(--accent-rose)',
                border: `1px solid ${isAutoTradeEnabled ? 'var(--accent-teal)' : 'var(--accent-rose)'}`,
              }}
            >
              {isAutoTradeEnabled ? '● AUTO-EXECUTION ACTIVE' : '○ MANUAL ONLY'}
            </span>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Simulated paper execution tracking pattern hit-rate accuracy against 100% real-time Binance prices.
          </p>
        </div>

        {/* Global Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Auto Trade Switch */}
          <button
            onClick={() => setAutoTrade(!isAutoTradeEnabled)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 6,
              background: isAutoTradeEnabled ? 'rgba(0, 201, 167, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${isAutoTradeEnabled ? 'var(--accent-teal)' : 'var(--bg-border)'}`,
              color: isAutoTradeEnabled ? 'var(--accent-teal)' : 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <span>{isAutoTradeEnabled ? '⚡' : '⏸'}</span>
            <span>Auto-Execute Patterns: {isAutoTradeEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* Trade Size Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
            <span>Size:</span>
            <select
              value={defaultTradeSize}
              onChange={(e) => setDefaultTradeSize(Number(e.target.value))}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--bg-border)',
                borderRadius: 4,
                padding: '4px 8px',
                color: 'var(--text-primary)',
                fontSize: 11,
              }}
            >
              <option value={500}>$500 USDT</option>
              <option value={1000}>$1,000 USDT</option>
              <option value={2000}>$2,000 USDT</option>
              <option value={5000}>$5,000 USDT</option>
            </select>
          </div>

          {/* Reset Account Button */}
          {confirmReset ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => {
                  resetAccount();
                  setConfirmReset(false);
                }}
                className="btn btn-primary"
                style={{ fontSize: 11, padding: '4px 10px', background: 'var(--accent-rose)', borderColor: 'var(--accent-rose)' }}
              >
                Confirm Reset ($10,000)
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="btn btn-ghost"
                style={{ fontSize: 11, padding: '4px 8px' }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              className="btn btn-ghost"
              style={{ fontSize: 11, padding: '4px 10px' }}
              title="Reset balance to $10,000 USDT"
            >
              ↺ Reset Balance
            </button>
          )}

          <Link
            href="/workspace"
            className="btn btn-primary"
            style={{ fontSize: 11, textDecoration: 'none', padding: '6px 12px' }}
          >
            Go to Workspace ➔
          </Link>
        </div>
      </div>

      {/* Top Telemetry & Accuracy Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
        {/* Pattern Accuracy Card */}
        <div
          className="card"
          style={{
            padding: '16px',
            borderTop: '3px solid var(--accent-teal)',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Overall Pattern Accuracy
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-teal)', lineHeight: 1.2 }}>
            {stats.winRate}%
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            <strong>{stats.winningTrades} Wins</strong> / {stats.losingTrades} Losses ({stats.closedTrades} closed)
          </div>
          {/* Win/Loss Bar */}
          <div style={{ height: 6, background: 'rgba(244, 63, 94, 0.3)', borderRadius: 3, marginTop: 6, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${stats.winRate}%`,
                background: 'var(--accent-teal)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* Realized PnL Card */}
        <div
          className="card"
          style={{
            padding: '16px',
            borderTop: `3px solid ${stats.totalRealizedPnl >= 0 ? 'var(--accent-teal)' : 'var(--accent-rose)'}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Total Realized PnL
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: stats.totalRealizedPnl >= 0 ? 'var(--accent-teal)' : 'var(--accent-rose)',
              lineHeight: 1.2,
            }}
          >
            {stats.totalRealizedPnl >= 0 ? '+' : ''}${stats.totalRealizedPnl.toLocaleString()}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            Return: <strong style={{ color: stats.totalRealizedPnl >= 0 ? 'var(--accent-teal)' : 'var(--accent-rose)' }}>
              {stats.totalRealizedPnl >= 0 ? '+' : ''}{stats.totalRealizedPnlPercent}%
            </strong> on starting $10,000
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
            Gains: +${stats.totalGains.toFixed(0)} | Losses: -${stats.totalLosses.toFixed(0)}
          </div>
        </div>

        {/* Paper Balance Card */}
        <div
          className="card"
          style={{
            padding: '16px',
            borderTop: '3px solid var(--accent-blue)',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Simulated Account Equity
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-blue)', lineHeight: 1.2 }}>
            ${stats.currentBalance.toLocaleString()}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            Active Open Trades: <strong>{openTrades.length} positions</strong>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
            Risk per trade: ${(defaultTradeSize).toLocaleString()} USDT
          </div>
        </div>

        {/* Profit Factor & R:R */}
        <div
          className="card"
          style={{
            padding: '16px',
            borderTop: '3px solid #fbbf24',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Profit Factor & R:R Ratio
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#fbbf24', lineHeight: 1.2 }}>
            {stats.profitFactor}x
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            Target R:R: <strong style={{ color: '#fbbf24' }}>1 : 1.80</strong> (Take Profit vs Stop Loss)
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
            Causal loss-first bar ambiguity resolution
          </div>
        </div>
      </div>

      {/* Active Open Positions Section */}
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>ACTIVE OPEN POSITIONS ({openTrades.length})</div>
            {openTrades.length > 0 && (
              <span className="badge badge-bull" style={{ fontSize: 9 }}>LIVE STREAMING</span>
            )}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Evaluated against real Binance ticks every 500ms
          </div>
        </div>

        {openTrades.length === 0 ? (
          <div
            style={{
              padding: '24px 16px',
              textAlign: 'center',
              background: 'var(--bg-secondary)',
              borderRadius: 6,
              border: '1px dashed var(--bg-border)',
            }}
          >
            <div style={{ fontSize: 20, marginBottom: 6 }}>📡</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
              No Active Open Positions Right Now
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              {isAutoTradeEnabled
                ? 'Auto-Execution is active. As soon as any monitored coin hits a pattern trigger price, an entry will be opened automatically.'
                : 'Auto-Execution is turned off. Turn it on above or enter a demo trade manually from the Coin Workspace.'}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', fontSize: 11 }}>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Side</th>
                  <th>Trigger Pattern</th>
                  <th>Entry Price</th>
                  <th>Current Price</th>
                  <th>Target (TP 1:1.8)</th>
                  <th>Stop Loss</th>
                  <th>Allocated</th>
                  <th>Live PnL</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {openTrades.map((trade) => {
                  const isLong = trade.side === 'LONG';
                  const isProfitable = trade.unrealizedPnl >= 0;
                  return (
                    <tr key={trade.id}>
                      <td style={{ fontWeight: 700 }}>
                        <Link
                          href={`/workspace?symbol=${trade.symbol}`}
                          style={{ color: 'var(--accent-teal)', textDecoration: 'none' }}
                        >
                          {trade.symbol} ↗
                        </Link>
                      </td>
                      <td>
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: 3,
                            fontSize: 10,
                            fontWeight: 700,
                            background: isLong ? 'rgba(0, 201, 167, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                            color: isLong ? 'var(--accent-teal)' : 'var(--accent-rose)',
                          }}
                        >
                          {trade.side}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{trade.patternName}</td>
                      <td>${trade.entryPrice.toLocaleString()}</td>
                      <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        ${trade.currentPrice.toLocaleString()}
                      </td>
                      <td style={{ color: 'var(--accent-teal)' }}>${trade.takeProfit.toLocaleString()}</td>
                      <td style={{ color: 'var(--accent-rose)' }}>${trade.stopLoss.toLocaleString()}</td>
                      <td style={{ color: 'var(--text-muted)' }}>${trade.allocatedUsdt.toLocaleString()}</td>
                      <td>
                        <span
                          style={{
                            fontWeight: 700,
                            color: isProfitable ? 'var(--accent-teal)' : 'var(--accent-rose)',
                          }}
                        >
                          {isProfitable ? '+' : ''}${trade.unrealizedPnl.toFixed(2)} ({isProfitable ? '+' : ''}
                          {trade.unrealizedPnlPercent.toFixed(2)}%)
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => closeTrade(trade.id, trade.currentPrice, 'MANUAL')}
                          className="btn btn-ghost"
                          style={{
                            fontSize: 10,
                            padding: '2px 8px',
                            color: 'var(--accent-rose)',
                            border: '1px solid var(--accent-rose)',
                          }}
                        >
                          Close Now
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Closed Trades & Accuracy History Section */}
      <div className="card" style={{ padding: 16 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14,
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>
              CLOSED TRADES & ACCURACY AUDIT LOG ({closedTrades.length})
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              Verifiable paper execution records with causal timestamp logging
            </div>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Filter by Result */}
            <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: 4, padding: 2 }}>
              {(['ALL', 'WIN', 'LOSS'] as const).map((res) => (
                <button
                  key={res}
                  onClick={() => setFilterResult(res)}
                  style={{
                    padding: '3px 8px',
                    fontSize: 10,
                    fontWeight: 600,
                    border: 'none',
                    borderRadius: 3,
                    background: filterResult === res ? 'var(--bg-card)' : 'transparent',
                    color:
                      filterResult === res
                        ? res === 'WIN'
                          ? 'var(--accent-teal)'
                          : res === 'LOSS'
                          ? 'var(--accent-rose)'
                          : 'var(--text-primary)'
                        : 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  {res}
                </button>
              ))}
            </div>

            {/* Filter by Coin */}
            {uniqueSymbols.length > 0 && (
              <select
                value={filterSymbol}
                onChange={(e) => setFilterSymbol(e.target.value)}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--bg-border)',
                  borderRadius: 4,
                  padding: '3px 8px',
                  color: 'var(--text-primary)',
                  fontSize: 10,
                }}
              >
                <option value="ALL">All Coins ({uniqueSymbols.length})</option>
                {uniqueSymbols.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {filteredClosedTrades.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 11 }}>
            No trades match the selected filter.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', fontSize: 11 }}>
              <thead>
                <tr>
                  <th>Result</th>
                  <th>Symbol</th>
                  <th>Pattern Strategy</th>
                  <th>Side</th>
                  <th>Entry Price</th>
                  <th>Exit Price</th>
                  <th>Exit Reason</th>
                  <th>Target TP</th>
                  <th>Stop Loss</th>
                  <th>Net PnL</th>
                  <th>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredClosedTrades.map((t) => {
                  const isWin = t.result === 'WIN';
                  const exitPrice = t.exitPrice ?? t.currentPrice;
                  const isLong = t.side === 'LONG';
                  const pnl = isLong
                    ? (exitPrice - t.entryPrice) * t.quantity
                    : (t.entryPrice - exitPrice) * t.quantity;
                  const pnlPercent = isLong
                    ? ((exitPrice - t.entryPrice) / t.entryPrice) * 100
                    : ((t.entryPrice - exitPrice) / t.entryPrice) * 100;

                  return (
                    <tr key={t.id}>
                      <td>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 3,
                            fontSize: 10,
                            fontWeight: 800,
                            background: isWin ? 'rgba(0, 201, 167, 0.18)' : 'rgba(244, 63, 94, 0.18)',
                            color: isWin ? 'var(--accent-teal)' : 'var(--accent-rose)',
                            border: `1px solid ${isWin ? 'var(--accent-teal)' : 'var(--accent-rose)'}`,
                          }}
                        >
                          {isWin ? '✓ WIN' : '✗ LOSS'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700 }}>{t.symbol}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{t.patternName}</div>
                        {t.patternQuality && (
                          <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                            Quality score: {t.patternQuality}%
                          </div>
                        )}
                      </td>
                      <td>
                        <span
                          style={{
                            padding: '1px 5px',
                            borderRadius: 2,
                            fontSize: 9,
                            fontWeight: 700,
                            background: isLong ? 'rgba(0, 201, 167, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                            color: isLong ? 'var(--accent-teal)' : 'var(--accent-rose)',
                          }}
                        >
                          {t.side}
                        </span>
                      </td>
                      <td>${t.entryPrice.toLocaleString()}</td>
                      <td style={{ fontWeight: 700 }}>${exitPrice.toLocaleString()}</td>
                      <td>
                        <span
                          style={{
                            fontSize: 10,
                            color:
                              t.exitReason === 'TAKE_PROFIT'
                                ? 'var(--accent-teal)'
                                : t.exitReason === 'STOP_LOSS'
                                ? 'var(--accent-rose)'
                                : 'var(--text-secondary)',
                          }}
                        >
                          {t.exitReason === 'TAKE_PROFIT'
                            ? '🎯 Take Profit Hit'
                            : t.exitReason === 'STOP_LOSS'
                            ? '🛑 Stop Loss Hit'
                            : '✋ Manual Exit'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--accent-teal)' }}>${t.takeProfit.toLocaleString()}</td>
                      <td style={{ color: 'var(--accent-rose)' }}>${t.stopLoss.toLocaleString()}</td>
                      <td style={{ fontWeight: 700, color: isWin ? 'var(--accent-teal)' : 'var(--accent-rose)' }}>
                        {isWin ? '+' : ''}${pnl.toFixed(2)} ({isWin ? '+' : ''}{pnlPercent.toFixed(2)}%)
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 10 }}>
                        {new Date(t.exitTime || t.entryTime).toLocaleDateString()}{' '}
                        {new Date(t.exitTime || t.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
