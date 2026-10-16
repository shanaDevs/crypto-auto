import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { DatabaseModule } from '../database/database.module';
import { ExchangeModule } from '../exchange/exchange.module';

@Module({
  imports: [DatabaseModule, ExchangeModule],
  controllers: [HealthController],
})
export class HealthModule {}
