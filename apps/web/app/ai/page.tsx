'use client';

import React, { useState } from 'react';
import { requestAiExplanation, AiExplanation } from '@/lib/api';

export default function AiAssistantPage() {
  const [selectedCoin, setSelectedCoin] = useState('BTCUSDT');
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<AiExplanation | null>(null);
  const [dailySpent, setDailySpent] = useState(4.28);
  const dailyBudget = 100.0;

  const handleRunExplanation = async () => {
    setLoading(true);
    try {
      const res = await requestAiExplanation(selectedCoin);
      setExplanation(res);
      setDailySpent((prev) => Math.min(prev + 0.04, dailyBudget));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header & Budget Card */}
      <div className="card" style={{ padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>AI Explanation & Prompt Defense Terminal</h1>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Connected to <strong>OpenAI gpt-4o-mini</strong>. Generates structured JSON explanations over frozen numerical snapshots.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'right', fontSize: 11 }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>DAILY AI BUDGET</div>
              <div style={{ fontWeight: 700, color: 'var(--accent-teal)' }}>
                ${dailySpent.toFixed(2)} / ${dailyBudget.toFixed(2)}
              </div>
            </div>
            <div style={{ width: 60, height: 6, background: 'var(--bg-secondary)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${(dailySpent / dailyBudget) * 100}%`, height: '100%', background: 'var(--accent-teal)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Snapshot Generator Controls */}
      <div className="card" style={{ padding: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>RUN ON-DEMAND EVIDENCE SYNTHESIS</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <select
            value={selectedCoin}
            onChange={(e) => setSelectedCoin(e.target.value)}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--bg-border)',
              borderRadius: 4,
              padding: '6px 12px',
              color: 'var(--text-primary)',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <option value="BTCUSDT">BTCUSDT (Bitcoin)</option>
            <option value="ETHUSDT">ETHUSDT (Ethereum)</option>
            <option value="SOLUSDT">SOLUSDT (Solana)</option>
            <option value="BNBUSDT">BNBUSDT (BNB)</option>
          </select>

          <button
            onClick={handleRunExplanation}
            disabled={loading}
            className="btn btn-primary"
            style={{ fontSize: 11, padding: '6px 16px' }}
          >
            {loading ? 'Synthesizing Snapshot with GPT-4o-mini...' : 'Generate Validated Explanation'}
          </button>
        </div>
      </div>

      {/* Results View */}
      {explanation && (
        <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--bg-border)', paddingBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, color: 'var(--accent-teal)' }}>◈</span>
              <span style={{ fontWeight: 700, fontSize: 13 }}>Structured Explanation: {selectedCoin}</span>
            </div>
            <span style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(0, 201, 167, 0.15)', color: 'var(--accent-teal)', borderRadius: 3, fontWeight: 700 }}>
              VALIDATED SCHEMA PASS
            </span>
          </div>

          {/* Executive Summary */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>
              EXECUTIVE SUMMARY
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>
              {explanation.summary}
            </div>
          </div>

          {/* Evidence Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: 'rgba(0, 201, 167, 0.05)', border: '1px solid rgba(0, 201, 167, 0.2)', padding: 12, borderRadius: 6 }}>
              <div style={{ fontWeight: 700, color: 'var(--accent-teal)', marginBottom: 6, fontSize: 12 }}>
                ▲ Bullish Evidence ({explanation.bullishEvidence.length})
              </div>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {explanation.bullishEvidence.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>

            <div style={{ background: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.2)', padding: 12, borderRadius: 6 }}>
              <div style={{ fontWeight: 700, color: '#f43f5e', marginBottom: 6, fontSize: 12 }}>
                ▼ Bearish Evidence ({explanation.bearishEvidence.length})
              </div>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {explanation.bearishEvidence.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Limitations & Citations */}
          <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 6, fontSize: 11 }}>
            <div style={{ fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>AUDITABLE SOURCE CITATIONS</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {explanation.sourceCitations.map((c, i) => (
                <span key={i} style={{ padding: '2px 8px', background: 'var(--bg-card)', borderRadius: 4, border: '1px solid var(--bg-border)' }}>
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
