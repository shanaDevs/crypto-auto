'use client';

import { useEffect, useState } from 'react';

const EXCHANGE_PROVIDER = process.env.NEXT_PUBLIC_EXCHANGE_PROVIDER ?? 'demo';

/**
 * DemoBadge — persistent DEMO mode indicator.
 * Always visible when using the demo adapter.
 * Cannot be dismissed.
 */
export function DemoBadge() {
  const [isDemo, setIsDemo] = useState(true); // assume demo until API confirms live

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
    fetch(`${apiUrl}/v1/health`)
      .then((r) => r.json())
      .then((data) => setIsDemo(data.demo ?? true))
      .catch(() => setIsDemo(true));
  }, []);

  if (!isDemo) return null;

  return (
    <div
      className="badge badge-demo"
      role="status"
      aria-label="Demo mode active — data is deterministic, not live market data"
      title="Demo mode: Deterministic synthetic data. Not live market data."
      style={{ display: 'flex', width: '100%', justifyContent: 'center' }}
    >
      <span>⚠</span> DEMO MODE
    </div>
  );
}
