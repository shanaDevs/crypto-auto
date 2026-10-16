import { Process, Processor, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { CandlesService } from './candles.service';
import { ExchangeService } from '../exchange/exchange.service';
import { InstrumentsService } from '../instruments/instruments.service';
import { EventsGateway } from '../events/events.gateway';

export interface BackfillJobData {
  symbol: string;
  timeframe: string;
  limit?: number;
}

export interface SubscribeJobData {
  symbol: string;
  timeframe: string;
}

@Processor('ingestion')
export class IngestionProcessor {
  private readonly logger = new Logger(IngestionProcessor.name);
  private readonly activeSubscriptions = new Map<string, () => void>();

  constructor(
    private readonly candles: CandlesService,
    private readonly exchange: ExchangeService,
    private readonly instruments: InstrumentsService,
    private readonly events: EventsGateway,
  ) {}

  @Process('backfill')
  async handleBackfill(job: Job<BackfillJobData>) {
    const { symbol, timeframe, limit = 500 } = job.data;
    this.logger.log(`Backfilling ${symbol} ${timeframe} (${limit} candles)`);

    const instrument = await this.instruments.findBySymbol(symbol);
    if (!instrument) {
      this.logger.warn(`Instrument not found: ${symbol}`);
      return;
    }

    await this.exchange.ensureLiveOrFallback();
    const candles = await this.exchange.current.fetchHistory(symbol, timeframe, limit);

    let upserted = 0;
    for (const c of candles) {
      if (c.isClosed) {
        await this.candles.upsertClosed(instrument.id, timeframe, c);
        upserted++;
      }
    }

    this.logger.log(`Backfill complete: ${symbol} ${timeframe} — ${upserted} candles`);
    return { upserted };
  }

  @Process('subscribe')
  async handleSubscribe(job: Job<SubscribeJobData>) {
    const { symbol, timeframe } = job.data;
    const key = `${symbol}:${timeframe}`;

    if (this.activeSubscriptions.has(key)) {
      this.logger.debug(`Already subscribed: ${key}`);
      return;
    }

    const instrument = await this.instruments.findBySymbol(symbol);
    if (!instrument) return;

    await this.exchange.ensureLiveOrFallback();

    const unsubscribe = this.exchange.current.subscribe(
      symbol,
      timeframe,
      async (tick) => {
        await this.candles.upsertTick(instrument.id, timeframe, tick);
        const event = tick.isClosed ? 'candle.closed' : 'candle.updated';
        this.events.broadcast(event, {
          ...tick,
          symbol,
          timeframe,
          openTime: tick.openTime.toISOString(),
          closeTime: tick.closeTime.toISOString(),
          receivedAt: tick.receivedAt.toISOString(),
          demo: this.exchange.isDemo,
        });
      },
      (err) => {
        this.logger.error(`WS error for ${key}: ${err.message}`);
        this.activeSubscriptions.delete(key);
      },
    );

    this.activeSubscriptions.set(key, unsubscribe);
    this.logger.log(`Live subscription active: ${key}`);
  }

  @OnQueueFailed()
  onFailed(job: Job, err: Error) {
    this.logger.error(`Job ${job.name} #${job.id} failed: ${err.message}`);
  }
}
