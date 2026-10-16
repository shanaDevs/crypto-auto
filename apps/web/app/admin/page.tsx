'use client';

import React, { useState } from 'react';

export default function AdminSettingsPage() {
  const [exchangeProvider, setExchangeProvider] = useState('binance');
  const [quoteStaleThreshold, setQuoteStaleThreshold] = useState(15);
  const [candleStaleThreshold, setCandleStaleThreshold] = useState(30);

  return (
    <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div className="card" style={{ padding: 14 }}>
        <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>System Administration & Integrations</h1>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0' }}>
          Manage exchange adapters, data staleness thresholds, Model Context Protocol (MCP) server & client, and backup targets.
        </p>
      </div>

      {/* Exchange & Provider Settings */}
      <div className="card" style={{ padding: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>EXCHANGE ADAPTER CONFIGURATION</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, fontSize: 11 }}>
          <div>
            <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: 4 }}>Active Provider</label>
            <select
              value={exchangeProvider}
              onChange={(e) => setExchangeProvider(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--bg-border)',
                borderRadius: 4,
                padding: '6px 10px',
                color: 'var(--text-primary)',
                fontSize: 11,
              }}
            >
              <option value="demo">Demo Mode (Deterministic Offline Fixtures)</option>
              <option value="binance">Binance Spot (REST History + WebSocket Live)</option>
            </select>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
              * When demo mode is selected, a persistent DEMO badge is displayed across all pages.
            </div>
          </div>

          <div>
            <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: 4 }}>
              Quote Stale Threshold (Seconds): <strong>{quoteStaleThreshold}s</strong>
            </label>
            <input
              type="range"
              min="5"
              max="60"
              value={quoteStaleThreshold}
              onChange={(e) => setQuoteStaleThreshold(+e.target.value)}
              style={{ width: '100%', accentColor: 'var(--accent-teal)' }}
            />
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
              Marks quote as delayed if no tick is received within threshold.
            </div>
          </div>

          <div>
            <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: 4 }}>
              Candle Stale Threshold (Seconds): <strong>{candleStaleThreshold}s</strong>
            </label>
            <input
              type="range"
              min="10"
              max="120"
              value={candleStaleThreshold}
              onChange={(e) => setCandleStaleThreshold(+e.target.value)}
              style={{ width: '100%', accentColor: 'var(--accent-teal)' }}
            />
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
              Marks candle stream stale if expected close candle is delayed.
            </div>
          </div>
        </div>
      </div>

      {/* Model Context Protocol (MCP) Integration Manager */}
      <div className="card" style={{ padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700 }}>MODEL CONTEXT PROTOCOL (MCP) INTERFACES</div>
          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(0, 201, 167, 0.15)', color: 'var(--accent-teal)', fontWeight: 600 }}>
            Platform Server Active
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {/* Role 1: Platform MCP Server */}
          <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 6, fontSize: 11 }}>
            <div style={{ fontWeight: 700, color: 'var(--accent-teal)', marginBottom: 6 }}>
              Role 1: Platform MCP Server (Read-Only)
            </div>
            <div style={{ color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.4 }}>
              Exposes 5 scoped, read-only tools to authorized models and ChatGPT plugins. No order execution, SQL, or shell access.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>
              <span>✓ <code>get_market_snapshot(symbol, timeframe)</code></span>
              <span>✓ <code>get_detected_patterns(symbol, timeframe, quality)</code></span>
              <span>✓ <code>get_forecast(symbol, horizon)</code></span>
              <span>✓ <code>get_coin_news(symbol, limit)</code></span>
              <span>✓ <code>get_analysis_evidence(snapshotId)</code></span>
            </div>
            <div style={{ marginTop: 8, fontSize: 10, color: 'var(--text-muted)' }}>
              Port: 3002 · Transport: SSE
            </div>
          </div>

          {/* Role 2: Outbound MCP Client */}
          <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 6, fontSize: 11 }}>
            <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: 6 }}>
              Role 2: Outbound MCP Client
            </div>
            <div style={{ color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.4 }}>
              Connects to external MCP servers with SSRF guard protection and tool allowlisting. Currently configured with server-side AI fallback.
            </div>
            <div style={{ padding: 8, background: 'var(--bg-card)', borderRadius: 4, fontSize: 10, color: 'var(--text-muted)' }}>
              <div>Status: <strong>Ready for discovery handshake</strong></div>
              <div>SSRF Guard: <strong>Active (Blocks 169.254.169.254 & private IPs)</strong></div>
              <div>Inference Fallback: <strong>OpenAI gpt-4o-mini active</strong></div>
            </div>
          </div>
        </div>
      </div>

      {/* S3 Backups & Operations */}
      <div className="card" style={{ padding: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>DISASTER RECOVERY & S3 STORAGE</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, fontSize: 11 }}>
          <div style={{ background: 'var(--bg-secondary)', padding: 10, borderRadius: 4 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>RECOVERY POINT OBJECTIVE (RPO)</div>
            <div style={{ fontWeight: 700, fontSize: 13, marginTop: 2 }}>24 Hours</div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Nightly encrypted snapshots</div>
          </div>
          <div style={{ background: 'var(--bg-secondary)', padding: 10, borderRadius: 4 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>RECOVERY TIME OBJECTIVE (RTO)</div>
            <div style={{ fontWeight: 700, fontSize: 13, marginTop: 2 }}>4 Hours</div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Automated schema restore</div>
          </div>
          <div style={{ background: 'var(--bg-secondary)', padding: 10, borderRadius: 4 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>RETENTION PERIOD</div>
            <div style={{ fontWeight: 700, fontSize: 13, marginTop: 2 }}>30 Daily Snapshots</div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Candles 12m, Forecasts 24m</div>
          </div>
        </div>
      </div>
    </div>
  );
}
