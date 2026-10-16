import { Injectable, Logger } from '@nestjs/common';
import {
  ExchangeAdapter,
  OHLCV,
  TickUpdate,
} from './exchange-adapter.interface';

/**
 * Deterministic Demo Adapter
 * ─────────────────────────
 * Generates synthetic OHLCV data seeded by symbol + open_time,
 * so results are stable across restarts (no random data labelled as real).
 *
 * A persistent DEMO badge must be visible in the UI when this adapter is active.
 */
@Injectable()
export class DemoAdapter implements ExchangeAdapter {
  readonly name = 'demo';
  readonly isDemo = true;

  private readonly logger = new Logger(DemoAdapter.name);

  private readonly TIMEFRAME_MS: Record<string, number> = {
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
  };

  private readonly SEED_PRICES: Record<string, number> = {
    BTCUSDT: 65000,
    ETHUSDT: 3200,
    BNBUSDT: 580,
    SOLUSDT: 170,
    XRPUSDT: 0.55,
    ADAUSDT: 0.45,
    AVAXUSDT: 38,
    DOGEUSDT: 0.12,
    DOTUSDT: 7.5,
    MATICUSDT: 0.65,
    LINKUSDT: 13.5,
    UNIUSDT: 8.8,
    ATOMUSDT: 9.2,
    LTCUSDT: 72,
    NEARUSDT: 5.5,
    ARBUSDT: 1.1,
    OPUSDT: 1.9,
    SUIUSDT: 1.3,
    INJUSDT: 28,
    TIAUSDT: 7.2,
  };

  /** Deterministic pseudo-random based on seed string */
  private prng(seed: string): () => number {
    let h = 0;
    for (let i = 0; i < seed.length; i++) {
      h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
    }
    return () => {
      h ^= h << 13; h ^= h >> 17; h ^= h << 5;
      return ((h >>> 0) / 0xFFFFFFFF);
    };
  }

  private generateCandle(
    symbol: string,
    openTime: Date,
    basePrice: number,
    tf: string,
  ): OHLCV {
    const seed = `${symbol}:${openTime.getTime()}:${tf}`;
    const rand = this.prng(seed);

    const volatility = basePrice * 0.008;
    const drift = (rand() - 0.5) * volatility;
    const open = basePrice + drift;
    const bodySize = (rand() - 0.5) * volatility * 1.5;
    const close = open + bodySize;
    const wickUp = rand() * volatility * 0.8;
    const wickDown = rand() * volatility * 0.8;
    const high = Math.max(open, close) + wickUp;
    const low = Math.min(open, close) - Math.max(wickDown, 0);
    const volume = (rand() * 500 + 100) * (basePrice > 1000 ? 1 : 1000);

    const tfMs = this.TIMEFRAME_MS[tf] ?? 3_600_000;
    const closeTime = new Date(openTime.getTime() + tfMs - 1);

    return {
      openTime,
      closeTime,
      open: open.toFixed(8),
      high: high.toFixed(8),
      low: Math.max(low, 0.000001).toFixed(8),
      close: close.toFixed(8),
      volume: volume.toFixed(4),
      isClosed: Date.now() > closeTime.getTime(),
    };
  }

  async fetchHistory(
    symbol: string,
    timeframe: string,
    limit = 500,
  ): Promise<OHLCV[]> {
    const tfMs = this.TIMEFRAME_MS[timeframe];
    if (!tfMs) throw new Error(`Unsupported timeframe: ${timeframe}`);

    const basePrice = this.SEED_PRICES[symbol.toUpperCase()] ?? 100;
    const now = Date.now();
    const currentBarOpen = Math.floor(now / tfMs) * tfMs;

    const candles: OHLCV[] = [];
    let price = basePrice;

    for (let i = limit - 1; i >= 0; i--) {
      const openTime = new Date(currentBarOpen - i * tfMs);
      const c = this.generateCandle(symbol, openTime, price, timeframe);
      price = parseFloat(c.close);
      candles.push(c);
    }

    this.logger.debug(`Demo: generated ${candles.length} candles for ${symbol} ${timeframe}`);
    return candles;
  }

  subscribe(
    symbol: string,
    timeframe: string,
    onTick: (tick: TickUpdate) => void,
    _onError: (err: Error) => void,
  ): () => void {
    const tfMs = this.TIMEFRAME_MS[timeframe] ?? 3_600_000;
    const basePrice = this.SEED_PRICES[symbol.toUpperCase()] ?? 100;
    const intervalMs = Math.min(tfMs / 10, 5_000); // tick every 5s max

    let lastPrice = basePrice;

    const timer = setInterval(() => {
      const now = Date.now();
      const openTimeMs = Math.floor(now / tfMs) * tfMs;
      const openTime = new Date(openTimeMs);
      const c = this.generateCandle(symbol, openTime, lastPrice, timeframe);
      lastPrice = parseFloat(c.close);

      onTick({
        symbol,
        openTime,
        closeTime: c.closeTime,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume,
        isClosed: c.isClosed,
        receivedAt: new Date(),
      });
    }, intervalMs);

    this.logger.log(`Demo WS started: ${symbol} ${timeframe} (tick every ${intervalMs}ms)`);

    return () => clearInterval(timer);
  }

  async ping(): Promise<boolean> {
    return true;
  }
}
