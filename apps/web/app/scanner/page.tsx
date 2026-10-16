'use client';

import React, { useState, useEffect } from 'react';
import { PatternItem, fetchPatterns, DEFAULT_INSTRUMENTS } from '@/lib/api';
import { PatternEvidenceModal } from '@/components/workspace/PatternEvidenceModal';

export default function PatternScannerPage() {
  const [patterns, setPatterns] = useState<PatternItem[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<PatternItem | null>(null);
  const [selectedLifecycle, setSelectedLifecycle] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('all');
  const [minQuality, setMinQuality] = useState<number>(60);
  const [searchSymbol, setSearchSymbol] = useState<string>('');

  useEffect(() => {
    async function load() {
      const data = await fetchPatterns();
      setPatterns(data);
    }
    load();
  }, []);

  const filteredPatterns = patterns.filter((p) => {
    if (selectedLifecycle !== 'all' && p.lifecycle !== selectedLifecycle) return false;
    if (selectedType !== 'all' && p.type !== selectedType) return false;
    if (selectedTimeframe !== 'all' && p.timeframe !== selectedTimeframe) return false;
    if (p.qualityScore < minQuality) return false;
    if (searchSymbol && !p.symbol.toLowerCase().includes(searchSymbol.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Evidence Modal */}
      <PatternEvidenceModal pattern={selectedPattern} onClose={() => setSelectedPattern(null)} />

      {/* Header & Filter Controls */}
      <div className="card" style={{ padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Numerical Pattern Scanner</h1>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Autonomous detection across 6 P0 quantitative detector families with verified 3-bar delayed pivot availability.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Found:</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-teal)' }}>
              {filteredPatterns.length} patterns
            </span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, fontSize: 11 }}>
          {/* Symbol Search */}
          <div>
            <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: 4 }}>Symbol</label>
            <input
              type="text"
              placeholder="e.g. BTC, ETH..."
              value={searchSymbol}
              onChange={(e) => setSearchSymbol(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--bg-border)',
                borderRadius: 4,
                padding: '4px 8px',
                color: 'var(--text-primary)',
                fontSize: 11,
              }}
            />
          </div>

          {/* Detector Family Filter */}
          <div>
            <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: 4 }}>Detector Family</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--bg-border)',
                borderRadius: 4,
                padding: '4px 8px',
                color: 'var(--text-primary)',
                fontSize: 11,
              }}
            >
              <option value="all">All 6 P0 Families</option>
              <option value="support_resistance">1. Support & Resistance Zones</option>
              <option value="double_bottom">2. Double Tops & Bottoms</option>
              <option value="ascending_triangle">3. Triangles (Asc/Desc/Sym)</option>
              <option value="upward_channel">4. Upward/Downward Channels</option>
              <option value="range_breakout">5. Range Breakouts & Retests</option>
              <option value="bullish_engulfing">6. Engulfing Candles</option>
            </select>
          </div>

          {/* Lifecycle Filter */}
          <div>
            <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: 4 }}>Lifecycle State</label>
            <select
              value={selectedLifecycle}
              onChange={(e) => setSelectedLifecycle(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--bg-border)',
                borderRadius: 4,
                padding: '4px 8px',
                color: 'var(--text-primary)',
                fontSize: 11,
              }}
            >
              <option value="all">All States</option>
              <option value="confirmed">Confirmed Only</option>
              <option value="candidate">Candidate (Pending)</option>
              <option value="invalidated">Invalidated (Cutoff hit)</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          {/* Timeframe Filter */}
          <div>
            <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: 4 }}>Timeframe</label>
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--bg-border)',
                borderRadius: 4,
                padding: '4px 8px',
                color: 'var(--text-primary)',
                fontSize: 11,
              }}
            >
              <option value="all">All (5m, 15m, 1h, 4h, 1d)</option>
              <option value="5m">5m</option>
              <option value="15m">15m</option>
              <option value="1h">1h</option>
              <option value="4h">4h</option>
              <option value="1d">1d</option>
            </select>
          </div>

          {/* Min Quality Score Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: 4 }}>
              <span>Min Quality</span>
              <strong style={{ color: 'var(--accent-teal)' }}>{minQuality}/100</strong>
            </div>
            <input
              type="range"
              min="40"
              max="95"
              value={minQuality}
              onChange={(e) => setMinQuality(+e.target.value)}
              style={{ width: '100%', accentColor: 'var(--accent-teal)' }}
            />
          </div>
        </div>
      </div>

      {/* Pattern Matrix Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--bg-border)', color: 'var(--text-muted)', fontSize: 10 }}>
                <th style={{ padding: '10px 14px' }}>INSTRUMENT</th>
                <th style={{ padding: '10px 14px' }}>TIMEFRAME</th>
                <th style={{ padding: '10px 14px' }}>PATTERN FAMILY</th>
                <th style={{ padding: '10px 14px' }}>LIFECYCLE</th>
                <th style={{ padding: '10px 14px' }}>QUALITY SCORE</th>
                <th style={{ padding: '10px 14px' }}>AVAILABLE AT (t+3)</th>
                <th style={{ padding: '10px 14px' }}>TRIGGER / CUTOFF</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatterns.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                    No patterns matched the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredPatterns.map((pat) => (
                  <tr
                    key={pat.id}
                    style={{
                      borderBottom: '1px solid var(--bg-border)',
                      transition: 'background 0.1s',
                    }}
                    className="table-row-hover"
                  >
                    <td style={{ padding: '10px 14px', fontWeight: 700 }}>{pat.symbol}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ padding: '2px 6px', background: 'var(--bg-secondary)', borderRadius: 3 }}>
                        {pat.timeframe}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 600 }}>{pat.typeLabel}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 3,
                          textTransform: 'uppercase',
                          background:
                            pat.lifecycle === 'confirmed'
                              ? 'rgba(0, 201, 167, 0.15)'
                              : pat.lifecycle === 'candidate'
                              ? 'rgba(251, 191, 36, 0.15)'
                              : 'rgba(244, 63, 94, 0.15)',
                          color:
                            pat.lifecycle === 'confirmed'
                              ? 'var(--accent-teal)'
                              : pat.lifecycle === 'candidate'
                              ? '#fbbf24'
                              : '#f43f5e',
                        }}
                      >
                        {pat.lifecycle}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 40, height: 4, background: 'var(--bg-secondary)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ width: `${pat.qualityScore}%`, height: '100%', background: 'var(--accent-teal)' }} />
                        </div>
                        <span style={{ fontWeight: 700, color: 'var(--accent-teal)' }}>{pat.qualityScore}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>
                      {new Date(pat.availableAt).toLocaleTimeString('en-US', { timeZone: 'Asia/Colombo', hour: '2-digit', minute: '2-digit' })} IST
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 10 }}>
                      {pat.triggerPrice ? (
                        <span style={{ color: 'var(--accent-teal)' }}>${pat.triggerPrice.toLocaleString()}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedPattern(pat)}
                        className="btn btn-secondary"
                        style={{ fontSize: 10, padding: '2px 8px' }}
                      >
                        Inspect Evidence
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
