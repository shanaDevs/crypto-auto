'use client';

import React, { useState } from 'react';
import { AiExplanation, requestAiExplanation } from '@/lib/api';

interface AiEvidenceDrawerProps {
  symbol: string;
  initialExplanation?: AiExplanation;
}

export function AiEvidenceDrawer({ symbol, initialExplanation }: AiEvidenceDrawerProps) {
  const [explanation, setExplanation] = useState<AiExplanation | null>(initialExplanation || null);
  const [loading, setLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await requestAiExplanation(symbol);
      setExplanation(result);
    } catch {
      // Handled in api client
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--bg-card)',
        borderLeft: '1px solid var(--bg-border)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '10px 14px',
          borderBottom: '1px solid var(--bg-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, color: 'var(--accent-teal)' }}>◈</span>
          <span style={{ fontWeight: 600, fontSize: 12 }}>AI Evidence Synthesis</span>
          <span
            style={{
              fontSize: 9,
              padding: '1px 5px',
              borderRadius: 3,
              background: 'rgba(56, 189, 248, 0.1)',
              color: '#38bdf8',
              fontWeight: 600,
            }}
          >
            GPT-4o-mini
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="btn btn-secondary"
            style={{ fontSize: 10, padding: '2px 8px' }}
          >
            {loading ? 'Synthesizing...' : '↻ Refresh'}
          </button>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="btn btn-ghost"
            style={{ fontSize: 10, padding: '2px 6px' }}
          >
            {isCollapsed ? '▼' : '▲'}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Security & Untrusted Content Guard Notice */}
          <div
            style={{
              padding: '6px 10px',
              borderRadius: 4,
              background: 'rgba(244, 63, 94, 0.08)',
              border: '1px solid rgba(244, 63, 94, 0.2)',
              fontSize: 10,
              color: 'var(--text-secondary)',
            }}
          >
            <strong style={{ color: '#f43f5e' }}>Security Guard:</strong> AI explains frozen numerical snapshots and sanitized news excerpts. AI cannot calculate market prices, invent pattern coordinates, or place orders.
          </div>

          {loading ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 11 }}>
              Generating validated structured explanation from frozen snapshot...
            </div>
          ) : explanation ? (
            <>
              {/* Executive Summary */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>
                  EXECUTIVE SUMMARY
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--text-primary)' }}>
                  {explanation.summary}
                </div>
              </div>

              {/* Bullish vs Bearish Columns */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                {/* Bullish Evidence */}
                <div
                  style={{
                    padding: 10,
                    borderRadius: 6,
                    background: 'rgba(0, 201, 167, 0.05)',
                    border: '1px solid rgba(0, 201, 167, 0.2)',
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-teal)', marginBottom: 6 }}>
                    ▲ Bullish Evidence ({explanation.bullishEvidence.length})
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {explanation.bullishEvidence.map((item, idx) => (
                      <li key={idx} style={{ color: 'var(--text-secondary)' }}>{item}</li>
                    ))}
                  </ul>
                </div>

                {/* Bearish Evidence */}
                <div
                  style={{
                    padding: 10,
                    borderRadius: 6,
                    background: 'rgba(244, 63, 94, 0.05)',
                    border: '1px solid rgba(244, 63, 94, 0.2)',
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#f43f5e', marginBottom: 6 }}>
                    ▼ Bearish Evidence ({explanation.bearishEvidence.length})
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {explanation.bearishEvidence.map((item, idx) => (
                      <li key={idx} style={{ color: 'var(--text-secondary)' }}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Conflicting Signals */}
              {explanation.conflictingSignals.length > 0 && (
                <div style={{ padding: 8, background: 'var(--bg-secondary)', borderRadius: 4 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#fbbf24', marginBottom: 4 }}>
                    ⚠ CONFLICTING SIGNALS
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 14, fontSize: 11, color: 'var(--text-secondary)' }}>
                    {explanation.conflictingSignals.map((sig, idx) => (
                      <li key={idx}>{sig}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Triggers & Invalidation */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ padding: 8, background: 'var(--bg-secondary)', borderRadius: 4 }}>
                  <div style={{ fontSize: 10, color: 'var(--accent-teal)', fontWeight: 600 }}>CONFIRMATION TRIGGER</div>
                  <div style={{ fontSize: 11, color: 'var(--text-primary)', marginTop: 2 }}>
                    {explanation.triggers[0] || 'See chart trigger level'}
                  </div>
                </div>
                <div style={{ padding: 8, background: 'var(--bg-secondary)', borderRadius: 4 }}>
                  <div style={{ fontSize: 10, color: '#f43f5e', fontWeight: 600 }}>INVALIDATION LEVEL</div>
                  <div style={{ fontSize: 11, color: 'var(--text-primary)', marginTop: 2 }}>
                    {explanation.invalidation[0] || 'See chart stop boundary'}
                  </div>
                </div>
              </div>

              {/* Citations & Snapshot Hash */}
              <div style={{ borderTop: '1px solid var(--bg-border)', paddingTop: 10 }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
                  VERIFIED SNAPSHOT SOURCES
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                  {explanation.sourceCitations.map((cite, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: 9,
                        padding: '2px 6px',
                        background: 'var(--bg-secondary)',
                        borderRadius: 3,
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {cite}
                    </span>
                  ))}
                </div>
                {explanation.snapshotHash && (
                  <div style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)' }}>
                    Snapshot SHA256: {explanation.snapshotHash.slice(0, 16)}...
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <button onClick={handleGenerate} className="btn btn-primary" style={{ fontSize: 11 }}>
                Generate AI Explanation
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
