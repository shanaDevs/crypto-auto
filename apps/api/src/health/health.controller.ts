import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DatabaseService } from '../database/database.service';
import { ExchangeService } from '../exchange/exchange.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly db: DatabaseService,
    private readonly exchange: ExchangeService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Platform health check' })
  async check() {
    const [dbOk, exchangeOk] = await Promise.all([
      this.db.ping(),
      this.exchange.current.ping(),
    ]);

    return {
      status: dbOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      demo: this.exchange.isDemo,
      services: {
        database: dbOk ? 'ok' : 'error',
        exchange: exchangeOk ? 'ok' : 'error',
        exchangeProvider: this.exchange.current.name,
      },
    };
  }
}
