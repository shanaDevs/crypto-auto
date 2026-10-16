import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { AuthModule } from './auth/auth.module';
import { InstrumentsModule } from './instruments/instruments.module';
import { CandlesModule } from './candles/candles.module';
import { PatternsModule } from './patterns/patterns.module';
import { ForecastsModule } from './forecasts/forecasts.module';
import { NewsModule } from './news/news.module';
import { AiModule } from './ai/ai.module';
import { AlertsModule } from './alerts/alerts.module';
import { McpModule } from './mcp/mcp.module';
import { EventsGateway } from './events/events.gateway';
import { HealthModule } from './health/health.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '../../.env' }),
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      redis: process.env.REDIS_URL ?? 'redis://localhost:6379',
    }),
    DatabaseModule,
    AuthModule,
    HealthModule,
    InstrumentsModule,
    CandlesModule,
    PatternsModule,
    ForecastsModule,
    NewsModule,
    AiModule,
    AlertsModule,
    McpModule,
  ],
  providers: [EventsGateway],
})
export class AppModule {}
