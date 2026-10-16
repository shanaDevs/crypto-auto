import { Injectable, Logger } from '@nestjs/common';
import { BinanceAdapter } from './binance.adapter';
import { DemoAdapter } from './demo.adapter';
import { ExchangeAdapter } from './exchange-adapter.interface';

/**
 * ExchangeService — provider factory.
 * Selects Binance (live) or Demo adapter based on EXCHANGE_PROVIDER env var.
 * Falls back to Demo if Binance ping fails.
 */
@Injectable()
export class ExchangeService {
  private readonly logger = new Logger(ExchangeService.name);
  private adapter: ExchangeAdapter;

  constructor(
    private readonly binance: BinanceAdapter,
    private readonly demo: DemoAdapter,
  ) {
    const provider = process.env.EXCHANGE_PROVIDER ?? 'demo';
    if (provider === 'binance') {
      this.adapter = binance;
      this.logger.log('Exchange provider: Binance (live)');
    } else {
      this.adapter = demo;
      this.logger.log('Exchange provider: Demo (deterministic)');
    }
  }

  get current(): ExchangeAdapter {
    return this.adapter;
  }

  get isDemo(): boolean {
    return this.adapter.isDemo;
  }

  /** Try live; fall back to demo if ping fails */
  async ensureLiveOrFallback(): Promise<void> {
    if (!this.adapter.isDemo) {
      const ok = await this.adapter.ping();
      if (!ok) {
        this.logger.warn('Binance ping failed — falling back to Demo adapter');
        this.adapter = this.demo;
      }
    }
  }
}
