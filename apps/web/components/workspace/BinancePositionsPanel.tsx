'use client';

import React, { useState } from 'react';
import { useDemoTrade } from '@/store/useDemoTrade';
import { PatternItem } from '@/lib/api';

interface BinancePositionsPanelProps {
  currentSymbol: string;
  livePrice?: number | null;
  patterns?: PatternItem[];
  onSelectPattern?: (pattern: PatternItem) => void;
}

export function BinancePositionsPanel({
  currentSymbol,
  livePrice,
  patterns = [],
  onSelectPattern,
}: BinancePositionsPanelProps) {
  const { openTrades, closedTrades, stats, closeTrade, closeAllTrades, openTrade, defaultTradeSize } =
    useDemoTrade();

  const [activeTab, setActiveTab] = useState<'positions' | 'triggers' | 'history'>('positions');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  return (
    <div
      style={{
        borderTop: '1px solid var(--bg-border)',
        background: 'var(--bg-card)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Inter, -apple-system, sans-serif',
      }}
    >
      {/* Binance Header Bar: Tabs + Account Margin Equity + Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--bg-border)',
          height: 38,
          fontSize: 11,
        }}
      >
        {/* Left Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', height: '100%', gap: 4 }}>
          <button
            onClick={() => setActiveTab('positions')}
            style={{
              height: '100%',
              padding: '0 12px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'positions' ? '2px solid var(--accent-teal)' : '2px solid transparent',
              color: activeTab === 'positions' ? 'var(--accent-teal)' : 'var(--text-muted)',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>Positions</span>
            <span
              style={{
                fontSize: 10,
                padding: '1px 5px',
                borderRadius: 10,
                background: openTrades.length > 0 ? 'var(--accent-teal)' : 'var(--bg-border)',
                color: openTrades.length > 0 ? '#0d0f14' : 'var(--text-muted)',
                fontWeight: 800,
              }}
            >
              {openTrades.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('triggers')}
            style={{
              height: '100%',
              padding: '0 12px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'triggers' ? '2px solid var(--accent-teal)' : '2px solid transparent',
              color: activeTab === 'triggers' ? 'var(--accent-teal)' : 'var(--text-muted)',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>Marked Pattern Triggers</span>
            <span
              style={{
                fontSize: 10,
                padding: '1px 5px',
                borderRadius: 10,
                background: 'rgba(56, 189, 248, 0.15)',
                color: 'var(--accent-blue)',
                fontWeight: 700,
              }}
            >
              {patterns.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            style={{
              height: '100%',
              padding: '0 12px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'history' ? '2px solid var(--accent-teal)' : '2px solid transparent',
              color: activeTab === 'history' ? 'var(--accent-teal)' : 'var(--text-muted)',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>Trade History</span>
            <span
              style={{
                fontSize: 10,
                padding: '1px 5px',
                borderRadius: 10,
                background: 'var(--bg-border)',
                color: 'var(--text-muted)',
              }}
            >
              {closedTrades.length}
            </span>
          </button>
        </div>

        {/* Right Account Telemetry (Binance Futures style) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 11 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'var(--text-muted)' }}>Equity:</span>
            <strong style={{ color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
              ${stats.currentBalance.toLocaleString()} USDT
            </strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'var(--text-muted)' }}>Margin Used:</span>
            <strong style={{ color: '#fbbf24', fontFamily: 'JetBrains Mono, monospace' }}>
              ${stats.marginUsed.toLocaleString()} USDT
            </strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'var(--text-muted)' }}>Available:</span>
            <strong style={{ color: 'var(--accent-teal)', fontFamily: 'JetBrains Mono, monospace' }}>
              ${stats.availableBalance.toLocaleString()} USDT
            </strong>
          </div>

          {openTrades.length > 0 && (
            <button
              onClick={() => closeAllTrades()}
              style={{
                background: 'rgba(244, 63, 94, 0.12)',
                border: '1px solid rgba(244, 63, 94, 0.4)',
                color: '#f43f5e',
                borderRadius: 4,
                padding: '2px 8px',
                fontSize: 10,
                fontWeight: 700,
                cursor: 'pointer',
              }}
              title="Close all open demo trades immediately at market prices"
            >
              Close All ({openTrades.length})
            </button>
          )}

          {/* Collapse/Expand Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 12,
              padding: '2px 4px',
            }}
            title={isCollapsed ? 'Expand Trading Area' : 'Collapse Trading Area'}
          >
            {isCollapsed ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Collapsible Panel Content */}
      {!isCollapsed && (
        <div style={{ minHeight: 140, maxHeight: 220, overflowY: 'auto' }}>
          {/* TAB 1: POSITIONS TABLE (Exact Binance Futures Layout) */}
          {activeTab === 'positions' && (
            <>
              {openTrades.length === 0 ? (
                <div
                  style={{
                    padding: '36px 20px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 24 }}>⚡</span>
                  <div>
                    No Open Positions. Click <strong>⚡ Auto-Take Entry</strong> on any chart pattern to start a demo position.
                  </div>
                </div>
              ) : (
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: 11,
                    textAlign: 'left',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        color: 'var(--text-muted)',
                        borderBottom: '1px solid var(--bg-border)',
                        background: 'rgba(0,0,0,0.15)',
                        fontSize: 10,
                        textTransform: 'uppercase',
                      }}
                    >
                      <th style={{ padding: '8px 12px' }}>Symbol</th>
                      <th style={{ padding: '8px 12px' }}>Size</th>
                      <th style={{ padding: '8px 12px' }}>Entry Price</th>
                      <th style={{ padding: '8px 12px' }}>Mark Price</th>
                      <th style={{ padding: '8px 12px' }}>Liq. Price</th>
                      <th style={{ padding: '8px 12px' }}>Margin</th>
                      <th style={{ padding: '8px 12px' }}>PNL (ROE %)</th>
                      <th style={{ padding: '8px 12px' }}>TP / SL (Marked)</th>
                      <th style={{ padding: '8px 12px' }}>Pattern Source</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openTrades.map((trade) => {
                      const isLong = trade.side === 'LONG';
                      const pnlColor = trade.unrealizedPnl >= 0 ? '#00c9a7' : '#f43f5e';
                      const pnlBg = trade.unrealizedPnl >= 0 ? 'rgba(0, 201, 167, 0.1)' : 'rgba(244, 63, 94, 0.1)';

                      return (
                        <tr
                          key={trade.id}
                          style={{
                            borderBottom: '1px solid var(--bg-border)',
                            transition: 'background 0.15s ease',
                          }}
                        >
                          {/* Symbol & Direction Badge */}
                          <td style={{ padding: '8px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span
                                style={{
                                  fontSize: 9,
                                  fontWeight: 800,
                                  padding: '1px 5px',
                                  borderRadius: 3,
                                  background: isLong ? 'rgba(0, 201, 167, 0.2)' : 'rgba(244, 63, 94, 0.2)',
                                  color: isLong ? 'var(--accent-teal)' : '#f43f5e',
                                }}
                              >
                                {trade.side} {trade.leverage || 10}x
                              </span>
                              <strong style={{ color: 'var(--text-primary)' }}>{trade.symbol}</strong>
                              <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>Perp</span>
                            </div>
                          </td>

                          {/* Size */}
                          <td style={{ padding: '8px 12px' }}>
                            <div>${(trade.allocatedUsdt * (trade.leverage || 10)).toLocaleString()}</div>
                            <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                              {trade.quantity} {trade.symbol.replace('USDT', '')}
                            </div>
                          </td>

                          {/* Entry Price */}
                          <td style={{ padding: '8px 12px', color: 'var(--text-primary)' }}>
                            ${trade.entryPrice.toLocaleString()}
                          </td>

                          {/* Live Mark Price */}
                          <td style={{ padding: '8px 12px', color: 'var(--accent-blue)', fontWeight: 700 }}>
                            ${trade.currentPrice.toLocaleString()}
                          </td>

                          {/* Liquidation Price */}
                          <td style={{ padding: '8px 12px', color: '#fbbf24' }}>
                            ${(trade.liquidationPrice || trade.stopLoss).toLocaleString()}
                          </td>

                          {/* Margin */}
                          <td style={{ padding: '8px 12px' }}>
                            <div>${trade.allocatedUsdt.toLocaleString()} USDT</div>
                            <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Cross</div>
                          </td>

                          {/* PNL (ROE %) */}
                          <td style={{ padding: '8px 12px' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                borderRadius: 4,
                                background: pnlBg,
                                color: pnlColor,
                                fontWeight: 800,
                              }}
                            >
                              {trade.unrealizedPnl >= 0 ? '+' : ''}${trade.unrealizedPnl.toFixed(2)} (
                              {trade.unrealizedPnl >= 0 ? '+' : ''}
                              {trade.unrealizedPnlPercent.toFixed(2)}%)
                            </span>
                          </td>

                          {/* TP / SL */}
                          <td style={{ padding: '8px 12px' }}>
                            <div style={{ color: 'var(--accent-teal)', fontSize: 10 }}>
                              TP: ${trade.takeProfit.toLocaleString()}
                            </div>
                            <div style={{ color: '#f43f5e', fontSize: 10 }}>
                              SL: ${trade.stopLoss.toLocaleString()}
                            </div>
                          </td>

                          {/* Pattern Source */}
                          <td style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontSize: 10 }}>
                            <div>{trade.patternName}</div>
                            {trade.patternQuality && (
                              <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                                Quality: {trade.patternQuality}%
                              </div>
                            )}
                          </td>

                          {/* Action Market Close */}
                          <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                            <button
                              onClick={() => closeTrade(trade.id, trade.currentPrice, 'MANUAL')}
                              style={{
                                background: 'rgba(244, 63, 94, 0.15)',
                                border: '1px solid var(--accent-rose)',
                                color: 'var(--accent-rose)',
                                borderRadius: 4,
                                padding: '3px 10px',
                                fontSize: 10,
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                              title="Close this demo position immediately at current mark price"
                            >
                              Market Close
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </>
          )}

          {/* TAB 2: MARKED PATTERN TRIGGERS (1-Click Auto Entry on Marked Levels) */}
          {activeTab === 'triggers' && (
            <div style={{ padding: 12 }}>
              {patterns.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: 12 }}>
                  No active patterns detected on current timeframe.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
                  {patterns.map((pat) => {
                    const isBull = pat.triggerPrice && pat.invalidationPrice ? pat.triggerPrice >= pat.invalidationPrice : true;
                    const risk = pat.triggerPrice && pat.invalidationPrice ? Math.abs(pat.triggerPrice - pat.invalidationPrice) : 100;
                    const tp = isBull ? (pat.triggerPrice || (livePrice || 50000)) + risk * 1.8 : (pat.triggerPrice || (livePrice || 50000)) - risk * 1.8;
                    const sl = pat.invalidationPrice || (isBull ? (livePrice || 50000) - risk : (livePrice || 50000) + risk);

                    return (
                      <div
                        key={pat.id}
                        style={{
                          padding: 10,
                          borderRadius: 6,
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--bg-border)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ color: 'var(--text-primary)', fontSize: 12 }}>
                            {pat.typeLabel || pat.type}
                          </strong>
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              padding: '1px 6px',
                              borderRadius: 3,
                              background: isBull ? 'rgba(0, 201, 167, 0.2)' : 'rgba(244, 63, 94, 0.2)',
                              color: isBull ? 'var(--accent-teal)' : '#f43f5e',
                            }}
                          >
                            {isBull ? 'BULLISH' : 'BEARISH'} · {pat.qualityScore}%
                          </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}>
                          <div>Marked Entry: <strong>${(pat.triggerPrice || livePrice || 0).toLocaleString()}</strong></div>
                          <div>Target 1: <strong style={{ color: 'var(--accent-teal)' }}>${Number(tp.toFixed(2)).toLocaleString()}</strong></div>
                          <div>Stop Loss: <strong style={{ color: '#f43f5e' }}>${Number(sl.toFixed(2)).toLocaleString()}</strong></div>
                          <div>R:R: <strong style={{ color: 'var(--accent-teal)' }}>1:1.8</strong></div>
                        </div>

                        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                          <button
                            onClick={() => {
                              onSelectPattern?.(pat);
                              openTrade({
                                symbol: currentSymbol,
                                side: isBull ? 'LONG' : 'SHORT',
                                entryPrice: pat.triggerPrice || livePrice || 50000,
                                stopLoss: Number(sl.toFixed(2)),
                                takeProfit: Number(tp.toFixed(2)),
                                patternName: pat.typeLabel || pat.type,
                                patternQuality: pat.qualityScore,
                                patternId: pat.id,
                                leverage: 10,
                                tradeSize: defaultTradeSize,
                              });
                            }}
                            className="btn btn-primary"
                            style={{
                              flex: 1,
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '4px 8px',
                              background: isBull ? 'var(--accent-teal)' : 'var(--accent-rose)',
                              borderColor: isBull ? 'var(--accent-teal)' : 'var(--accent-rose)',
                              justifyContent: 'center',
                            }}
                          >
                            ⚡ Auto-Take Entry from Pattern ({isBull ? 'BUY LONG' : 'SELL SHORT'})
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TRADE HISTORY */}
          {activeTab === 'history' && (
            <div style={{ padding: 8 }}>
              {closedTrades.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: 12 }}>
                  No closed trades recorded yet.
                </div>
              ) : (
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: 10,
                    textAlign: 'left',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                >
                  <thead>
                    <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--bg-border)' }}>
                      <th style={{ padding: '6px 10px' }}>Symbol</th>
                      <th style={{ padding: '6px 10px' }}>Side</th>
                      <th style={{ padding: '6px 10px' }}>Entry Price</th>
                      <th style={{ padding: '6px 10px' }}>Exit Price</th>
                      <th style={{ padding: '6px 10px' }}>Exit Reason</th>
                      <th style={{ padding: '6px 10px' }}>Pattern</th>
                      <th style={{ padding: '6px 10px', textAlign: 'right' }}>Result PnL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {closedTrades.slice(0, 10).map((t) => {
                      const isWin = t.result === 'WIN';
                      const pnl =
                        t.side === 'LONG'
                          ? ((t.exitPrice ?? t.currentPrice) - t.entryPrice) * t.quantity
                          : (t.entryPrice - (t.exitPrice ?? t.currentPrice)) * t.quantity;
                      return (
                        <tr key={t.id} style={{ borderBottom: '1px solid var(--bg-border)' }}>
                          <td style={{ padding: '6px 10px', fontWeight: 700 }}>{t.symbol}</td>
                          <td style={{ padding: '6px 10px', color: t.side === 'LONG' ? 'var(--accent-teal)' : '#f43f5e' }}>
                            {t.side}
                          </td>
                          <td style={{ padding: '6px 10px' }}>${t.entryPrice.toLocaleString()}</td>
                          <td style={{ padding: '6px 10px' }}>${(t.exitPrice ?? t.currentPrice).toLocaleString()}</td>
                          <td style={{ padding: '6px 10px' }}>
                            <span
                              style={{
                                padding: '1px 5px',
                                borderRadius: 3,
                                background: t.exitReason === 'TAKE_PROFIT' ? 'rgba(0,201,167,0.15)' : 'rgba(244,63,94,0.15)',
                                color: t.exitReason === 'TAKE_PROFIT' ? 'var(--accent-teal)' : '#f43f5e',
                                fontSize: 9,
                              }}
                            >
                              {t.exitReason}
                            </span>
                          </td>
                          <td style={{ padding: '6px 10px', color: 'var(--text-secondary)' }}>{t.patternName}</td>
                          <td
                            style={{
                              padding: '6px 10px',
                              textAlign: 'right',
                              fontWeight: 800,
                              color: isWin ? 'var(--accent-teal)' : '#f43f5e',
                            }}
                          >
                            {isWin ? '+' : ''}${pnl.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
