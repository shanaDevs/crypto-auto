import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { CandlesController } from './candles.controller';
import { CandlesService } from './candles.service';
import { IngestionProcessor } from './ingestion.processor';
import { DatabaseModule } from '../database/database.module';
import { ExchangeModule } from '../exchange/exchange.module';

@Module({
  imports: [
    DatabaseModule,
    ExchangeModule,
    BullModule.registerQueue({ name: 'ingestion' }),
  ],
  controllers: [CandlesController],
  providers: [CandlesService, IngestionProcessor],
  exports: [CandlesService],
})
export class CandlesModule {}
