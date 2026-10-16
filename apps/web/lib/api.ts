const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ─── Instrument Types & Mock Fallbacks ───────────────────────────────────────

export interface Instrument {
  id: string;
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  marketType: 'spot' | 'futures';
  isActive: boolean;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  sparkline: number[];
}

export const DEFAULT_INSTRUMENTS: Instrument[] = [
  { id: '1', symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT', marketType: 'spot', isActive: true, price: 67845.2, change24h: 2.45, high24h: 68420.0, low24h: 66100.0, volume24h: 34120.5, sparkline: [66200, 66500, 66300, 67100, 66900, 67500, 67845] },
  { id: '2', symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT', marketType: 'spot', isActive: true, price: 2642.8, change24h: -1.12, high24h: 2710.0, low24h: 2615.0, volume24h: 185340.2, sparkline: [2690, 2680, 2705, 2670, 2650, 2635, 2642] },
  { id: '3', symbol: 'SOLUSDT', baseAsset: 'SOL', quoteAsset: 'USDT', marketType: 'spot', isActive: true, price: 154.3, change24h: 4.80, high24h: 156.9, low24h: 147.1, volume24h: 890450.0, sparkline: [147, 149, 148, 152, 151, 153, 154.3] },
  { id: '4', symbol: 'BNBUSDT', baseAsset: 'BNB', quoteAsset: 'USDT', marketType: 'spot', isActive: true, price: 592.4, change24h: 0.75, high24h: 598.0, low24h: 587.2, volume24h: 78400.0, sparkline: [588, 589, 591, 590, 593, 591, 592.4] },
  { id: '5', symbol: 'XRPUSDT', baseAsset: 'XRP', quoteAsset: 'USDT', marketType: 'spot', isActive: true, price: 0.548, change24h: -0.65, high24h: 0.559, low24h: 0.542, volume24h: 2450000.0, sparkline: [0.552, 0.555, 0.549, 0.551, 0.546, 0.547, 0.548] },
  { id: '6', symbol: 'ADAUSDT', baseAsset: 'ADA', quoteAsset: 'USDT', marketType: 'spot', isActive: true, price: 0.354, change24h: 1.20, high24h: 0.362, low24h: 0.348, volume24h: 1850000.0, sparkline: [0.349, 0.351, 0.350, 0.353, 0.352, 0.355, 0.354] },
  { id: '7', symbol: 'DOGEUSDT', baseAsset: 'DOGE', quoteAsset: 'USDT', marketType: 'spot', isActive: true, price: 0.124, change24h: 3.10, high24h: 0.128, low24h: 0.119, volume24h: 5600000.0, sparkline: [0.120, 0.121, 0.122, 0.121, 0.125, 0.123, 0.124] },
  { id: '8', symbol: 'AVAXUSDT', baseAsset: 'AVAX', quoteAsset: 'USDT', marketType: 'spot', isActive: true, price: 28.45, change24h: -2.30, high24h: 29.80, low24h: 28.10, volume24h: 345000.0, sparkline: [29.2, 29.5, 29.1, 28.8, 28.6, 28.3, 28.45] },
  { id: '9', symbol: 'LINKUSDT', baseAsset: 'LINK', quoteAsset: 'USDT', marketType: 'spot', isActive: true, price: 11.85, change24h: 1.85, high24h: 12.10, low24h: 11.50, volume24h: 620000.0, sparkline: [11.6, 11.7, 11.5, 11.8, 11.7, 11.9, 11.85] },
  { id: '10', symbol: 'DOTUSDT', baseAsset: 'DOT', quoteAsset: 'USDT', marketType: 'spot', isActive: true, price: 4.28, change24h: 0.40, high24h: 4.36, low24h: 4.22, volume24h: 780000.0, sparkline: [4.24, 4.26, 4.25, 4.27, 4.29, 4.27, 4.28] },
  { id: '11', symbol: 'NEARUSDT', baseAsset: 'NEAR', quoteAsset: 'USDT', marketType: 'spot', isActive: true, price: 4.92, change24h: 5.15, high24h: 5.10, low24h: 4.65, volume24h: 920000.0, sparkline: [4.68, 4.75, 4.80, 4.78, 4.88, 4.95, 4.92] },
  { id: '12', symbol: 'SUIUSDT', baseAsset: 'SUI', quoteAsset: 'USDT', marketType: 'spot', isActive: true, price: 2.14, change24h: 6.80, high24h: 2.22, low24h: 1.98, volume24h: 1420000.0, sparkline: [1.99, 2.04, 2.02, 2.08, 2.11, 2.16, 2.14] },
  { id: '13', symbol: 'APTUSDT', baseAsset: 'APT', quoteAsset: 'USDT', marketType: 'spot', isActive: true, price: 9.85, change24h: -0.90, high24h: 10.20, low24h: 9.70, volume24h: 310000.0, sparkline: [10.0, 9.9, 10.1, 9.8, 9.9, 9.75, 9.85] },
  { id: '14', symbol: 'MATICUSDT', baseAsset: 'POL', quoteAsset: 'USDT', marketType: 'spot', isActive: true, price: 0.382, change24h: -1.40, high24h: 0.395, low24h: 0.378, volume24h: 890000.0, sparkline: [0.389, 0.392, 0.385, 0.388, 0.381, 0.380, 0.382] },
  { id: '15', symbol: 'ATOMUSDT', baseAsset: 'ATOM', quoteAsset: 'USDT', marketType: 'spot', isActive: true, price: 4.65, change24h: 0.80, high24h: 4.75, low24h: 4.58, volume24h: 240000.0, sparkline: [4.61, 4.63, 4.60, 4.66, 4.64, 4.67, 4.65] },
  { id: '16', symbol: 'ARBUSDT', baseAsset: 'ARB', quoteAsset: 'USDT', marketType: 'spot', isActive: true, price: 0.565, change24h: 1.95, high24h: 0.582, low24h: 0.550, volume24h: 1100000.0, sparkline: [0.552, 0.558, 0.555, 0.562, 0.560, 0.568, 0.565] },
  { id: '17', symbol: 'OPUSDT', baseAsset: 'OP', quoteAsset: 'USDT', marketType: 'spot', isActive: true, price: 1.62, change24h: -0.40, high24h: 1.68, low24h: 1.59, volume24h: 490000.0, sparkline: [1.64, 1.66, 1.61, 1.63, 1.60, 1.61, 1.62] },
  { id: '18', symbol: 'LTCUSDT', baseAsset: 'LTC', quoteAsset: 'USDT', marketType: 'spot', isActive: true, price: 72.8, change24h: 1.10, high24h: 74.2, low24h: 71.5, volume24h: 145000.0, sparkline: [71.9, 72.4, 72.1, 72.6, 73.1, 72.5, 72.8] },
  { id: '19', symbol: 'UNIUSDT', baseAsset: 'UNI', quoteAsset: 'USDT', marketType: 'spot', isActive: true, price: 7.95, change24h: 2.70, high24h: 8.15, low24h: 7.68, volume24h: 380000.0, sparkline: [7.72, 7.80, 7.75, 7.89, 7.91, 8.02, 7.95] },
  { id: '20', symbol: 'FTMUSDT', baseAsset: 'FTM', quoteAsset: 'USDT', marketType: 'spot', isActive: true, price: 0.685, change24h: 4.20, high24h: 0.702, low24h: 0.650, volume24h: 1950000.0, sparkline: [0.655, 0.662, 0.658, 0.671, 0.678, 0.690, 0.685] },
];

export interface CandleData {
  time: number; // Unix timestamp in seconds for Lightweight Charts
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PatternItem {
  id: string;
  symbol: string;
  timeframe: string;
  type: string;
  typeLabel: string;
  lifecycle: 'candidate' | 'confirmed' | 'invalidated' | 'expired';
  anchorTime: string;
  availableAt: string;
  qualityScore: number;
  qualityComponents: {
    ruleFit: number;
    volumeConfirmation: number;
    symmetry: number;
    residualMargin: number;
  };
  coordinates: Record<string, any>;
  triggerPrice?: number;
  invalidationPrice?: number;
  description: string;
}

export interface ForecastItem {
  id: string;
  symbol: string;
  horizon: '1h' | '4h' | '24h';
  issuedAt: string;
  targetAt: string;
  dataCutoff: string;
  lastPrice: number;
  q10: number;
  q50: number; // Median projection
  q90: number;
  intervalWidth: number;
  directionProbabilities: {
    up: number;
    neutral: number;
    down: number;
  };
  model: string;
  validationPassed: boolean;
  pinballLossVsBaseline: number;
  empiricalCoverage: number;
}

export interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  source: string;
  canonicalUrl: string;
  publishedAt: string;
  firstSeenAt: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  relevance: number;
  mappedSymbols: string[];
}

export interface AiExplanation {
  summary: string;
  bullishEvidence: string[];
  bearishEvidence: string[];
  conflictingSignals: string[];
  triggers: string[];
  invalidation: string[];
  limitations: string[];
  sourceCitations: string[];
  snapshotHash?: string;
}

// ─── Deterministic Candle Generator for Demo Mode ────────────────────────────

export function generateDeterministicCandles(
  symbol: string,
  timeframe: string,
  count = 120,
): CandleData[] {
  const basePrice = symbol.startsWith('BTC')
    ? 65000
    : symbol.startsWith('ETH')
    ? 2500
    : symbol.startsWith('SOL')
    ? 140
    : symbol.startsWith('BNB')
    ? 570
    : 10;

  const stepSeconds =
    timeframe === '5m'
      ? 300
      : timeframe === '15m'
      ? 900
      : timeframe === '1h'
      ? 3600
      : timeframe === '4h'
      ? 14400
      : 86400;

  const now = Math.floor(Date.now() / 1000);
  const startTime = now - count * stepSeconds;

  const candles: CandleData[] = [];
  let currentPrice = basePrice;

  // Use a pseudo-random seed based on symbol characters
  let seed = symbol.split('').reduce((acc, c) => acc + c.charCodeAt(0), 42);
  const pseudoRand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  for (let i = 0; i < count; i++) {
    const time = startTime + i * stepSeconds;
    const volatility = currentPrice * 0.008;
    const delta = (pseudoRand() - 0.485) * volatility;
    const open = currentPrice;
    const close = Math.max(open + delta, currentPrice * 0.5);
    const high = Math.max(open, close) + pseudoRand() * volatility * 0.6;
    const low = Math.min(open, close) - pseudoRand() * volatility * 0.6;
    const volume = Math.round((pseudoRand() * 500 + 100) * (basePrice > 1000 ? 1 : 100));

    candles.push({
      time,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
    });

    currentPrice = close;
  }

  return candles;
}

// ─── API Client Methods with Graceful Fallbacks ──────────────────────────────

export async function fetchInstruments(): Promise<Instrument[]> {
  try {
    const res = await fetch(`${API_BASE}/v1/instruments`, { cache: 'no-store' });
    if (!res.ok) throw new Error('API failed');
    const data = await res.json();
    return data && data.length > 0 ? data : DEFAULT_INSTRUMENTS;
  } catch {
    return DEFAULT_INSTRUMENTS;
  }
}

export async function fetchCandles(
  symbol: string,
  timeframe: string,
): Promise<CandleData[]> {
  try {
    const res = await fetch(
      `${API_BASE}/v1/candles?symbol=${symbol}&timeframe=${timeframe}&pageSize=200`,
      { cache: 'no-store' },
    );
    if (!res.ok) throw new Error('Candles API failed');
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return data.map((c: any) => ({
        time: Math.floor(new Date(c.open_time || c.openTime).getTime() / 1000),
        open: parseFloat(c.open),
        high: parseFloat(c.high),
        low: parseFloat(c.low),
        close: parseFloat(c.close),
        volume: parseFloat(c.volume),
      }));
    }
  } catch {
    // Fall back to deterministic demo candles
  }
  return generateDeterministicCandles(symbol, timeframe, 150);
}

export async function fetchPatterns(symbol?: string): Promise<PatternItem[]> {
  const mockPatterns: PatternItem[] = [
    {
      id: 'pat-01',
      symbol: 'BTCUSDT',
      timeframe: '1h',
      type: 'support_resistance',
      typeLabel: 'Support Zone Cluster',
      lifecycle: 'confirmed',
      anchorTime: new Date(Date.now() - 3600000 * 8).toISOString(),
      availableAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      qualityScore: 88,
      qualityComponents: { ruleFit: 92, volumeConfirmation: 84, symmetry: 88, residualMargin: 88 },
      coordinates: { zoneMin: 66500, zoneMax: 66800, touches: 3 },
      triggerPrice: 67100,
      invalidationPrice: 66100,
      description: '3-pivot confirmed horizontal demand cluster at 66,500 - 66,800 USDT',
    },
    {
      id: 'pat-02',
      symbol: 'BTCUSDT',
      timeframe: '4h',
      type: 'double_bottom',
      typeLabel: 'Double Bottom',
      lifecycle: 'candidate',
      anchorTime: new Date(Date.now() - 3600000 * 48).toISOString(),
      availableAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      qualityScore: 79,
      qualityComponents: { ruleFit: 80, volumeConfirmation: 76, symmetry: 82, residualMargin: 78 },
      coordinates: { pivot1: 65200, pivot2: 65350, neckline: 68200 },
      triggerPrice: 68450,
      invalidationPrice: 64900,
      description: 'Trough separation 28 bars (allowed 5-80), difference 0.32 ATR (≤0.75 ATR)',
    },
    {
      id: 'pat-03',
      symbol: 'ETHUSDT',
      timeframe: '1h',
      type: 'ascending_triangle',
      typeLabel: 'Ascending Triangle',
      lifecycle: 'confirmed',
      anchorTime: new Date(Date.now() - 3600000 * 36).toISOString(),
      availableAt: new Date(Date.now() - 3600000 * 18).toISOString(),
      qualityScore: 84,
      qualityComponents: { ruleFit: 88, volumeConfirmation: 80, symmetry: 85, residualMargin: 83 },
      coordinates: { horizontalResistance: 2715, ascendingSlope: 0.85, touchCount: 5 },
      triggerPrice: 2725,
      invalidationPrice: 2610,
      description: 'Flat ceiling at 2,715 with higher lows trendline across 42 bars',
    },
    {
      id: 'pat-04',
      symbol: 'SOLUSDT',
      timeframe: '15m',
      type: 'range_breakout',
      typeLabel: 'Range Breakout + Retest',
      lifecycle: 'confirmed',
      anchorTime: new Date(Date.now() - 900000 * 16).toISOString(),
      availableAt: new Date(Date.now() - 900000 * 8).toISOString(),
      qualityScore: 86,
      qualityComponents: { ruleFit: 90, volumeConfirmation: 88, symmetry: 82, residualMargin: 84 },
      coordinates: { rangeHigh: 152.5, rangeLow: 147.0, breakoutBar: 153.2 },
      triggerPrice: 153.8,
      invalidationPrice: 151.8,
      description: 'Close 0.42 ATR beyond 152.50 established boundary with successful retest',
    },
    {
      id: 'pat-05',
      symbol: 'BTCUSDT',
      timeframe: '15m',
      type: 'bullish_engulfing',
      typeLabel: 'Bullish Engulfing',
      lifecycle: 'confirmed',
      anchorTime: new Date(Date.now() - 900000 * 4).toISOString(),
      availableAt: new Date(Date.now() - 900000 * 1).toISOString(),
      qualityScore: 82,
      qualityComponents: { ruleFit: 85, volumeConfirmation: 84, symmetry: 80, residualMargin: 79 },
      coordinates: { open1: 67350, close1: 67120, open2: 67080, close2: 67480 },
      triggerPrice: 67500,
      invalidationPrice: 67050,
      description: 'Opposite real bodies, full enclosure of prior bar with 1.4x relative volume',
    },
  ];

  if (symbol) {
    return mockPatterns.filter((p) => p.symbol === symbol);
  }
  return mockPatterns;
}

export async function fetchForecasts(symbol?: string): Promise<ForecastItem[]> {
  const items: ForecastItem[] = [
    {
      id: 'fc-btc-1h',
      symbol: 'BTCUSDT',
      horizon: '1h',
      issuedAt: new Date(Date.now() - 1800000).toISOString(),
      targetAt: new Date(Date.now() + 1800000).toISOString(),
      dataCutoff: new Date(Date.now() - 1860000).toISOString(),
      lastPrice: 67845.2,
      q10: 66950.0,
      q50: 68120.0,
      q90: 69280.0,
      intervalWidth: 2330.0,
      directionProbabilities: { up: 0.48, neutral: 0.32, down: 0.20 },
      model: 'gradient_boosted_quantile_v1.0',
      validationPassed: true,
      pinballLossVsBaseline: -6.8,
      empiricalCoverage: 81.5,
    },
    {
      id: 'fc-btc-4h',
      symbol: 'BTCUSDT',
      horizon: '4h',
      issuedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      targetAt: new Date(Date.now() + 3600000 * 2).toISOString(),
      dataCutoff: new Date(Date.now() - 3600000 * 2.1).toISOString(),
      lastPrice: 67845.2,
      q10: 65800.0,
      q50: 68450.0,
      q90: 70800.0,
      intervalWidth: 5000.0,
      directionProbabilities: { up: 0.44, neutral: 0.31, down: 0.25 },
      model: 'gradient_boosted_quantile_v1.0',
      validationPassed: true,
      pinballLossVsBaseline: -5.4,
      empiricalCoverage: 79.2,
    },
    {
      id: 'fc-eth-1h',
      symbol: 'ETHUSDT',
      horizon: '1h',
      issuedAt: new Date(Date.now() - 1200000).toISOString(),
      targetAt: new Date(Date.now() + 2400000).toISOString(),
      dataCutoff: new Date(Date.now() - 1260000).toISOString(),
      lastPrice: 2642.8,
      q10: 2595.0,
      q50: 2655.0,
      q90: 2715.0,
      intervalWidth: 120.0,
      directionProbabilities: { up: 0.38, neutral: 0.37, down: 0.25 },
      model: 'gradient_boosted_quantile_v1.0',
      validationPassed: true,
      pinballLossVsBaseline: -5.9,
      empiricalCoverage: 82.0,
    },
  ];

  if (symbol) {
    return items.filter((f) => f.symbol === symbol);
  }
  return items;
}

export async function fetchNews(symbol?: string): Promise<NewsItem[]> {
  const allNews: NewsItem[] = [
    {
      id: 'n-01',
      title: 'Bitcoin Spot ETF Net Inflows Hit 4-Week High Led by BlackRock IBIT',
      excerpt: 'Institutional spot products absorbed over $420M in fresh capital across consecutive trading sessions, reinforcing spot order book depth.',
      source: 'CryptoPanic Verified Wire',
      canonicalUrl: 'https://cryptopanic.com/news/101',
      publishedAt: new Date(Date.now() - 1800000).toISOString(),
      firstSeenAt: new Date(Date.now() - 1700000).toISOString(),
      sentiment: 'bullish',
      relevance: 0.96,
      mappedSymbols: ['BTCUSDT', 'BTC'],
    },
    {
      id: 'n-02',
      title: 'Ethereum Layer-2 Blob Gas Usage Surges Past Target Equilibrium',
      excerpt: 'Blob base fees experienced a brief spike as rollup batch frequencies elevated following decentralized exchange volume surges.',
      source: 'CoinDesk RSS',
      canonicalUrl: 'https://coindesk.com/eth-blob-surge',
      publishedAt: new Date(Date.now() - 7200000).toISOString(),
      firstSeenAt: new Date(Date.now() - 7000000).toISOString(),
      sentiment: 'neutral',
      relevance: 0.89,
      mappedSymbols: ['ETHUSDT', 'ETH', 'ARBUSDT', 'OPUSDT'],
    },
    {
      id: 'n-03',
      title: 'Solana DeFi Total Value Locked Crosses $6.2 Billion Milestone',
      excerpt: 'DEX turnover and liquidity pools on Solana saw accelerated fee revenue metrics over the preceding 7-day period.',
      source: 'Blockworks Wire',
      canonicalUrl: 'https://blockworks.co/solana-tvl',
      publishedAt: new Date(Date.now() - 14400000).toISOString(),
      firstSeenAt: new Date(Date.now() - 14200000).toISOString(),
      sentiment: 'bullish',
      relevance: 0.92,
      mappedSymbols: ['SOLUSDT', 'SOL'],
    },
    {
      id: 'n-04',
      title: 'Global Macro: Federal Reserve Minutes Signal Measured Easing Stance',
      excerpt: 'Central bank officials noted persistent progress on core inflation but emphasized data dependency regarding future rate trajectory.',
      source: 'Reuters Financial',
      canonicalUrl: 'https://reuters.com/fed-minutes',
      publishedAt: new Date(Date.now() - 28800000).toISOString(),
      firstSeenAt: new Date(Date.now() - 28600000).toISOString(),
      sentiment: 'neutral',
      relevance: 0.78,
      mappedSymbols: ['BTCUSDT', 'ETHUSDT'],
    },
  ];

  if (symbol) {
    const s = symbol.toUpperCase();
    return allNews.filter((n) => n.mappedSymbols.some((sym) => sym.includes(s) || s.includes(sym)));
  }
  return allNews;
}

export async function requestAiExplanation(
  symbol: string,
  snapshotData?: any,
): Promise<AiExplanation> {
  try {
    const res = await fetch(`${API_BASE}/v1/explanations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        snapshotId: `snap-${symbol}-${Date.now()}`,
        snapshot: snapshotData || { symbol, price: 67845.2, indicators: { rsi: 58, ema20: 67100 } },
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.summary) return data;
    }
  } catch {
    // Return structured default explanation verified against schema
  }

  return {
    summary: `${symbol} exhibits structural consolidation within a bullish trend channel on the 1h timeframe, supported by EMA 20/50 alignment and steady spot volume.`,
    bullishEvidence: [
      'Price maintains above EMA 20 (67,100) and EMA 50 (66,850) with expanding moving average slope.',
      'Confirmed Support Zone cluster established at 66,500 - 66,800 USDT with 3 distinct pivot touches.',
      'RSI (14) at 58.4 reflects constructive momentum without immediate overbought exhaustion.',
      'Relative volume on latest closed candle exceeds 20-bar baseline by 1.15x.',
    ],
    bearishEvidence: [
      'Overhead resistance at 68,400 - 68,600 USDT has rejected previous two breakout attempts.',
      'MACD histogram shows mild positive divergence deceleration over the last 3 hours.',
    ],
    conflictingSignals: [
      'Shorter 15m timeframe displays range compression, while the 4h trend is in an active upward channel.',
    ],
    triggers: [
      'Confirmed hourly candle close above 68,450 USDT with volume > 1.25x 20-bar average confirms upward expansion.',
    ],
    invalidation: [
      'A sustained hourly close below the 66,500 USDT support zone invalidates the immediate bullish continuation premise.',
    ],
    limitations: [
      'Analysis derived from frozen closed-candle snapshot (delayed 3 bars for pivot confirmation).',
      'High-impact macroeconomic releases can override technical boundary behavior.',
      'Probabilities are bounded by quantile historical distributions and do not represent guaranteed outcomes.',
    ],
    sourceCitations: [
      'Binance Spot 1h Closed Candles (Anchor t-3)',
      'Quant Indicators: EMA 20/50/200, RSI 14 (Wilder), ATR 14',
      'CryptoPanic Verified Wire Snapshot #101',
    ],
    snapshotHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  };
}
