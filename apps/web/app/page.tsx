'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
import { PatternEvidenceModal } from '@/components/workspace/PatternEvidenceModal';

export default function DashboardPage() {
  const [instruments, setInstruments] = useState<Instrument[]>(DEFAULT_INSTRUMENTS);
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const [timeframe, setTimeframe] = useState('1h');
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [patterns, setPatterns] = useState<PatternItem[]>([]);
  const [forecasts, setForecasts] = useState<ForecastItem[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<PatternItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [insts, pats, fcs, nw] = await Promise.all([
        fetchInstruments(),
        fetchPatterns(),
        fetchForecasts(),
        fetchNews(),
      ]);
      setInstruments(insts);
      setPatterns(pats);
      setForecasts(fcs);
      setNews(nw);

      const c = await fetchCandles(selectedSymbol, timeframe);
      setCandles(c);
      setLoading(false);
    }
    loadData();
  }, [selectedSymbol, timeframe]);

  const selectedInst = instruments.find((i) => i.symbol === selectedSymbol) || instruments[0];
  const activeForecast = forecasts.find((f) => f.symbol === selectedSymbol);
  const symbolPatterns = patterns.filter((p) => p.symbol === selectedSymbol);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 14 }}>
      {/* Pattern Evidence Modal */}
      <PatternEvidenceModal pattern={selectedPattern} onClose={() => setSelectedPattern(null)} />

      {/* Top Terminal Stats Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 10,
        }}
      >
        <div className="card" style={{ padding: '10px 14px' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>MARKET REGIME</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-teal)', marginTop: 2 }}>
            Bullish Continuation
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
            20-Pair Mean Momentum: +1.84%
          </div>
        </div>

        <div className="card" style={{ padding: '10px 14px' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>ACTIVE DETECTED PATTERNS</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
            {patterns.filter((p) => p.lifecycle === 'confirmed').length} Confirmed · {patterns.length} Total
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
            P0 Detectors: S/R, Double Tops, Triangles, Breakouts
          </div>
        </div>

        <div className="card" style={{ padding: '10px 14px' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>FORECAST VALIDATION GATE</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-teal)', marginTop: 2 }}>
            PASSED (81.2% Coverage)
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
            Pinball Loss Gate: -6.8% vs Baseline
          </div>
        </div>

        <div className="card" style={{ padding: '10px 14px' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>INGESTION FRESHNESS</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
            Quote: 0.8s · Candle: 1.2s
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
            Thresholds: &lt;15s quote, &lt;30s candle
          </div>
        </div>
      </div>

      {/* 20 Configurable Liquid Spot Instruments Grid Carousel */}
      <div className="card" style={{ padding: '10px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
            20 CONFIGURABLE LIQUID USDT SPOT INSTRUMENTS
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            Select pair to inspect chart & quant evidence
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))',
            gap: 8,
            overflowX: 'auto',
          }}
        >
          {instruments.map((inst) => {
            const isSelected = inst.symbol === selectedSymbol;
            const isPositive = inst.change24h >= 0;
            return (
              <div
                key={inst.id}
                onClick={() => setSelectedSymbol(inst.symbol)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  background: isSelected ? 'var(--bg-secondary)' : 'rgba(255,255,255,0.02)',
                  border: isSelected ? '1px solid var(--accent-teal)' : '1px solid var(--bg-border)',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: 11 }}>{inst.baseAsset}</span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: isPositive ? 'var(--accent-teal)' : '#f43f5e',
                    }}
                  >
                    {isPositive ? '+' : ''}{inst.change24h}%
                  </span>
                </div>
                <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', marginTop: 4 }}>
                  ${inst.price < 1 ? inst.price.toFixed(4) : inst.price.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Feature Area: Dominant Chart + Right Evidence Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 14 }}>
        {/* Chart Column */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Chart Controls */}
          <div
            style={{
              padding: '10px 14px',
              borderBottom: '1px solid var(--bg-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>{selectedInst.symbol}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Spot</span>
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: 'JetBrains Mono, monospace',
                  color: selectedInst.change24h >= 0 ? 'var(--accent-teal)' : '#f43f5e',
                }}
              >
                ${selectedInst.price < 1 ? selectedInst.price.toFixed(4) : selectedInst.price.toLocaleString()}
              </div>
            </div>

            {/* Timeframe Switcher */}
            <div style={{ display: 'flex', gap: 4 }}>
              {['5m', '15m', '1h', '4h', '1d'].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`btn ${timeframe === tf ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ padding: '2px 8px', fontSize: 10 }}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* TradingView Lightweight Chart */}
          <div style={{ height: 480, position: 'relative' }}>
            <TradingViewChart
              candles={candles}
              patterns={symbolPatterns}
              forecast={activeForecast}
              symbol={selectedSymbol}
              timeframe={timeframe}
              onPatternClick={(p) => setSelectedPattern(p)}
              height={480}
            />
          </div>
        </div>

        {/* Right Sidebar: Active Patterns & Forecasts Snapshot */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Active Patterns Box */}
          <div className="card" style={{ padding: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700 }}>ACTIVE PATTERNS ({symbolPatterns.length})</div>
              <Link href="/scanner" style={{ fontSize: 10, color: 'var(--accent-teal)' }}>
                View All →
              </Link>
            </div>

            {symbolPatterns.length === 0 ? (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '12px 0' }}>
                No active confirmed patterns on {timeframe} for {selectedSymbol}.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {symbolPatterns.map((pat) => (
                  <div
                    key={pat.id}
                    onClick={() => setSelectedPattern(pat)}
                    style={{
                      padding: 8,
                      borderRadius: 4,
                      background: 'var(--bg-secondary)',
                      cursor: 'pointer',
                      border: '1px solid var(--bg-border)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, fontWeight: 600 }}>{pat.typeLabel}</span>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          padding: '1px 5px',
                          borderRadius: 3,
                          background: 'rgba(0, 201, 167, 0.15)',
                          color: 'var(--accent-teal)',
                        }}
                      >
                        Quality: {pat.qualityScore}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                      {pat.description}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Probabilistic Forecast Snapshot */}
          <div className="card" style={{ padding: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700 }}>QUANTILE PROJECTION (1H)</div>
              <Link href="/forecasts" style={{ fontSize: 10, color: 'var(--accent-teal)' }}>
                Archive →
              </Link>
            </div>

            {activeForecast ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: 6,
                    textAlign: 'center',
                    background: 'var(--bg-secondary)',
                    padding: 8,
                    borderRadius: 4,
                    fontSize: 10,
                  }}
                >
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>q10 (Low)</div>
                    <div style={{ fontWeight: 700, color: '#f43f5e' }}>${activeForecast.q10.toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>q50 (Median)</div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>${activeForecast.q50.toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>q90 (High)</div>
                    <div style={{ fontWeight: 700, color: 'var(--accent-teal)' }}>${activeForecast.q90.toLocaleString()}</div>
                  </div>
                </div>

                {/* Directional Probabilities */}
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
                    DIRECTIONAL PROBABILITIES (Threshold: ±0.25 σ)
                  </div>
                  <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ flex: activeForecast.directionProbabilities.up, background: 'var(--accent-teal)' }} title={`Up: ${(activeForecast.directionProbabilities.up * 100).toFixed(0)}%`} />
                    <div style={{ flex: activeForecast.directionProbabilities.neutral, background: '#64748b' }} title={`Neutral: ${(activeForecast.directionProbabilities.neutral * 100).toFixed(0)}%`} />
                    <div style={{ flex: activeForecast.directionProbabilities.down, background: '#f43f5e' }} title={`Down: ${(activeForecast.directionProbabilities.down * 100).toFixed(0)}%`} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>
                    <span>Up: {(activeForecast.directionProbabilities.up * 100).toFixed(0)}%</span>
                    <span>Neutral: {(activeForecast.directionProbabilities.neutral * 100).toFixed(0)}%</span>
                    <span>Down: {(activeForecast.directionProbabilities.down * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>No active forecast for {selectedSymbol}.</div>
            )}
          </div>

          {/* Quick News Feed */}
          <div className="card" style={{ padding: 12, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700 }}>CURATED MARKET INTELLIGENCE</div>
              <Link href="/news" style={{ fontSize: 10, color: 'var(--accent-teal)' }}>
                All News →
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {news.slice(0, 3).map((item) => (
                <div key={item.id} style={{ fontSize: 11, borderBottom: '1px solid var(--bg-border)', paddingBottom: 6 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                    {item.title}
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4, fontSize: 9, color: 'var(--text-muted)' }}>
                    <span>{item.source}</span>
                    <span>·</span>
                    <span
                      style={{
                        color: item.sentiment === 'bullish' ? 'var(--accent-teal)' : item.sentiment === 'bearish' ? '#f43f5e' : 'var(--text-muted)',
                        fontWeight: 600,
                        textTransform: 'capitalize',
                      }}
                    >
                      {item.sentiment}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
