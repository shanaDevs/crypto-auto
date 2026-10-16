import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import axios from 'axios';

const TOP_20_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT',
  'ADAUSDT', 'DOGEUSDT', 'AVAXUSDT', 'LINKUSDT', 'DOTUSDT',
  'NEARUSDT', 'SUIUSDT', 'APTUSDT', 'MATICUSDT', 'ATOMUSDT',
  'ARBUSDT', 'OPUSDT', 'LTCUSDT', 'UNIUSDT', 'FTMUSDT',
];

@Injectable()
export class InstrumentsService {
  private readonly logger = new Logger(InstrumentsService.name);
  private cachedTickers: any[] = [];
  private lastFetched = 0;

  constructor(private readonly db: DatabaseService) {}

  async findAll(activeOnly = true) {
    try {
      const sql = activeOnly
        ? `SELECT * FROM instruments WHERE is_active = TRUE ORDER BY sort_order`
        : `SELECT * FROM instruments ORDER BY sort_order`;
      const rows = await this.db.query(sql);
      if (rows && rows.length > 0) return rows;
    } catch {
      // Database offline — fetch live Binance tickers
    }

    // Return Live Binance 24h Data
    return this.fetchLiveBinanceTickers();
  }

  async fetchLiveBinanceTickers() {
    const now = Date.now();
    if (this.cachedTickers.length > 0 && now - this.lastFetched < 3000) {
      return this.cachedTickers;
    }

    try {
      const symbolsParam = JSON.stringify(TOP_20_SYMBOLS);
      const res = await axios.get(`https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(symbolsParam)}`, {
        timeout: 5000,
      });

      const list = res.data.map((t: any, idx: number) => {
        const base = t.symbol.replace('USDT', '');
        return {
          id: String(idx + 1),
          symbol: t.symbol,
          baseAsset: base,
          quoteAsset: 'USDT',
          marketType: 'spot',
          isActive: true,
          price: parseFloat(t.lastPrice),
          change24h: parseFloat(t.priceChangePercent),
          high24h: parseFloat(t.highPrice),
          low24h: parseFloat(t.lowPrice),
          volume24h: parseFloat(t.volume),
          source: 'binance_live',
        };
      });

      this.cachedTickers = list;
      this.lastFetched = now;
      return list;
    } catch (err: any) {
      this.logger.warn(`Failed to fetch live Binance tickers: ${err.message}`);
      return this.cachedTickers;
    }
  }

  async findById(id: string) {
    try {
      const rows = await this.db.query(`SELECT * FROM instruments WHERE id = $1`, [id]);
      if (rows[0]) return rows[0];
    } catch {}
    const all = await this.findAll();
    return all.find((i: any) => i.id === id) ?? null;
  }

  async findBySymbol(symbol: string) {
    try {
      const rows = await this.db.query(`SELECT * FROM instruments WHERE symbol = $1 AND is_active = TRUE`, [symbol]);
      if (rows[0]) return rows[0];
    } catch {}
    const all = await this.findAll();
    return all.find((i: any) => i.symbol === symbol.toUpperCase()) ?? {
      id: symbol.toLowerCase(),
      symbol: symbol.toUpperCase(),
      baseAsset: symbol.replace('USDT', ''),
      quoteAsset: 'USDT',
    };
  }
}
