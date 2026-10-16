'use client';

import React, { useState, useEffect } from 'react';
import { NewsItem, fetchNews, DEFAULT_INSTRUMENTS } from '@/lib/api';

export default function NewsCentrePage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [filterCoin, setFilterCoin] = useState<string>('all');
  const [filterSentiment, setFilterSentiment] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    async function load() {
      const data = await fetchNews();
      setNews(data);
    }
    load();
  }, []);

  const filtered = news.filter((item) => {
    if (filterCoin !== 'all' && !item.mappedSymbols.includes(filterCoin)) return false;
    if (filterSentiment !== 'all' && item.sentiment !== filterSentiment) return false;
    if (search && !item.title.toLowerCase().includes(search.toLowerCase()) && !item.excerpt.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header & Controls */}
      <div className="card" style={{ padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Crypto News & Intelligence Centre</h1>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Canonical asset disambiguation, syndicated deduplication, and tone classification. Untrusted content sandbox enabled.
            </p>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Showing <strong style={{ color: 'var(--accent-teal)' }}>{filtered.length}</strong> verified wire items
          </div>
        </div>

        {/* Security Warning Notice */}
        <div
          style={{
            padding: '8px 12px',
            background: 'rgba(251, 191, 36, 0.08)',
            border: '1px solid rgba(251, 191, 36, 0.25)',
            borderRadius: 6,
            fontSize: 10,
            color: '#fbbf24',
            marginBottom: 12,
          }}
        >
          <strong>Untrusted Source Notice:</strong> Article sentiment describes linguistic tone, not future price direction. All incoming articles are sanitized to prevent prompt injection from affecting AI tools.
        </div>

        {/* Filter Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, fontSize: 11 }}>
          <div>
            <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: 4 }}>Search Headlines & Excerpts</label>
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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

          <div>
            <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: 4 }}>Filter by Asset</label>
            <select
              value={filterCoin}
              onChange={(e) => setFilterCoin(e.target.value)}
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
              <option value="all">All Assets</option>
              {DEFAULT_INSTRUMENTS.slice(0, 10).map((i) => (
                <option key={i.id} value={i.symbol}>{i.symbol} ({i.baseAsset})</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: 4 }}>Sentiment Tone</label>
            <select
              value={filterSentiment}
              onChange={(e) => setFilterSentiment(e.target.value)}
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
              <option value="all">All Sentiment Tones</option>
              <option value="bullish">Bullish Tone</option>
              <option value="neutral">Neutral Tone</option>
              <option value="bearish">Bearish Tone</option>
            </select>
          </div>
        </div>
      </div>

      {/* News Feed Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 ? (
          <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
            No verified news articles matched your search or filters.
          </div>
        ) : (
          filtered.map((item) => (
            <div key={item.id} className="card" style={{ padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 3,
                        textTransform: 'uppercase',
                        background:
                          item.sentiment === 'bullish'
                            ? 'rgba(0, 201, 167, 0.15)'
                            : item.sentiment === 'bearish'
                            ? 'rgba(244, 63, 94, 0.15)'
                            : 'rgba(148, 163, 184, 0.15)',
                        color:
                          item.sentiment === 'bullish'
                            ? 'var(--accent-teal)'
                            : item.sentiment === 'bearish'
                            ? '#f43f5e'
                            : '#94a3b8',
                      }}
                    >
                      {item.sentiment}
                    </span>

                    {item.mappedSymbols.map((s) => (
                      <span
                        key={s}
                        style={{
                          fontSize: 9,
                          fontWeight: 600,
                          padding: '1px 5px',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--bg-border)',
                          borderRadius: 3,
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {s}
                      </span>
                    ))}

                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      Relevance: {(item.relevance * 100).toFixed(0)}%
                    </span>
                  </div>

                  <h2 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 6px', color: 'var(--text-primary)' }}>
                    {item.title}
                  </h2>

                  <p style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--text-secondary)', margin: '0 0 10px' }}>
                    {item.excerpt}
                  </p>

                  <div style={{ display: 'flex', gap: 14, fontSize: 10, color: 'var(--text-muted)' }}>
                    <span>Source: <strong style={{ color: 'var(--text-primary)' }}>{item.source}</strong></span>
                    <span>·</span>
                    <span>
                      Published: {new Date(item.publishedAt).toLocaleTimeString('en-US', { timeZone: 'Asia/Colombo', hour: '2-digit', minute: '2-digit' })} IST
                    </span>
                    <span>·</span>
                    <span>
                      First Seen (Replay gate): {new Date(item.firstSeenAt).toLocaleTimeString('en-US', { timeZone: 'Asia/Colombo', hour: '2-digit', minute: '2-digit' })} IST
                    </span>
                  </div>
                </div>

                <a
                  href={item.canonicalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ fontSize: 10, padding: '4px 10px', whiteSpace: 'nowrap' }}
                >
                  Source Link ↗
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
