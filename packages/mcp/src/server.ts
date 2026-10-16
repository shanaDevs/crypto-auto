import {
  GetMarketSnapshotInputSchema,
  GetDetectedPatternsInputSchema,
  GetForecastInputSchema,
  GetCoinNewsInputSchema,
  GetAnalysisEvidenceInputSchema,
  McpToolDefinition,
  McpToolCallRequest,
  McpToolCallResponse,
} from './types';

export interface DataProvider {
  getMarketSnapshot(symbol: string, timeframe: string, includeIndicators: boolean): Promise<unknown>;
  getDetectedPatterns(symbol: string, timeframe?: string, lifecycle?: string, minQuality?: number, limit?: number): Promise<unknown>;
  getForecast(symbol: string, horizon: string): Promise<unknown>;
  getCoinNews(symbol: string, limit: number, sentiment?: string): Promise<unknown>;
  getAnalysisEvidence(snapshotId: string): Promise<unknown>;
}

export class PlatformMcpServer {
  private readonly tools: Record<string, McpToolDefinition> = {
    get_market_snapshot: {
      name: 'get_market_snapshot',
      description: 'Get latest validated market OHLCV snapshot, indicators, and staleness metrics for an instrument',
      inputSchema: {
        type: 'object',
        properties: {
          symbol: { type: 'string', description: 'Trading pair symbol, e.g. BTCUSDT' },
          timeframe: { type: 'string', enum: ['5m', '15m', '1h', '4h', '1d'], default: '1h' },
          includeIndicators: { type: 'boolean', default: true },
        },
        required: ['symbol'],
      },
    },
    get_detected_patterns: {
      name: 'get_detected_patterns',
      description: 'Get verified chart patterns with anchor coordinates, quality scores (0-100), and lifecycle state',
      inputSchema: {
        type: 'object',
        properties: {
          symbol: { type: 'string', description: 'Trading pair symbol, e.g. BTCUSDT' },
          timeframe: { type: 'string', enum: ['5m', '15m', '1h', '4h', '1d'] },
          lifecycle: { type: 'string', enum: ['candidate', 'confirmed', 'invalidated', 'expired'] },
          minQuality: { type: 'number', minimum: 0, maximum: 100, default: 60 },
          limit: { type: 'number', minimum: 1, maximum: 50, default: 10 },
        },
        required: ['symbol'],
      },
    },
    get_forecast: {
      name: 'get_forecast',
      description: 'Get probabilistic quantile price forecasts (q10, q50, q90) and directional probabilities for an instrument',
      inputSchema: {
        type: 'object',
        properties: {
          symbol: { type: 'string', description: 'Trading pair symbol, e.g. BTCUSDT' },
          horizon: { type: 'string', enum: ['1h', '4h', '24h'], default: '1h' },
        },
        required: ['symbol'],
      },
    },
    get_coin_news: {
      name: 'get_coin_news',
      description: 'Get verified, canonical coin-mapped news excerpts with sentiment tags and source citations',
      inputSchema: {
        type: 'object',
        properties: {
          symbol: { type: 'string', description: 'Asset or pair symbol, e.g. BTC' },
          limit: { type: 'number', minimum: 1, maximum: 20, default: 5 },
          sentiment: { type: 'string', enum: ['bullish', 'bearish', 'neutral'] },
        },
        required: ['symbol'],
      },
    },
    get_analysis_evidence: {
      name: 'get_analysis_evidence',
      description: 'Get frozen numerical analysis snapshot by ID or hash for auditability and prompt verification',
      inputSchema: {
        type: 'object',
        properties: {
          snapshotId: { type: 'string', description: 'Unique snapshot ID or SHA256 hash' },
        },
        required: ['snapshotId'],
      },
    },
  };

  constructor(private readonly provider: DataProvider) {}

  getToolDefinitions(): McpToolDefinition[] {
    return Object.values(this.tools);
  }

  async handleToolCall(request: McpToolCallRequest): Promise<McpToolCallResponse> {
    try {
      switch (request.tool) {
        case 'get_market_snapshot': {
          const input = GetMarketSnapshotInputSchema.parse(request.arguments);
          const result = await this.provider.getMarketSnapshot(input.symbol, input.timeframe, input.includeIndicators);
          return { id: request.id, result };
        }
        case 'get_detected_patterns': {
          const input = GetDetectedPatternsInputSchema.parse(request.arguments);
          const result = await this.provider.getDetectedPatterns(
            input.symbol,
            input.timeframe,
            input.lifecycle,
            input.minQuality,
            input.limit,
          );
          return { id: request.id, result };
        }
        case 'get_forecast': {
          const input = GetForecastInputSchema.parse(request.arguments);
          const result = await this.provider.getForecast(input.symbol, input.horizon);
          return { id: request.id, result };
        }
        case 'get_coin_news': {
          const input = GetCoinNewsInputSchema.parse(request.arguments);
          const result = await this.provider.getCoinNews(input.symbol, input.limit, input.sentiment);
          return { id: request.id, result };
        }
        case 'get_analysis_evidence': {
          const input = GetAnalysisEvidenceInputSchema.parse(request.arguments);
          const result = await this.provider.getAnalysisEvidence(input.snapshotId);
          return { id: request.id, result };
        }
        default:
          return {
            id: request.id,
            error: {
              code: 'TOOL_NOT_FOUND',
              message: `Tool "${request.tool}" is not exposed by this Platform MCP server. Permitted tools are: ${Object.keys(this.tools).join(', ')}`,
            },
          };
      }
    } catch (err: any) {
      return {
        id: request.id,
        error: {
          code: 'EXECUTION_ERROR',
          message: err.message || 'Unknown error occurred during tool execution',
        },
      };
    }
  }
}
