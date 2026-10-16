import { z } from 'zod';

// ─── Platform MCP Read Tools Schemas ─────────────────────────────────────────

export const GetMarketSnapshotInputSchema = z.object({
  symbol: z.string().describe('Trading pair symbol, e.g. BTCUSDT'),
  timeframe: z.enum(['5m', '15m', '1h', '4h', '1d']).default('1h'),
  includeIndicators: z.boolean().default(true),
});
export type GetMarketSnapshotInput = z.infer<typeof GetMarketSnapshotInputSchema>;

export const GetDetectedPatternsInputSchema = z.object({
  symbol: z.string().describe('Trading pair symbol, e.g. BTCUSDT'),
  timeframe: z.enum(['5m', '15m', '1h', '4h', '1d']).optional(),
  lifecycle: z.enum(['candidate', 'confirmed', 'invalidated', 'expired']).optional(),
  minQuality: z.number().min(0).max(100).default(60),
  limit: z.number().min(1).max(50).default(10),
});
export type GetDetectedPatternsInput = z.infer<typeof GetDetectedPatternsInputSchema>;

export const GetForecastInputSchema = z.object({
  symbol: z.string().describe('Trading pair symbol, e.g. BTCUSDT'),
  horizon: z.enum(['1h', '4h', '24h']).default('1h'),
});
export type GetForecastInput = z.infer<typeof GetForecastInputSchema>;

export const GetCoinNewsInputSchema = z.object({
  symbol: z.string().describe('Trading pair or asset symbol, e.g. BTC'),
  limit: z.number().min(1).max(20).default(5),
  sentiment: z.enum(['bullish', 'bearish', 'neutral']).optional(),
});
export type GetCoinNewsInput = z.infer<typeof GetCoinNewsInputSchema>;

export const GetAnalysisEvidenceInputSchema = z.object({
  snapshotId: z.string().describe('Unique snapshot ID or snapshot SHA256 hash'),
});
export type GetAnalysisEvidenceInput = z.infer<typeof GetAnalysisEvidenceInputSchema>;

// ─── MCP Protocol Message Types ─────────────────────────────────────────────

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface McpToolCallRequest {
  id: string;
  tool: string;
  arguments: Record<string, unknown>;
}

export interface McpToolCallResponse {
  id: string;
  result?: unknown;
  error?: {
    code: string;
    message: string;
  };
}

export interface McpServerCapabilities {
  tools: Record<string, McpToolDefinition>;
  resources?: Record<string, unknown>;
  prompts?: Record<string, unknown>;
}

export interface McpClientConfig {
  serverUrl: string;
  token?: string;
  transport: 'sse' | 'stdio' | 'websocket';
  timeoutMs?: number;
  allowedTools?: string[];
}
