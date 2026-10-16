import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import WebSocket from 'ws';
import {
  ExchangeAdapter,
  OHLCV,
  TickUpdate,
} from './exchange-adapter.interface';

const BINANCE_INTERVAL_MAP: Record<string, string> = {
  '5m': '5m',
  '15m': '15m',
  '1h': '1h',
  '4h': '4h',
  '1d': '1d',
};

@Injectable()
export class BinanceAdapter implements ExchangeAdapter {
  readonly name = 'binance';
  readonly isDemo = false;

  private readonly logger = new Logger(BinanceAdapter.name);
  private readonly baseUrl: string;
  private readonly wsBase = 'wss://stream.binance.com:9443/ws';

  constructor() {
    this.baseUrl = process.env.BINANCE_BASE_URL ?? 'https://api.binance.com';
  }

  async fetchHistory(
    symbol: string,
    timeframe: string,
    limit = 500,
  ): Promise<OHLCV[]> {
    const interval = BINANCE_INTERVAL_MAP[timeframe];
    if (!interval) throw new Error(`Unsupported timeframe: ${timeframe}`);

    const url = `${this.baseUrl}/api/v3/klines`;
    const response = await axios.get(url, {
      params: { symbol: symbol.toUpperCase(), interval, limit },
      timeout: 10_000,
    });

    const rows: any[][] = response.data;
    return rows.map((r) => {
      const openTime = new Date(r[0]);
      const closeTime = new Date(r[6]);
      const isNowClosed = Date.now() > closeTime.getTime();
      return {
        openTime,
        closeTime,
        open: String(r[1]),
        high: String(r[2]),
        low: String(r[3]),
        close: String(r[4]),
        volume: String(r[5]),
        isClosed: isNowClosed,
      };
    });
  }

  subscribe(
    symbol: string,
    timeframe: string,
    onTick: (tick: TickUpdate) => void,
    onError: (err: Error) => void,
  ): () => void {
    const stream = `${symbol.toLowerCase()}@kline_${timeframe}`;
    const wsUrl = `${this.wsBase}/${stream}`;
    let ws: WebSocket;
    let reconnectTimer: NodeJS.Timeout;
    let closed = false;

    const connect = () => {
      ws = new WebSocket(wsUrl);

      ws.on('message', (raw) => {
        try {
          const msg = JSON.parse(raw.toString());
          const k = msg.k;
          onTick({
            symbol: k.s,
            openTime: new Date(k.t),
            closeTime: new Date(k.T),
            open: k.o,
            high: k.h,
            low: k.l,
            close: k.c,
            volume: k.v,
            isClosed: k.x,
            receivedAt: new Date(),
          });
        } catch (err) {
          this.logger.warn(`WS parse error: ${err}`);
        }
      });

      ws.on('error', (err) => {
        this.logger.error(`Binance WS error [${stream}]: ${err.message}`);
        onError(err);
      });

      ws.on('close', () => {
        if (closed) return;
        this.logger.warn(`WS closed [${stream}] — reconnecting in 5s`);
        reconnectTimer = setTimeout(connect, 5_000);
      });

      ws.on('open', () => {
        this.logger.log(`Binance WS connected: ${stream}`);
      });
    };

    connect();

    return () => {
      closed = true;
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }

  async ping(): Promise<boolean> {
    try {
      await axios.get(`${this.baseUrl}/api/v3/ping`, { timeout: 5_000 });
      return true;
    } catch {
      return false;
    }
  }
}
