import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { OHLCV, TickUpdate } from '../exchange/exchange-adapter.interface';

@Injectable()
export class CandlesService {
  private readonly logger = new Logger(CandlesService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Upsert a closed candle (from REST history backfill).
   * Unique key: (instrument_id, timeframe, open_time)
   */
  async upsertClosed(instrumentId: string, timeframe: string, candle: OHLCV): Promise<void> {
    await this.db.query(
      `INSERT INTO candles
         (instrument_id, timeframe, open_time, close_time, open, high, low, close, volume,
          is_closed, is_provisional, source, received_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,TRUE,FALSE,'rest_history',NOW(),NOW())
       ON CONFLICT (instrument_id, timeframe, open_time)
       DO UPDATE SET
         high = GREATEST(EXCLUDED.high, candles.high),
         low  = LEAST(EXCLUDED.low, candles.low),
         close = EXCLUDED.close,
         volume = EXCLUDED.volume,
         is_closed = TRUE,
         source = EXCLUDED.source,
         updated_at = NOW()
       WHERE candles.is_closed = FALSE`,
      [
        instrumentId, timeframe,
        candle.openTime.toISOString(), candle.closeTime.toISOString(),
        candle.open, candle.high, candle.low, candle.close, candle.volume,
      ],
    );
  }

  /**
   * Upsert a live tick (provisional or closing).
   * When isClosed=true, mark candle as finalized.
   */
  async upsertTick(instrumentId: string, timeframe: string, tick: TickUpdate): Promise<void> {
    const source = tick.isClosed ? 'live' : 'live';
    await this.db.query(
      `INSERT INTO candles
         (instrument_id, timeframe, open_time, close_time, open, high, low, close, volume,
          is_closed, is_provisional, source, received_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),NOW())
       ON CONFLICT (instrument_id, timeframe, open_time)
       DO UPDATE SET
         high = EXCLUDED.high,
         low  = EXCLUDED.low,
         close = EXCLUDED.close,
         volume = EXCLUDED.volume,
         is_closed = EXCLUDED.is_closed,
         is_provisional = EXCLUDED.is_provisional,
         updated_at = NOW()`,
      [
        instrumentId, timeframe,
        tick.openTime.toISOString(), tick.closeTime.toISOString(),
        tick.open, tick.high, tick.low, tick.close, tick.volume,
        tick.isClosed, !tick.isClosed, source,
      ],
    );
  }

  /**
   * Fetch closed candles for an instrument + timeframe.
   * Only CLOSED candles are used for analysis.
   */
  async getClosedCandles(
    instrumentId: string,
    timeframe: string,
    limit = 500,
    before?: Date,
  ) {
    const params: any[] = [instrumentId, timeframe, limit];
    let whereClause = 'AND open_time < $4';
    if (before) params.push(before.toISOString());
    else { whereClause = ''; }

    return this.db.query(
      `SELECT * FROM candles
       WHERE instrument_id = $1 AND timeframe = $2 AND is_closed = TRUE
       ${whereClause}
       ORDER BY open_time DESC
       LIMIT $3`,
      params,
    );
  }

  /** Get the latest candle for status/staleness checks */
  async getLatestCandle(instrumentId: string, timeframe: string) {
    const rows = await this.db.query(
      `SELECT * FROM candles
       WHERE instrument_id = $1 AND timeframe = $2
       ORDER BY open_time DESC LIMIT 1`,
      [instrumentId, timeframe],
    );
    return rows[0] ?? null;
  }

  /** Paginated endpoint response */
  async listCandles(
    symbol: string,
    timeframe: string,
    page = 1,
    pageSize = 200,
  ) {
    const offset = (page - 1) * pageSize;
    const rows = await this.db.query(
      `SELECT c.* FROM candles c
       JOIN instruments i ON c.instrument_id = i.id
       WHERE i.symbol = $1 AND c.timeframe = $2 AND c.is_closed = TRUE
       ORDER BY c.open_time DESC
       LIMIT $3 OFFSET $4`,
      [symbol, timeframe, pageSize, offset],
    );
    const totalRows = await this.db.query(
      `SELECT COUNT(*) FROM candles c
       JOIN instruments i ON c.instrument_id = i.id
       WHERE i.symbol = $1 AND c.timeframe = $2 AND c.is_closed = TRUE`,
      [symbol, timeframe],
    );
    return {
      items: rows.reverse(), // ascending for charting
      total: parseInt(totalRows[0]?.count ?? '0'),
      page,
      pageSize,
    };
  }
}
