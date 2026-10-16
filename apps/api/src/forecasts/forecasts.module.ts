import { Module } from '@nestjs/common';
import { ForecastsController } from './forecasts.controller';
import { ForecastsService } from './forecasts.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ForecastsController],
  providers: [ForecastsService],
  exports: [ForecastsService],
})
export class ForecastsModule {}
