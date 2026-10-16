'use client';

import React, { useState } from 'react';
import { DEFAULT_INSTRUMENTS } from '@/lib/api';

interface AlertRule {
  id: string;
  name: string;
  symbol: string;
  type: 'price_cross' | 'pattern_confirmed' | 'breakout' | 'forecast_threshold' | 'news_sentiment';
  condition: string;
  cooldownMinutes: number;
  isActive: boolean;
  suppressWhenStale: boolean;
  lastTriggered?: string;
  deliveryChannel: 'in_app' | 'webhook' | 'email';
}

interface AlertEvent {
  id: string;
  ruleName: string;
  symbol: string;
  timestamp: string;
  snapshotHash: string;
  message: string;
  status: 'delivered' | 'suppressed_stale' | 'cooldown_active';
}

export default function AlertsPage() {
  const [rules, setRules] = useState<AlertRule[]>([
    {
      id: 'rule-01',
      name: 'BTC All-Time High Resistance Crossing',
      symbol: 'BTCUSDT',
      type: 'price_cross',
      condition: 'Price > 68,500 USDT (1h Closed Candle)',
      cooldownMinutes: 60,
      isActive: true,
      suppressWhenStale: true,
      lastTriggered: new Date(Date.now() - 3600000 * 4).toISOString(),
      deliveryChannel: 'in_app',
    },
    {
      id: 'rule-02',
      name: 'Double Bottom Neckline Confirmation',
      symbol: 'BTCUSDT',
      type: 'pattern_confirmed',
      condition: 'Quality Score ≥ 75 & Close ≥ 0.25 ATR past neckline',
      cooldownMinutes: 120,
      isActive: true,
      suppressWhenStale: true,
      lastTriggered: new Date(Date.now() - 3600000 * 18).toISOString(),
      deliveryChannel: 'in_app',
    },
    {
      id: 'rule-03',
      name: 'ETH Triangle Breakout Retest',
      symbol: 'ETHUSDT',
      type: 'breakout',
      condition: 'Ascending Triangle resistance broken with volume > 1.2x',
      cooldownMinutes: 180,
      isActive: true,
      suppressWhenStale: true,
      deliveryChannel: 'in_app',
    },
    {
      id: 'rule-04',
      name: 'Quantile Forecast Extreme Deviation Alert',
      symbol: 'SOLUSDT',
      type: 'forecast_threshold',
      condition: 'Observed price breaches q90 projection bound',
      cooldownMinutes: 240,
      isActive: false,
      suppressWhenStale: true,
      deliveryChannel: 'in_app',
    },
  ]);

  const [events] = useState<AlertEvent[]>([
    {
      id: 'evt-101',
      ruleName: 'Double Bottom Neckline Confirmation',
      symbol: 'BTCUSDT',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      snapshotHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4',
      message: 'BTCUSDT 4h Double Bottom confirmed: Close at 67,845 USDT exceeded neckline (67,300) by 0.65 ATR.',
      status: 'delivered',
    },
    {
      id: 'evt-102',
      ruleName: 'BTC All-Time High Resistance Crossing',
      symbol: 'BTCUSDT',
      timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
      snapshotHash: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1f',
      message: 'Trigger attempted during upstream quote delay (stale quote > 15s). Alert suppressed to prevent false positive.',
      status: 'suppressed_stale',
    },
  ]);

  const toggleRule = (id: string) => {
    setRules(rules.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r)));
  };

  return (
    <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div className="card" style={{ padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Automated Rules & Alert Engine</h1>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Condition triggers for price boundaries, pattern confirmations, breakouts, and quantile breaches with mandatory staleness suppression.
            </p>
          </div>
          <button className="btn btn-primary" style={{ fontSize: 11, padding: '4px 12px' }}>
            + Create Alert Rule
          </button>
        </div>
      </div>

      {/* Rules Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--bg-border)', fontSize: 12, fontWeight: 700 }}>
          CONFIGURED ALERT RULES ({rules.length})
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--bg-border)', color: 'var(--text-muted)', fontSize: 10 }}>
              <th style={{ padding: '8px 12px' }}>STATUS</th>
              <th style={{ padding: '8px 12px' }}>NAME</th>
              <th style={{ padding: '8px 12px' }}>INSTRUMENT</th>
              <th style={{ padding: '8px 12px' }}>CONDITION</th>
              <th style={{ padding: '8px 12px' }}>COOLDOWN</th>
              <th style={{ padding: '8px 12px' }}>STALE GUARD</th>
              <th style={{ padding: '8px 12px', textAlign: 'right' }}>TOGGLE</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={rule.id} style={{ borderBottom: '1px solid var(--bg-border)' }}>
                <td style={{ padding: '10px 12px' }}>
                  <span
                    style={{
                      fontSize: 9,
                      padding: '2px 6px',
                      borderRadius: 3,
                      fontWeight: 700,
                      background: rule.isActive ? 'rgba(0, 201, 167, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                      color: rule.isActive ? 'var(--accent-teal)' : '#94a3b8',
                    }}
                  >
                    {rule.isActive ? 'ACTIVE' : 'PAUSED'}
                  </span>
                </td>
                <td style={{ padding: '10px 12px', fontWeight: 600 }}>{rule.name}</td>
                <td style={{ padding: '10px 12px', fontWeight: 700 }}>{rule.symbol}</td>
                <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{rule.condition}</td>
                <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{rule.cooldownMinutes}m</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ fontSize: 10, color: 'var(--accent-teal)' }}>✓ Suppress when stale</span>
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                  <button
                    onClick={() => toggleRule(rule.id)}
                    className={`btn ${rule.isActive ? 'btn-ghost' : 'btn-secondary'}`}
                    style={{ fontSize: 10, padding: '2px 8px' }}
                  >
                    {rule.isActive ? 'Pause' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Triggered Events Audit Log */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--bg-border)', fontSize: 12, fontWeight: 700 }}>
          TRIGGERED ALERT EVENTS LOG (Deduplicated Audit Trail)
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {events.map((evt) => (
            <div
              key={evt.id}
              style={{
                padding: '12px 14px',
                borderBottom: '1px solid var(--bg-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 12,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 12 }}>{evt.symbol}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>·</span>
                  <span style={{ fontSize: 11, fontWeight: 600 }}>{evt.ruleName}</span>
                  <span
                    style={{
                      fontSize: 9,
                      padding: '1px 5px',
                      borderRadius: 3,
                      fontWeight: 700,
                      background:
                        evt.status === 'delivered'
                          ? 'rgba(0, 201, 167, 0.15)'
                          : 'rgba(244, 63, 94, 0.15)',
                      color: evt.status === 'delivered' ? 'var(--accent-teal)' : '#f43f5e',
                    }}
                  >
                    {evt.status === 'delivered' ? 'DELIVERED' : 'SUPPRESSED (STALE DATA)'}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {evt.message}
                </div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'JetBrains Mono, monospace' }}>
                  Snapshot Hash: {evt.snapshotHash}... · Asia/Colombo: {new Date(evt.timestamp).toLocaleString('en-US', { timeZone: 'Asia/Colombo' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
