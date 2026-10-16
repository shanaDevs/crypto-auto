'use client';

import React from 'react';
import { PatternItem } from '@/lib/api';

interface PatternEvidenceModalProps {
  pattern: PatternItem | null;
  onClose: () => void;
}

export function PatternEvidenceModal({ pattern, onClose }: PatternEvidenceModalProps) {
  if (!pattern) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(5, 7, 10, 0.7)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 580,
          background: 'var(--bg-card)',
          border: '1px solid var(--bg-border)',
          borderRadius: 8,
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--bg-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, color: 'var(--accent-teal)' }}>◎</span>
            <span style={{ fontWeight: 600, fontSize: 13 }}>{pattern.typeLabel} Evidence</span>
            <span
              style={{
                fontSize: 10,
                padding: '2px 6px',
                borderRadius: 4,
                background: pattern.lifecycle === 'confirmed' ? 'rgba(0, 201, 167, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                color: pattern.lifecycle === 'confirmed' ? 'var(--accent-teal)' : '#f43f5e',
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              {pattern.lifecycle}
            </span>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: '2px 8px', fontSize: 14 }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 16, maxHeight: '80vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Metadata Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
              background: 'var(--bg-secondary)',
              padding: 10,
              borderRadius: 6,
              fontSize: 11,
            }}
          >
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>INSTRUMENT</div>
              <div style={{ fontWeight: 600 }}>{pattern.symbol}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>TIMEFRAME</div>
              <div style={{ fontWeight: 600 }}>{pattern.timeframe}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>OVERALL QUALITY</div>
              <div style={{ fontWeight: 700, color: 'var(--accent-teal)' }}>{pattern.qualityScore}/100</div>
            </div>
          </div>

          {/* Temporal Non-Backdating Proof */}
          <div
            style={{
              border: '1px solid rgba(56, 189, 248, 0.2)',
              background: 'rgba(56, 189, 248, 0.05)',
              borderRadius: 6,
              padding: 10,
              fontSize: 11,
            }}
          >
            <div style={{ fontWeight: 600, color: '#38bdf8', marginBottom: 4, fontSize: 11 }}>
              ⏳ Temporal Horizon Guarantee (No Lookahead)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, color: 'var(--text-secondary)' }}>
              <div>
                <strong>Anchor Time:</strong> {new Date(pattern.anchorTime).toLocaleString('en-US', { timeZone: 'Asia/Colombo' })} (IST)
              </div>
              <div>
                <strong>Available At:</strong> {new Date(pattern.availableAt).toLocaleString('en-US', { timeZone: 'Asia/Colombo' })} (IST)
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                * Enforces strict 3-closed-candle pivot delay (anchor t available only at t+3 closed bars). Never backdated to anchor bar.
              </div>
            </div>
          </div>

          {/* Quality Score Breakdown */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>
              RULE FIT QUALITY COMPONENTS
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {Object.entries(pattern.qualityComponents).map(([key, value]) => (
                <div
                  key={key}
                  style={{
                    padding: '8px 10px',
                    background: 'var(--bg-secondary)',
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 11,
                  }}
                >
                  <span style={{ textTransform: 'capitalize', color: 'var(--text-muted)' }}>
                    {key.replace(/([A-Z])/g, ' $1')}
                  </span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Numerical Coordinates */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>
              COORDINATES & STRUCTURAL BOUNDARIES
            </div>
            <pre
              style={{
                background: 'var(--bg-secondary)',
                padding: 10,
                borderRadius: 4,
                fontSize: 11,
                fontFamily: 'JetBrains Mono, monospace',
                color: 'var(--text-primary)',
                overflowX: 'auto',
              }}
            >
              {JSON.stringify(pattern.coordinates, null, 2)}
            </pre>
          </div>

          {/* Triggers & Invalidation */}
          {(pattern.triggerPrice || pattern.invalidationPrice) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {pattern.triggerPrice && (
                <div style={{ padding: 8, background: 'rgba(0, 201, 167, 0.08)', borderRadius: 4, border: '1px solid rgba(0, 201, 167, 0.2)' }}>
                  <div style={{ fontSize: 10, color: 'var(--accent-teal)' }}>CONFIRMATION TRIGGER</div>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{pattern.triggerPrice.toLocaleString()} USDT</div>
                </div>
              )}
              {pattern.invalidationPrice && (
                <div style={{ padding: 8, background: 'rgba(244, 63, 94, 0.08)', borderRadius: 4, border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                  <div style={{ fontSize: 10, color: '#f43f5e' }}>INVALIDATION CUTOFF</div>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{pattern.invalidationPrice.toLocaleString()} USDT</div>
                </div>
              )}
            </div>
          )}

          {/* Mandatory Heuristic Notice */}
          <div style={{ fontSize: 10, color: 'var(--text-muted)', borderTop: '1px solid var(--bg-border)', paddingTop: 8 }}>
            <strong>Notice:</strong> Rule fit score indicates conformance to quantitative heuristic parameters. It is not an assertion of future price profitability or market direction.
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '10px 16px', background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-secondary" style={{ fontSize: 11 }}>
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
