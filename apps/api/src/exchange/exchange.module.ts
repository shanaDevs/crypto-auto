import { Module } from '@nestjs/common';
import { ExchangeService } from './exchange.service';
import { BinanceAdapter } from './binance.adapter';
import { DemoAdapter } from './demo.adapter';

@Module({
  providers: [BinanceAdapter, DemoAdapter, ExchangeService],
  exports: [ExchangeService],
})
export class ExchangeModule {}
