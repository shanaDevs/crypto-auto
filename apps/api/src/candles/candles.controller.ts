import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CandlesService } from './candles.service';

@ApiTags('candles')
@Controller('candles')
export class CandlesController {
  constructor(private readonly svc: CandlesService) {}

  @Get()
  @ApiOperation({ summary: 'Get paginated closed candles for a symbol and timeframe' })
  @ApiQuery({ name: 'symbol', required: true })
  @ApiQuery({ name: 'timeframe', required: true, enum: ['5m','15m','1h','4h','1d'] })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  async list(
    @Query('symbol') symbol: string,
    @Query('timeframe') timeframe: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '200',
  ) {
    return this.svc.listCandles(symbol, timeframe, +page, +pageSize);
  }
}
