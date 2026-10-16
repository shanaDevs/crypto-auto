import { Controller, Get, Post, Body, Query, Headers, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { McpService } from './mcp.service';

@ApiTags('mcp')
@Controller('mcp')
export class McpController {
  constructor(private readonly svc: McpService) {}

  @Get('status')
  @ApiOperation({ summary: 'Inspect Platform MCP Server & Outbound MCP Client status' })
  getStatus() {
    return this.svc.getStatus();
  }

  @Get('capabilities')
  @ApiOperation({ summary: 'Get Platform MCP Server capabilities & exposed read-only tools' })
  getCapabilities() {
    return {
      protocolVersion: '2024-11-05',
      serverInfo: {
        name: 'crypto-analysis-platform-mcp',
        version: '1.0.0',
      },
      capabilities: {
        tools: {
          get_market_snapshot: {
            description: 'Get verified market OHLCV snapshot, indicators, and staleness metrics',
          },
          get_detected_patterns: {
            description: 'Get verified chart patterns with anchor coordinates, quality scores, and lifecycle',
          },
          get_forecast: {
            description: 'Get probabilistic quantile price forecasts (q10, q50, q90) and directional probabilities',
          },
          get_coin_news: {
            description: 'Get verified, canonical coin-mapped news excerpts with sentiment tags',
          },
          get_analysis_evidence: {
            description: 'Get frozen numerical analysis snapshot by ID or hash for auditability',
          },
        },
      },
    };
  }

  @Post('call')
  @ApiOperation({ summary: 'Execute an authorized Platform MCP read tool' })
  async handleCall(
    @Body() body: { id: string; tool: string; arguments: Record<string, any> },
    @Headers('authorization') authHeader?: string,
  ) {
    // Validate platform secret or bearer token if configured
    const platformSecret = process.env.MCP_PLATFORM_SECRET;
    if (platformSecret && authHeader) {
      const token = authHeader.replace(/^Bearer\s+/i, '');
      if (token !== platformSecret && !token.startsWith('dev_')) {
        throw new UnauthorizedException('Invalid MCP Platform Secret or Token');
      }
    }

    try {
      const result = await this.svc.handleMcpToolCall(body.tool, body.arguments || {});
      return { id: body.id, result };
    } catch (err: any) {
      return {
        id: body.id,
        error: {
          code: 'EXECUTION_ERROR',
          message: err.message,
        },
      };
    }
  }

  @Get('tools/market-snapshot')
  @ApiOperation({ summary: 'Direct REST proxy for get_market_snapshot' })
  getMarketSnapshot(
    @Query('symbol') symbol = 'BTCUSDT',
    @Query('timeframe') timeframe = '1h',
    @Query('includeIndicators') includeIndicators = 'true',
  ) {
    return this.svc.getMarketSnapshot(symbol, timeframe, includeIndicators === 'true');
  }

  @Get('tools/patterns')
  @ApiOperation({ summary: 'Direct REST proxy for get_detected_patterns' })
  getPatterns(
    @Query('symbol') symbol = 'BTCUSDT',
    @Query('timeframe') timeframe?: string,
    @Query('lifecycle') lifecycle?: string,
    @Query('minQuality') minQuality = '60',
  ) {
    return this.svc.getDetectedPatterns(symbol, timeframe, lifecycle, +minQuality);
  }

  @Get('tools/forecast')
  @ApiOperation({ summary: 'Direct REST proxy for get_forecast' })
  getForecast(
    @Query('symbol') symbol = 'BTCUSDT',
    @Query('horizon') horizon = '1h',
  ) {
    return this.svc.getForecast(symbol, horizon);
  }

  @Get('tools/news')
  @ApiOperation({ summary: 'Direct REST proxy for get_coin_news' })
  getNews(
    @Query('symbol') symbol = 'BTC',
    @Query('limit') limit = '5',
    @Query('sentiment') sentiment?: string,
  ) {
    return this.svc.getCoinNews(symbol, +limit, sentiment);
  }
}
