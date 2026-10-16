import { z } from 'zod';

// ─── Candle ────────────────────────────────────────────────────────────────

export const TimeframeSchema = z.enum(['5m', '15m', '1h', '4h', '1d']);
export type Timeframe = z.infer<typeof TimeframeSchema>;

export const CandleSchema = z.object({
  id: z.string().uuid(),
  instrumentId: z.string().uuid(),
  symbol: z.string(),
  timeframe: TimeframeSchema,
  openTime: z.string().datetime(),    // UTC ISO
  closeTime: z.string().datetime(),   // UTC ISO
  open: z.string(),                   // decimal string
  high: z.string(),
  low: z.string(),
  close: z.string(),
  volume: z.string(),
  isClosed: z.boolean(),
  isProvisional: z.boolean(),
  source: z.enum(['live', 'rest_history', 'demo']),
  receivedAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Candle = z.infer<typeof CandleSchema>;

// ─── Instrument ───────────────────────────────────────────────────────────

export const InstrumentSchema = z.object({
  id: z.string().uuid(),
  exchange: z.string(),
  marketType: z.enum(['spot', 'futures']),
  baseAsset: z.string(),
  quoteAsset: z.string(),
  symbol: z.string(),
  assetId: z.string().uuid().nullable(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
});
export type Instrument = z.infer<typeof InstrumentSchema>;

// ─── Pattern ──────────────────────────────────────────────────────────────

export const PatternTypeSchema = z.enum([
  'support_resistance',
  'double_top',
  'double_bottom',
  'ascending_triangle',
  'descending_triangle',
  'symmetrical_triangle',
  'upward_channel',
  'downward_channel',
  'range_breakout',
  'range_retest',
  'bullish_engulfing',
  'bearish_engulfing',
]);
export type PatternType = z.infer<typeof PatternTypeSchema>;

export const PatternLifecycleSchema = z.enum([
  'candidate',
  'confirmed',
  'invalidated',
  'expired',
]);
export type PatternLifecycle = z.infer<typeof PatternLifecycleSchema>;

export const PatternSchema = z.object({
  id: z.string().uuid(),
  instrumentId: z.string().uuid(),
  symbol: z.string(),
  timeframe: TimeframeSchema,
  type: PatternTypeSchema,
  lifecycle: PatternLifecycleSchema,
  anchorTime: z.string().datetime(),
  availableAt: z.string().datetime(),
  confirmedAt: z.string().datetime().nullable(),
  invalidatedAt: z.string().datetime().nullable(),
  expiredAt: z.string().datetime().nullable(),
  coordinates: z.record(z.unknown()),   // trendline pts, zone bounds, neckline
  qualityScore: z.number().min(0).max(100),
  qualityComponents: z.record(z.number()),
  detectorVersion: z.string(),
  detectorParams: z.record(z.unknown()),
  createdAt: z.string().datetime(),
});
export type Pattern = z.infer<typeof PatternSchema>;

// ─── Forecast ─────────────────────────────────────────────────────────────

export const ForecastHorizonSchema = z.enum(['1h', '4h', '24h']);
export type ForecastHorizon = z.infer<typeof ForecastHorizonSchema>;

export const ForecastSchema = z.object({
  id: z.string().uuid(),
  instrumentId: z.string().uuid(),
  symbol: z.string(),
  timeframe: TimeframeSchema,
  horizon: ForecastHorizonSchema,
  issuedAt: z.string().datetime(),
  dataCutoff: z.string().datetime(),
  targetAt: z.string().datetime(),
  modelVersion: z.string(),
  modelType: z.enum(['random_walk', 'hist_return', 'lgbm_quantile']),
  lastObservedPrice: z.string(),
  q10: z.string(),
  q50: z.string(),
  q90: z.string(),
  status: z.enum(['pending', 'scored', 'insufficient', 'experimental']),
  actualPrice: z.string().nullable(),
  scoredAt: z.string().datetime().nullable(),
});
export type Forecast = z.infer<typeof ForecastSchema>;

// ─── News Article ─────────────────────────────────────────────────────────

export const ArticleSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  excerpt: z.string(),
  url: z.string().url(),
  source: z.string(),
  publishedAt: z.string().datetime(),
  firstSeenAt: z.string().datetime(),
  fetchedAt: z.string().datetime(),
  coinIds: z.array(z.string()),
  relevance: z.number().min(0).max(1),
  sentiment: z.enum(['bullish', 'bearish', 'neutral']).nullable(),
});
export type Article = z.infer<typeof ArticleSchema>;

// ─── AI Explanation ───────────────────────────────────────────────────────

export const ExplanationSchema = z.object({
  id: z.string().uuid(),
  snapshotId: z.string().uuid(),
  summary: z.string(),
  bullishEvidence: z.array(z.string()),
  bearishEvidence: z.array(z.string()),
  conflictingSignals: z.array(z.string()),
  triggers: z.array(z.string()),
  invalidation: z.array(z.string()),
  limitations: z.array(z.string()),
  sourceCitations: z.array(z.string()),
  modelVersion: z.string(),
  promptVersion: z.string(),
  tokenUsage: z.object({ prompt: z.number(), completion: z.number() }),
  createdAt: z.string().datetime(),
});
export type Explanation = z.infer<typeof ExplanationSchema>;

// ─── WebSocket Events ──────────────────────────────────────────────────────

export type WsEventType =
  | 'candle.updated'
  | 'candle.closed'
  | 'analysis.ready'
  | 'pattern.changed'
  | 'alert.created'
  | 'provider.status';

export interface WsEvent<T = unknown> {
  event: WsEventType;
  data: T;
  ts: string; // ISO UTC
}

// ─── API Responses ────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

// ─── Provider Status ──────────────────────────────────────────────────────

export const ProviderStatusSchema = z.object({
  provider: z.string(),
  isLive: z.boolean(),
  isDemo: z.boolean(),
  isStale: z.boolean(),
  lastUpdateAt: z.string().datetime().nullable(),
  message: z.string().optional(),
});
export type ProviderStatus = z.infer<typeof ProviderStatusSchema>;
